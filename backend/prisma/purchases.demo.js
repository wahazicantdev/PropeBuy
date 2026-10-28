// ── PURCHASES DEMO SEEDER ─────────────────────────────
// Rebuilds ORDER history so every demo seller's dashboard, analytics,
// and buyer order pages light up with believable activity.
//
// WIPE SCOPE — orders only (order_items + orders). Never touches
// users, sellers, products, barangays, categories, or the admin.
// Re-runs are safe: the same 70 orders rebuilt every time.
//
// Run order: npm run demo → npm run demoImage → npm run demoPurchases
import readline from "node:readline";
// House Prisma client — loads env.js automatically on import
import prisma from "../src/config/prismaClient.js";

// ── CONSOLE CONFIRM GATE ──────────────────────────────
// Destructive to orders — never runs without a human typing REBUILD
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

const answer = await ask(
  "This REPLACES every existing order with the 70-order demo set.\n" +
    "Users, sellers, and products are NOT touched.\n" +
    "Type REBUILD to continue, anything else to abort: "
);

if (answer.trim() !== "REBUILD") {
  console.log("Aborted. Nothing was changed.");
  rl.close();
  process.exit(0);
}
rl.close();

// ── MONEY HELPER ──────────────────────────────────────
// Kills float dust — every amount stays at 2 decimals, same as the
// house cleanPrice helper produces
const money = (n) => Math.round(n * 100) / 100;

// ── GROWTH CURVE — month weights, oldest → newest ─────
// 7+8+10+12+15+18 = 70 orders. Months are relative to the RUN DAY,
// so the analytics 6-month chart window always catches every bar.
const MONTH_WEIGHTS = [7, 8, 10, 12, 15, 18];

// ── STATUS PLANS — one cycle per seller ───────────────
// Codes: F=FULFILLED P=PROCESSING R=RESERVED C=CANCELLED X=FAILED zombie
// Sellers 0-5 get 9 orders, sellers 6-7 get 8 → 70 total.
// Every seller is guaranteed: FULFILLED ≥1, PROCESSING ≥2,
// RESERVED ≥1, CANCELLED =1. Sellers 3 and 6 carry the two
// FAILED GCash zombies (abandoned checkouts — paymentStatus FAILED
// is hand-set here because the live webhook only ever writes PAID states).
const PLAN_9 = ["F", "P", "R", "F", "F", "P", "F", "C", "F"];
const PLAN_8 = ["F", "P", "R", "F", "P", "F", "C", "F"];

const plans = [];
for (let i = 0; i < 8; i++) {
  const cycle = [...(i < 6 ? PLAN_9 : PLAN_8)];
  if (i === 3) cycle[4] = "X"; // seller 4 order → failed GCash zombie
  if (i === 6) cycle[7] = "X"; // seller 7 order → failed GCash zombie
  plans.push(cycle);
}

// ── CART SHAPES ───────────────────────────────────────
// Deterministic cycles for lines per order and units per line
const ITEMS_PLAN = [1, 2, 1, 2, 3, 1, 2]; // avg ~1.7 lines per order
const QTY_PLAN = [1, 2, 1, 1, 2, 3];      // avg ~1.7 units per line

// ── MIXED-SELLER CART SLOTS ───────────────────────────
// Three orders built from 3 consecutive sellers — proves the
// OrdersReceived slice hides other sellers' items (production truth)
const MIXED_SLOTS = [20, 40, 55];

// ── PAID-STATE RULES — mirror real transitions ────────
// F → PAID (money completed)        X → FAILED (abandoned GCash)
// R → PENDING (in-flight stock hold)
// P → GCash PAID (webhook did it) / CASH every 3rd PAID, rest PENDING
// C → alternate PAID / PENDING (both cancel stories on display)
const pickPaymentStatus = (code, method, slot) => {
  if (code === "F") return "PAID";
  if (code === "X") return "FAILED";
  if (code === "R") return "PENDING";
  if (code === "P") {
    return method === "GCASH" || slot % 3 === 0 ? "PAID" : "PENDING";
  }
  return slot % 2 === 0 ? "PAID" : "PENDING"; // C
};

// ── GLOBAL BOOKKEEPING ────────────────────────────────
// remaining — live stock ledger, decremented as drafts consume units
// deductions — total decrement per product, applied once in the tx
const remaining = new Map();
const deductions = new Map();

// ── ITEM PICKER — stock-honest rotation ───────────────
// Walks a seller's products from a rotating cursor and takes the first
// with enough remaining stock. Falls back to a single unit if the
// wanted qty no longer fits. consume=false (CANCELLED drafts) picks
// WITHOUT deducting — a cancel returns stock, so no double-take here.
const takeItem = (pools, sellerIdx, wantQty, consume = true) => {
  const pool = pools[sellerIdx];
  for (let k = 0; k < pool.list.length; k++) {
    const probe = pool.list[(pool.ptr + k) % pool.list.length];
    const left = remaining.get(probe.id) ?? 0;
    if (left >= wantQty) {
      if (consume) {
        remaining.set(probe.id, left - wantQty);
        deductions.set(probe.id, (deductions.get(probe.id) ?? 0) + wantQty);
      }
      pool.ptr = (pool.ptr + k + 1) % pool.list.length;
      return { product: probe, quantity: wantQty };
    }
  }
  // Wanted qty no longer fits anywhere in this pool → try a single unit
  if (wantQty > 1) return takeItem(pools, sellerIdx, 1, consume);
  return null;
};

async function main() {
  // ── STEP 1 — READ THE CURRENT DEMO WORLD (read-only) ──
  // Users and products are inputs ONLY — this seeder never writes them
  const buyers = await prisma.user.findMany({
    where: { role: "BUYER" },
    orderBy: { id: "asc" },
  });
  const sellers = await prisma.user.findMany({
    where: { role: "SELLER" },
    orderBy: { id: "asc" },
  });
  const sellable = await prisma.product.findMany({
    where: { isActive: true, stock: { gt: 0 } },
    orderBy: { id: "asc" },
  });

  // Seeder is tuned for the demo world — abort politely if off-shape
  if (sellers.length !== 8 || buyers.length !== 3 || sellable.length === 0) {
    console.log(
      `\nExpecting the demo world (8 sellers / 3 buyers / sellable products).\n` +
        `Found ${sellers.length} sellers / ${buyers.length} buyers / ${sellable.length} sellable products.\n` +
        `Run "npm run demo" first, then re-run this script.`
    );
    return;
  }

  // Stock ledger starts at each product's current stock
  sellable.forEach((p) => remaining.set(p.id, p.stock));

  // Per-seller rotation pools; the cursor spreads picks evenly
  const pools = sellers.map((seller) => ({
    owner: seller,
    list: sellable.filter((p) => p.sellerId === seller.id),
    ptr: 0,
  }));

  // ── STEP 2 — BUILD 70 DETERMINISTIC ORDER DRAFTS ──────
  // Slot s → seller s%8 · buyer s%3 · month from the growth curve.
  // salesCount walks each seller's personal status plan.
  const monthList = [];
  MONTH_WEIGHTS.forEach((w, m) => {
    for (let i = 0; i < w; i++) monthList.push(m);
  });

  // First slot index of every month bucket (0, 7, 15, 25, 37, 52)
  const monthStarts = MONTH_WEIGHTS.map((_, m) =>
    MONTH_WEIGHTS.slice(0, m).reduce((a, b) => a + b, 0),
  );

  // Month anchors relative to the RUN DAY — analytics computes its
  // 6-month window from "now", so run-relative dates keep every bar
  // inside the window no matter when this gets re-run
  const anchors = MONTH_WEIGHTS.map((_, m) => {
    const ref = new Date();
    ref.setMonth(ref.getMonth() - (MONTH_WEIGHTS.length - 1 - m));
    return { year: ref.getFullYear(), month: ref.getMonth() };
  });

  const statusByCode = {
    F: "FULFILLED",
    P: "PROCESSING",
    R: "RESERVED",
    C: "CANCELLED",
    X: "RESERVED", // zombie holds stock like a live unfinished order
  };

  const salesCount = new Array(sellers.length).fill(0);
  const sellerStats = sellers.map((s) => ({
    name: s.name,
    orders: 0,
    fulfilled: 0,
    revenue: 0,
  }));
  const drafts = [];

  for (let s = 0; s < monthList.length; s++) {
    const si = s % sellers.length;
    const pool = pools[si];
    const code = plans[si][salesCount[si]++];

    // Payment method — zombies are GCash; others ride 70/30 CASH/GCASH
    const paymentMethod = code === "X" ? "GCASH" : s % 10 < 7 ? "CASH" : "GCASH";
    const status = statusByCode[code];
    const paymentStatus = pickPaymentStatus(code, paymentMethod, s);
    const deliveryType = s % 3 === 0 ? "DELIVERY" : "PICKUP";

    // Date — anchored mid-month in UTC so the analytics month key
    // (toISOString().slice(0, 7)) never lands on a boundary day
    const m = monthList[s];
    const day = 2 + ((s - monthStarts[m]) * 3) % 26; // days 2..27, spread
    const hour = 9 + (s % 10); // shop-hours with variety
    const minute = (s * 7) % 60;
    const anchor = anchors[m];
    const createdAt = new Date(
      Date.UTC(anchor.year, anchor.month, day, hour, minute),
    );

    // Items — mixed carts span 3 sellers, normal carts rotate the pool.
    // Cancelled drafts pick without consuming (cancel = stock returned).
    const items = [];
    if (MIXED_SLOTS.includes(s)) {
      for (let d = 0; d < 3; d++) {
        const pick = takeItem(pools, (si + d) % sellers.length, 1, code !== "C");
        if (pick) items.push(pick);
      }
    } else {
      const lineCount = ITEMS_PLAN[s % ITEMS_PLAN.length];
      for (let n = 0; n < lineCount; n++) {
        const pick = takeItem(pools, si, QTY_PLAN[s % QTY_PLAN.length], code !== "C");
        if (pick) items.push(pick);
      }
    }
    if (items.length === 0) {
      throw new Error(
        `No sellable stock left for "${pool.owner.name}" at slot ${s} — ` +
          `restock demo products or trim the plan.`
      );
    }

    // Price snapshot — EXACTLY how processCheckout copies price at purchase
    items.forEach((it) => {
      it.price = Number(it.product.price);
    });
    const totalAmount = money(
      items.reduce((sum, it) => sum + it.price * it.quantity, 0),
    );

    // Seller-side stats for the closing report.
    // Mixed carts credit EVERY participating seller — analytics counts
    // any order containing a seller's product, so the preview must match.
    const participants = MIXED_SLOTS.includes(s)
      ? [0, 1, 2].map((d) => (si + d) % sellers.length)
      : [si];
    participants.forEach((pIdx) => {
      sellerStats[pIdx].orders += 1;
    });
    // FULFILLED revenue — only OWN lines count, exactly like the truth fix
    if (status === "FULFILLED") {
      const own = items.filter((it) => it.product.sellerId === pool.owner.id);
      sellerStats[si].fulfilled += 1;
      sellerStats[si].revenue = money(
        sellerStats[si].revenue +
          own.reduce((sum, it) => sum + it.price * it.quantity, 0),
      );
    }

    drafts.push({
      buyerId: buyers[s % buyers.length].id,
      status,
      paymentMethod,
      paymentStatus,
      deliveryType,
      totalAmount,
      createdAt,
      items,
    });
  }

  // ── STEP 3 — ATOMIC REBUILD ───────────────────────────
  // ONE transaction wipes + rebuilds + deducts stock. Any throw rolls
  // EVERYTHING back — the previous orders survive completely untouched.
  await prisma.$transaction(async (tx) => {
    // Wipe — order-owned data only. Users/products never see DELETE.
    await tx.orderItem.deleteMany({});
    await tx.order.deleteMany({});

    // Orders + items in — same shape processCheckout writes
    for (const draft of drafts) {
      const order = await tx.order.create({
        data: {
          buyerId: draft.buyerId,
          status: draft.status,
          paymentMethod: draft.paymentMethod,
          paymentStatus: draft.paymentStatus,
          deliveryType: draft.deliveryType,
          totalAmount: draft.totalAmount,
          paymongoLinkId: null, // fake data never meets PayMongo or the webhook
          createdAt: draft.createdAt,
        },
      });
      await tx.orderItem.createMany({
        data: draft.items.map((it) => ({
          orderId: order.id,
          productId: it.product.id,
          quantity: it.quantity,
          price: it.price,
        })),
      });
    }

    // Stock honesty — decrement exactly what real holds/purchases would
    for (const [productId, qty] of deductions) {
      await tx.product.update({
        where: { id: productId },
        data: { stock: { decrement: qty } },
      });
    }
  }, {
    // ~190 sequential round trips to Neon cannot fit Prisma's 5s default —
    // the transaction gets closed mid-loop and every next statement throws
    // P2028 "Transaction not found". Give the atomic rebuild a real budget.
    timeout: 60000, // ms — the full wipe + 70 orders + stock must fit
    maxWait: 10000, // ms — max time spent waiting for a transaction slot
  });

  // ── STEP 4 — FINAL STATE REPORT ───────────────────────
  const lineCount = await prisma.orderItem.count();
  const pipeline = await prisma.order.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  console.log("\nRebuilt demo purchases:");
  console.log(`  orders ........... ${drafts.length}`);
  console.log(`  order items ...... ${lineCount}`);
  pipeline.forEach((row) => {
    console.log(`  ${row.status.padEnd(12)} ${row._count.status}`);
  });
  console.log(
    `  platform revenue  ₱${money(
      sellerStats.reduce((a, st) => a + st.revenue, 0),
    ).toFixed(2)}`,
  );

  console.log("\nPer-seller dashboard preview (orders / fulfilled / revenue):");
  sellerStats.forEach((st) => {
    console.log(
      `  ${st.name.padEnd(10)} →  ${String(st.orders).padStart(2)} / ` +
        `${String(st.fulfilled).padStart(2)} /  ₱${st.revenue.toFixed(2)}`,
    );
  });

  console.log("\nUsers, sellers, products, barangays, categories — untouched.");
  console.log("Same demo credentials as npm run demo (demo1234).");
  console.log("Done.");
}

// Run + clean shutdown, same tail as demo.js
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });