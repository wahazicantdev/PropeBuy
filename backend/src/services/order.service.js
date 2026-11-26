import prisma from "../config/prismaClient.js";
import { cleanInt, cleanPrice } from "../utils/format.helper.js";
import {
  createCheckoutSession,
  verifyPaymentStatus,
  expireCheckoutSession,
} from "../utils/paymongo.helper.js";
import {
  notifyOrderStatus,
  notifyPaymentConfirmed,
  notifyNewOrder,
  notifyBuyerCancelled,
  notifySellerPaymentReceived,
} from "../utils/notification.helper.js";
import { checkLowStock } from "../utils/checkLowStock.helper.js";
import { toPublicSeller } from "../utils/seller.helper.js";
import { createEarnings, releaseEarnings, cancelEarnings } from "../utils/payout.helper.js";
// One trip per order: the highest product delivery fee (11-26)
import { orderDeliveryFee } from "../config/delivery.js";

// Error the buyer or seller should read — 400 keeps the message visible
// in production, where unknown 500 errors are hidden
const userError = (message) => Object.assign(new Error(message), { statusCode: 400 });

// ── CHECKOUT SERVICE ───────────────────────────────────
// Contains the full TPS logic and PayMongo integration
// Called by the checkout controller
export const processCheckout = async (
  buyerId,
  items,
  paymentMethod,
  deliveryType,
  addressId = null,
) => {
  // ── ATOMIC TRANSACTION ─────────────────────────────
  // All database operations here are ONE unit
  // Any failure = automatic ROLLBACK
  const order = await prisma.$transaction(async (tx) => {
    let totalAmount = 0;
    const validatedItems = [];
    // Sellers in this order — delivery allows only one
    const sellerIds = new Set();
    // Each product's own delivery fee (11-26)
    const productFees = [];

    // Process each item in the order
    for (const item of items) {
      const { productId, quantity } = item;
      const variantId = item.variantId ? cleanInt(item.variantId) : null;

      if (!productId || !quantity || quantity < 1) {
        throw userError("Invalid item — productId and quantity are required");
      }

      // ── LOCK THE ROW — PREVENTS DOUBLE SELLING ────
      // FOR UPDATE locks this specific product row
      // No concurrent transaction can touch it
      // until this transaction commits or rolls back
      const lockedProduct = await tx.$queryRaw`
        SELECT id, name, stock, price, "sellerId", "deliveryFee"
        FROM products
        WHERE id = ${cleanInt(productId)}
        AND "isActive" = true
        FOR UPDATE
      `;

      if (!lockedProduct || lockedProduct.length === 0) {
        throw userError(`Product with ID ${productId} not found`);
      }

      const product = lockedProduct[0];
      sellerIds.add(product.sellerId);
      // Delivery fee of each product, for the one-trip order fee below
      productFees.push({ deliveryFee: product.deliveryFee });

      // ── VARIANT — LOCKED THE SAME WAY ─────────────
      // A product with options needs one picked. Its row is locked too,
      // and its own price and stock apply.
      const activeVariantCount = await tx.productVariant.count({
        where: { productId: product.id, isActive: true },
      });
      let variant = null;
      if (activeVariantCount > 0 || variantId) {
        if (!variantId) throw userError(`Choose an option for "${product.name}"`);
        const lockedVariant = await tx.$queryRaw`
          SELECT id, name, stock, price
          FROM product_variants
          WHERE id = ${variantId}
          AND "productId" = ${product.id}
          AND "isActive" = true
          FOR UPDATE
        `;
        if (!lockedVariant?.length) throw userError(`That option of "${product.name}" is no longer available`);
        variant = lockedVariant[0];
        if (variant.stock < quantity) {
          throw userError(
            `Insufficient stock for "${product.name} (${variant.name})". ` +
              `Available: ${variant.stock}, Requested: ${quantity}`,
          );
        }
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: { decrement: quantity } },
        });
      }

      // ── STOCK CHECK ───────────────────────────────
      // If insufficient — throw triggers automatic ROLLBACK
      if (product.stock < quantity) {
        throw userError(
          `Insufficient stock for "${product.name}". ` +
            `Available: ${product.stock}, Requested: ${quantity}`,
        );
      }

      // ── ATOMIC STOCK DEDUCTION ────────────────────
      // decrement is atomic — safe against race conditions
      await tx.product.update({
        where: { id: cleanInt(productId) },
        data: { stock: { decrement: quantity } },
      });

      // The option's price when one was picked
      const unitPrice = cleanPrice(variant ? variant.price : product.price);
      const itemTotal = unitPrice * quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        productId: cleanInt(productId),
        variantId: variant ? variant.id : null,
        variantName: variant ? variant.name : null,
        quantity,
        price: unitPrice,
      });
    }

    // ── ONE STORE PER ORDER ───────────────────────
    // Every order belongs to one store, for pickup and delivery alike.
    // Mixed orders let one seller's status change move another seller's
    // items, and each store charges its own delivery fee (Yoy, 11-18).
    // Throwing here rolls back the stock already locked above.
    if (sellerIds.size !== 1) {
      throw userError(
        "You can check out items from one store at a time. Check out this store first, then come back for the rest of your cart.",
      );
    }

    // ── DELIVERY RULES ────────────────────────────
    // A seller who delivers and a saved buyer address. The address and
    // fee are copied onto the order.
    let deliveryAddress = null;
    let deliveryFee = 0;
    if (deliveryType === "DELIVERY") {
      const [sellerId] = sellerIds;
      const seller = await tx.user.findUnique({
        where: { id: sellerId },
        select: { offersDelivery: true },
      });
      if (!seller?.offersDelivery) {
        throw userError("This seller does not offer delivery. Please choose pickup.");
      }
      // A saved address the buyer picked, else their default (E2E #423)
      let chosen = null;
      if (addressId) {
        const saved = await tx.address.findFirst({
          where: { id: cleanInt(addressId), userId: buyerId },
          select: { address: true },
        });
        if (!saved) throw userError("That address is no longer saved. Pick another one.");
        chosen = saved.address;
      } else {
        const buyer = await tx.user.findUnique({
          where: { id: buyerId },
          select: { address: true },
        });
        chosen = buyer?.address || null;
      }
      if (!chosen) {
        throw userError(
          "Add your delivery address in your profile before choosing delivery.",
        );
      }
      deliveryAddress = chosen;
      // Each product has a fee set from its weight (11-26). One trip
      // carries the whole order, so the buyer pays the highest one.
      deliveryFee = cleanPrice(orderDeliveryFee(productFees));
    }

    // ── CREATE ORDER RECORD ───────────────────────
    const newOrder = await tx.order.create({
      data: {
        buyerId,
        status: "RESERVED",
        paymentMethod,
        paymentStatus: "PENDING",
        deliveryType,
        totalAmount,
        deliveryAddress,
        deliveryFee,
        // A fee waits for its online payment, no fee means nothing to pay
        deliveryFeeStatus: deliveryFee > 0 ? "PENDING" : null,
      },
    });

    // ── CREATE ORDER ITEMS ────────────────────────
    // createMany inserts all items in one efficient query
    await tx.orderItem.createMany({
      data: validatedItems.map((item) => ({
        orderId: newOrder.id,
        productId: item.productId,
        variantId: item.variantId,
        variantName: item.variantName,
        quantity: item.quantity,
        price: item.price,
      })),
    });

    // ── RETURN COMPLETE ORDER — PRISMA AUTO-COMMITS ──
    return await tx.order.findUnique({
      where: { id: newOrder.id },
      include: {
        orderItems: {
          include: {
            product: {
              // sellerId — the post-commit alerts route by seller
              select: { id: true, name: true, imageUrl: true, sellerId: true },
            },
          },
        },
        buyer: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  });

  // ── AFTER COMMIT — SELLER ALERTS ──────────────────
  // Runs only once the transaction has COMMITTED, so a rolled-back
  // checkout never alerts anyone. Alerts are fire-and-forget: a socket
  // or lookup failure must never fail an order that is already saved.
  try {
    // Count each seller's lines — one alert per seller, not per item
    const linesBySeller = new Map();
    for (const line of order.orderItems) {
      const sellerId = line.product.sellerId;
      linesBySeller.set(sellerId, (linesBySeller.get(sellerId) || 0) + 1);
    }
    for (const [sellerId, count] of linesBySeller) {
      notifyNewOrder(sellerId, order.id, count);
    }
    // Low stock — checkout is what actually drains stock, so this is
    // where the alert matters most (it used to fire only on edits)
    await Promise.all(
      order.orderItems.map((line) =>
        checkLowStock(line.product.id, line.product.sellerId),
      ),
    );
  } catch (err) {
    console.error("Post-checkout seller alerts failed:", err.message);
  }

  // ── AFTER COMMIT — GCASH PAYMENT ─────────────────
  // PayMongo called OUTSIDE transaction — intentional
  // External API calls must never be inside atomic transactions
  if (paymentMethod === "GCASH") {
    // GCash pays the items and the delivery fee together
    const payment = await createCheckoutSession(
      cleanPrice(order.totalAmount) + cleanPrice(order.deliveryFee),
      order.id,
      `PropeBuy Order #${order.id} — ${order.orderItems.length} item(s)${cleanPrice(order.deliveryFee) > 0 ? " + delivery fee" : ""}`,
    );

    // Save PayMongo session ID for webhook and status tracking
    // Reuses the paymongoLinkId column so no migration is needed
    await prisma.order.update({
      where: { id: order.id },
      data: { paymongoLinkId: payment.sessionId },
    });

    // Return order with GCash payment URL
    return { order, paymentUrl: payment.checkoutUrl };
  }

  // ── AFTER COMMIT — DELIVERY FEE FOR CASH ORDERS ──
  // Items stay cash on delivery, but the fee is paid online first, so a
  // seller never pays a rider for an order nobody receives
  if (paymentMethod === "CASH" && order.deliveryFeeStatus === "PENDING") {
    const payment = await createCheckoutSession(
      order.deliveryFee,
      order.id,
      `PropeBuy delivery fee — Order #${order.id}`,
    );
    await prisma.order.update({
      where: { id: order.id },
      data: { paymongoLinkId: payment.sessionId },
    });
    return { order, paymentUrl: payment.checkoutUrl };
  }

  // Cash pickup, or cash delivery with no fee — no payment gateway needed
  return { order, paymentUrl: null };
};

// ── GET BUYER ORDERS SERVICE ───────────────────────────
// Fetches all orders for a specific buyer
export const getBuyerOrders = async (buyerId) => {
  const orders = await prisma.order.findMany({
    where: { buyerId },
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              seller: {
                select: { id: true, storeName: true },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  // Store names only — the real seller name stays hidden from buyers
  return orders.map(publicOrderSellers);
};

// Swaps each item's seller for the public store name
const publicOrderSellers = (order) =>
  order && {
    ...order,
    orderItems: order.orderItems.map((i) =>
      i.product?.seller ? { ...i, product: { ...i.product, seller: toPublicSeller(i.product.seller) } } : i,
    ),
  };

// ── GET SINGLE ORDER SERVICE ───────────────────────────
// Fetches one order by ID with full relations
export const getOrderById = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: cleanInt(orderId) },
    include: {
      orderItems: {
        include: {
          // The buyer's rating, so the order page knows what is left
          review: { select: { rating: true, comment: true, createdAt: true } },
          product: {
            // sellerId added so getSellerOrder access check works
             select: {
              id: true,
              name: true,
              imageUrl: true,
              sellerId: true,
              // Vendor plus barangay, per item
              seller: { select: { id: true, storeName: true } },
              barangay: { select: { name: true } },
            },
          },
        },
      },
      // Refund state of a cancelled paid order — no seller money details
      earnings: {
        where: { status: { in: ["REFUND_DUE", "REFUNDED"] } },
        // refundGcashNumber is masked or removed in getOrder before it leaves
        select: { status: true, itemsAmount: true, deliveryFee: true, refundReference: true, refundedAt: true, refundGcashNumber: true },
      },
      // Buyer's barangay, shown on the seller's order page
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
          barangay: { select: { name: true } },
        },
      },
    },
  });
  // Buyers, sellers and admins all get the store name here
  return publicOrderSellers(order);
};

// ── GET SELLER ORDERS SERVICE ──────────────────────────
// Fetches orders containing this seller's products
export const getOrdersBySeller = async (sellerId) => {
  return await prisma.order.findMany({
    where: {
      orderItems: {
        // At least one item belongs to this seller
        some: { product: { sellerId } },
      },
    },
    include: {
      orderItems: {
        // Only this seller's items — not other sellers'
        where: { product: { sellerId } },
        include: {
          product: {
            select: { id: true, name: true, imageUrl: true, price: true },
          },
        },
      },
      buyer: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

// ── UPDATE ORDER STATUS SERVICE ────────────────────────
// Updates order status — restores stock if cancelled
export const changeOrderStatus = async (orderId, status, sellerId) => {
  const order = await prisma.order.findUnique({
    where: { id: cleanInt(orderId) },
    include: {
      orderItems: {
        include: { product: true },
      },
    },
  });

  if (!order) throw userError("Order not found");

  // Verify this order contains this seller's products
  const isSellerOrder = order.orderItems.some(
    (item) => item.product.sellerId === sellerId,
  );

  if (!isSellerOrder) throw userError("Not authorized to update this order");

  // Orders made before the one-store rule can hold another store's
  // items. Changing them would fulfil or cancel that store's goods too,
  // so only the PropeBuy admin can settle these.
  const otherStore = order.orderItems.some((item) => item.product.sellerId !== sellerId);
  if (otherStore) {
    throw userError(
      "This older order also has items from another store, so it cannot be updated here. Contact PropeBuy support.",
    );
  }

  // Closed orders stay closed — cancelling a fulfilled order would
  // return stock that was already handed over
  if (["FULFILLED", "CANCELLED"].includes(order.status)) {
    throw userError(`This order is already ${order.status.toLowerCase()}`);
  }

  // Cash delivery waits for the online delivery fee before work starts.
  // Cancelling is still allowed, and it returns the stock.
  if (
    ["PROCESSING", "FULFILLED"].includes(status) &&
    order.deliveryFeeStatus === "PENDING"
  ) {
    throw userError("Waiting for the buyer to pay the delivery fee online");
  }

  if (status === "CANCELLED") {
    // ── ATOMIC CANCELLATION ───────────────────────
    // Restore stock AND update status together
    // Both succeed or both fail
    await prisma.$transaction(async (tx) => {
      for (const item of order.orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
      await tx.order.update({
        where: { id: cleanInt(orderId) },
        data: { status: "CANCELLED" },
      });
    });
    // Online money not yet paid out goes back to the buyer
    await cancelEarnings(order.id);
  } else {
    await prisma.order.update({
      where: { id: cleanInt(orderId) },
      // Fulfilled orders get a date — ratings are required from here on
      data: {
        status,
        ...(status === "FULFILLED" ? { fulfilledAt: new Date() } : {}),
      },
    });
    // Fulfilled — the seller's held online money can now be paid out
    if (status === "FULFILLED") await releaseEarnings(order.id);
  }

  // ── REAL-TIME NOTIFICATION TO BUYER ───────────────
  // After status update — push notification to buyer via Socket.io
  // Buyer's page updates automatically without refresh
  const statusMessages = {
    PROCESSING: "Your order is now being processed by the seller",
    FULFILLED: "Your order has been fulfilled. Please rate your items.",
    CANCELLED: "Your order has been cancelled",
  };

  notifyOrderStatus(order.buyerId, order.id, status, statusMessages[status]);

  // Return updated order
  return await prisma.order.findUnique({
    where: { id: cleanInt(orderId) },
    include: {
      orderItems: {
        include: {
          product: { select: { id: true, name: true } },
        },
      },
    },
  });
};

// ── BUYER CANCELS A RESERVED ORDER ─────────────────────
// Allowed only before the seller starts processing. Stock goes back,
// and any online payment becomes a refund for the admin.
export const cancelOrderByBuyer = async (orderId, buyerId) => {
  const order = await prisma.order.findUnique({
    where: { id: cleanInt(orderId) },
    include: { orderItems: { include: { product: { select: { sellerId: true } } } } },
  });
  if (!order || order.buyerId !== buyerId) throw userError("Order not found");
  if (order.status !== "RESERVED") {
    throw userError("Only reserved orders can be cancelled. Ask the seller to cancel it.");
  }

  // Stock back and status change together — both or neither
  await prisma.$transaction(async (tx) => {
    // Only flips if it is still RESERVED, so a seller acting at the same
    // moment cannot be overwritten
    const flipped = await tx.order.updateMany({
      where: { id: order.id, status: "RESERVED" },
      data: { status: "CANCELLED" },
    });
    if (!flipped.count) throw userError("The seller already started this order");
    for (const item of order.orderItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
  });
  await cancelEarnings(order.id);

  // Tell each seller in the order
  const sellerIds = [...new Set(order.orderItems.map((i) => i.product.sellerId))];
  sellerIds.forEach((id) => notifyBuyerCancelled(id, order.id));
  return { id: order.id, status: "CANCELLED" };
};

// ── SETTLE AN ONLINE PAYMENT ───────────────────────────
// GCash orders: items and any fee are paid. Cash delivery orders: the
// online payment was the delivery fee only, so the items stay cash.
const settleOnlinePayment = async (order) => {
  // Record each seller's share first. If anything below fails, PayMongo
  // retries the webhook and this runs again without duplicates.
  await createEarnings(order.id);
  // Paid after it was cancelled (the buyer finished paying late): keep
  // it cancelled, record the payment, and queue the refund
  if (order.status === "CANCELLED") {
    await prisma.order.update({
      where: { id: order.id },
      data: order.paymentMethod === "CASH" ? { deliveryFeeStatus: "PAID" } : { paymentStatus: "PAID" },
    });
    await cancelEarnings(order.id);
    return;
  }
  if (order.paymentMethod === "CASH") {
    await prisma.order.update({
      where: { id: order.id },
      data: { deliveryFeeStatus: "PAID" },
    });
  } else {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        status: "PROCESSING",
        ...(order.deliveryFeeStatus ? { deliveryFeeStatus: "PAID" } : {}),
      },
    });
  }
  // Real-time notification to the buyer
  notifyPaymentConfirmed(order.buyerId, order.id);
  // And to every seller in the order, so their page updates too (E2E #420)
  const items = await prisma.orderItem.findMany({
    where: { orderId: order.id },
    select: { product: { select: { sellerId: true } } },
  });
  const sellerIds = [...new Set(items.map((i) => i.product.sellerId))];
  sellerIds.forEach((id) => notifySellerPaymentReceived(id, order.id, order.paymentMethod === "CASH"));
};

// True once the online part of this order is paid
const onlinePartPaid = (order) =>
  order.paymentMethod === "CASH"
    ? order.deliveryFeeStatus !== "PENDING"
    : order.paymentStatus === "PAID";

// ── CHECK PAYMENT STATUS SERVICE ───────────────────────
// Verifies GCash payment — uses PayMongo as fallback
export const confirmPaymentStatus = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: cleanInt(orderId) },
  });

  if (!order) throw userError("Order not found");

  // Already paid — return immediately
  if (onlinePartPaid(order)) {
    return {
      paymentStatus: order.paymentStatus,
      deliveryFeeStatus: order.deliveryFeeStatus,
      updated: false,
    };
  }

  // Check with PayMongo directly if we have a session id
  if (order.paymongoLinkId) {
    const paymongoStatus = await verifyPaymentStatus(order.paymongoLinkId);
    if (paymongoStatus === "paid") {
      await settleOnlinePayment(order);
      const fresh = await prisma.order.findUnique({ where: { id: order.id } });
      return {
        paymentStatus: fresh.paymentStatus,
        deliveryFeeStatus: fresh.deliveryFeeStatus,
        updated: true,
      };
    }
  }

  return {
    paymentStatus: order.paymentStatus,
    deliveryFeeStatus: order.deliveryFeeStatus,
    updated: false,
  };
};

// ── MARK CASH PAYMENT RECEIVED ─────────────────────────
// Seller confirms in-person cash collection on a CASH order
export const setPaymentStatus = async (orderId) => {
  // Flip payment status only — order status stays seller-controlled
  const updated = await prisma.order.update({
    where: { id: cleanInt(orderId) },
    data: { paymentStatus: "PAID" },
    include: {
      orderItems: {
        include: {
          product: { select: { id: true, name: true } },
        },
      },
    },
  });

  // Real-time ping to the buyer — money state changed
  notifyPaymentConfirmed(updated.buyerId, updated.id);

  return updated;
};

// ── PAY AGAIN ──────────────────────────────────────────
// The buyer closed or failed the PayMongo page (E2E #421). Gives a new
// payment page for the same order instead of forcing a cancel and re-order.
// GCash orders pay items + fee, cash delivery orders pay the fee only.
export const retryOnlinePayment = async (orderId, buyerId) => {
  const order = await prisma.order.findUnique({
    where: { id: cleanInt(orderId) },
    include: { orderItems: { select: { id: true } } },
  });
  if (!order || order.buyerId !== buyerId) throw userError("Order not found");
  if (order.status === "CANCELLED") throw userError("This order was cancelled");

  // Nothing left to pay online — cash pickup, or already paid
  const needsOnline =
    (order.paymentMethod === "GCASH" && order.paymentStatus === "PENDING") ||
    (order.paymentMethod === "CASH" && order.deliveryFeeStatus === "PENDING");
  if (!needsOnline) throw userError("This order has nothing left to pay online");

  if (order.paymongoLinkId) {
    // The old page may have gone through after all — settle it instead
    const check = await confirmPaymentStatus(order.id);
    if (check.updated) return { paid: true, paymentUrl: null };
    // Close the old page so only the new one can take money
    await expireCheckoutSession(order.paymongoLinkId).catch(() => false);
    // Paid in the moment between the check and the expire
    const recheck = await confirmPaymentStatus(order.id);
    if (recheck.updated) return { paid: true, paymentUrl: null };
  }

  const gcash = order.paymentMethod === "GCASH";
  const amount = gcash
    ? cleanPrice(order.totalAmount) + cleanPrice(order.deliveryFee)
    : order.deliveryFee;
  const description = gcash
    ? `PropeBuy Order #${order.id} — ${order.orderItems.length} item(s)${cleanPrice(order.deliveryFee) > 0 ? " + delivery fee" : ""}`
    : `PropeBuy delivery fee — Order #${order.id}`;
  const payment = await createCheckoutSession(amount, order.id, description);
  await prisma.order.update({
    where: { id: order.id },
    data: { paymongoLinkId: payment.sessionId },
  });
  return { paid: false, paymentUrl: payment.checkoutUrl };
};

// ── PROCESS WEBHOOK EVENT SERVICE ─────────────────────
export const processWebhookEvent = async (event) => {
  const eventType = event.data?.attributes?.type;

  // BUGFIX: this used to findFirst ANY pending GCash order and mark it
  // PAID — a payment for order B could settle an older order A. Now the
  // event must name the exact checkout session we stored at checkout.
  // Only checkout_session.payment.paid carries that session id; legacy
  // payment.paid / link.payment.paid events cannot be matched safely,
  // so they are ignored and the polling fallback settles those orders.
  if (eventType !== "checkout_session.payment.paid") return;

  // event.data.attributes.data is the checkout session object (cs_...)
  const sessionId = event.data?.attributes?.data?.id;
  if (!sessionId) return;

  // paymongoLinkId holds the session id saved right after commit
  const order = await prisma.order.findFirst({
    where: { paymongoLinkId: sessionId },
  });

  // Unknown session, or already settled — idempotent for PayMongo retries
  if (!order || onlinePartPaid(order)) return;

  // Same settlement as the polling path in confirmPaymentStatus
  await settleOnlinePayment(order);
};
