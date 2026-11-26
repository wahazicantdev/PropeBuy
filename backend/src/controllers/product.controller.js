import { attachRatings } from "../utils/review.helper.js";
import prisma from "../config/prismaClient.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import { cleanInt, cleanPrice } from "../utils/format.helper.js";
import { checkLowStock } from "../utils/checkLowStock.helper.js";
// Sizes, colors and pack sizes with their own price and stock
import { parseVariants, saveVariants, activeVariants } from "../utils/variant.helper.js";
// Buyers see the store name, never the real name
import { toPublicSeller, withPublicSellers } from "../utils/seller.helper.js";
// Delivery fee per product, capped by weight (11-26)
import { deliveryProblem } from "../config/delivery.js";

// ── PRODUCT PHOTOS ─────────────────────────────────────
// Max photos per product, matching the 4 gallery slots on the product page
const MAX_PHOTOS = 4;

// Files sent as "images" (new) or "image" (old single field)
const photoFiles = (req) => [
  ...(req.files?.images || []),
  ...(req.files?.image || []),
];

// Product photos must be pictures — the shared uploader also allows PDFs
// for verification documents, so block those here
const hasNonImage = (files) => files.some((f) => !f.mimetype.startsWith("image/"));

// Uploads all photos at once and returns their URLs in the same order
const uploadPhotos = (files) =>
  Promise.all(files.map((f) => uploadToCloudinary(f.buffer, "products").then((u) => u.secure_url)));

// ── RANDOM FEED HELPERS ────────────────────────────────
// Products per scroll step on the Browse page
const FEED_PAGE_SIZE = 24;

// Same seed, same order. mulberry32 random numbers from a hash of the seed.
const seededShuffle = (list, seed) => {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...list].sort((x, y) => x - y);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

// ── CREATE PRODUCT ─────────────────────────────────────
// Seller only
export const createProduct = async (req, res) => {
  const { name, description, price, stock, categoryId, weightKg, deliveryFee } = req.body;

  // Validate required fields
  if (!name || !price || !stock || !categoryId) {
    return res.status(400).json({
      success: false,
      message: "Name, price, stock, and category are required",
    });
  }

  // Weight and delivery fee, capped by the delivery fee guide
  if (weightKg === undefined || weightKg === "" || deliveryFee === undefined || deliveryFee === "") {
    return res.status(400).json({ success: false, message: "Weight and delivery fee are required" });
  }
  const feeError = deliveryProblem(weightKg, deliveryFee);
  if (feeError) return res.status(400).json({ success: false, message: feeError });

  // Seller must be verified before listing products
  if (req.user.accountStatus !== "VERIFIED") {
    return res.status(403).json({
      success: false,
      message: "Your account must be verified before listing products",
    });
  }

  // Buyers see the store name, so it must exist before the first listing
  const owner = await prisma.user.findUnique({ where: { id: req.user.id }, select: { storeName: true } });
  if (!owner?.storeName) {
    return res.status(400).json({
      success: false,
      message: "Set your store name first. Buyers see it instead of your real name.",
      needsStoreName: true,
    });
  }

  // Seller must have a barangay assigned
  if (!req.user.barangayId) {
    return res.status(400).json({
      success: false,
      message: "Your account must be assigned to a barangay",
    });
  }

  // Others is open-ended, so the seller must confirm a physical good
  if (await needsDeliverableConfirmation(categoryId, req.body)) {
    return res.status(400).json({
      success: false,
      message: "Please confirm this is a physical item that can be picked up or delivered",
    });
  }

  // Up to 4 photos, pictures only
  const files = photoFiles(req);
  if (files.length > MAX_PHOTOS || hasNonImage(files)) {
    return res.status(400).json({
      success: false,
      message: `Upload up to ${MAX_PHOTOS} photos (JPG or PNG)`,
    });
  }
  // Optional variations, checked before any upload
  const variants = parseVariants(req.body.variants);
  if (variants?.error) {
    return res.status(400).json({ success: false, message: variants.error });
  }

  const images = await uploadPhotos(files);
  // The first photo is the cover shown on cards, cart and orders
  const imageUrl = images[0] || null;

  const created = await prisma.product.create({
    data: {
      sellerId: req.user.id,
      barangayId: req.user.barangayId,
      categoryId: cleanInt(categoryId),
      name,
      description: description || null,
      price: cleanPrice(price),
      stock: cleanInt(stock),
      weightKg: Math.round(Number(weightKg) * 100) / 100,
      deliveryFee: cleanPrice(deliveryFee),
      imageUrl,
      images,
    },
  });
  // Variations set the product's price (lowest) and stock (total)
  if (variants?.list?.length) {
    await prisma.$transaction((tx) => saveVariants(tx, created.id, variants.list));
  }
  const product = await prisma.product.findUnique({
    where: { id: created.id },
    include: {
      variants: activeVariants,
      seller: {
        select: {
          id: true,
          storeName: true,
          accountStatus: true,
        },
      },
      barangay: {
        select: {
          id: true,
          name: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Check if initial stock is already low — notify seller
  await checkLowStock(product.id, req.user.id);

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: { ...product, seller: toPublicSeller(product.seller) },
  });
};

// ── GET ALL PRODUCTS ───────────────────────────────────
// Public — buyers can browse with filters
export const getProducts = async (req, res) => {
  // Extract query params for filtering
  // Example: /api/products?barangayId=5&categoryId=1&search=rice
  const { barangayId, categoryId, search, sellerId, seed, page } = req.query;

  // Build filter object dynamically
  // Only add filters that are actually provided
  const where = {
    isActive: true,
    stock: { gt: 0 }, // only show products with stock
    // A suspended or rejected seller's goods leave the feed (11-26)
    seller: { accountStatus: "VERIFIED" },
  };

  if (barangayId) {
    where.barangayId = cleanInt(barangayId);
  }

  if (categoryId) {
    where.categoryId = cleanInt(categoryId);
  }

  // Seller store page — one vendor's live listings
  if (sellerId) {
    where.sellerId = cleanInt(sellerId);
  }

  if (search) {
    where.name = {
      contains: search,
      mode: "insensitive", // case-insensitive search
    };
  }

  // ── RANDOM FEED (11-26) ─────────────────────────────
  // The Browse page sends a seed and a page number. Every matching id is
  // shuffled the same way for the same seed, so the next page never
  // repeats or skips a product, and a new visit gets a new order.
  let pageInfo = null;
  if (seed !== undefined && page !== undefined) {
    const ids = (await prisma.product.findMany({ where, select: { id: true } })).map((p) => p.id);
    const shuffled = seededShuffle(ids, String(seed));
    const pageNo = Math.max(1, cleanInt(page) || 1);
    const pageIds = shuffled.slice((pageNo - 1) * FEED_PAGE_SIZE, pageNo * FEED_PAGE_SIZE);
    where.id = { in: pageIds };
    pageInfo = { page: pageNo, total: ids.length, hasMore: pageNo * FEED_PAGE_SIZE < ids.length, order: pageIds };
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      // Option ids only — cards say "From" when a product has options
      variants: { where: { isActive: true }, select: { id: true } },
      seller: {
        select: {
          id: true,
          storeName: true,
          accountStatus: true,
          address: true,
          storeLat: true,
          storeLng: true,
        },
      },
      barangay: {
        select: {
          id: true,
          name: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Random feed: put the page back in its shuffled order
  if (pageInfo) {
    const pos = new Map(pageInfo.order.map((id, i) => [id, i]));
    products.sort((a, b) => pos.get(a.id) - pos.get(b.id));
  }

  res.status(200).json({
    success: true,
    count: products.length,
    // Product and seller ratings for the cards and store page
    data: withPublicSellers(await attachRatings(products)),
    ...(pageInfo ? { page: pageInfo.page, total: pageInfo.total, hasMore: pageInfo.hasMore } : {}),
  });
};

// True when the category is Others and the seller has not confirmed
const needsDeliverableConfirmation = async (categoryId, body) => {
  const category = await prisma.category.findUnique({
    where: { id: cleanInt(categoryId) },
  });
  return (
    category?.name.toLowerCase() === "others" &&
    body.deliverableConfirmed !== "true"
  );
};

// ── GET SINGLE PRODUCT ─────────────────────────────────
// Public — view product details
export const getProduct = async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: {
      id: cleanInt(id),
      isActive: true,
    },
    include: {
      variants: activeVariants,
      seller: {
        select: {
          id: true,
          storeName: true,
          accountStatus: true,
          offersDelivery: true,
          deliveryFee: true,
          address: true,
          storeLat: true,
          storeLng: true,
          barangay: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      barangay: {
        select: {
          id: true,
          name: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  // Product and seller rating for the detail page
  const [rated] = withPublicSellers(await attachRatings([product]));

  res.status(200).json({
    success: true,
    data: rated,
  });
};

// ── GET MY PRODUCTS ────────────────────────────────────
// Seller only — view own product listings
export const getMyProducts = async (req, res) => {
  const products = await prisma.product.findMany({
    where: {
      sellerId: req.user.id,
    },
    include: {
      variants: activeVariants,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      barangay: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
};

// ── UPDATE PRODUCT ─────────────────────────────────────
// Seller only — edit own product
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, categoryId, weightKg, deliveryFee } = req.body;

  // Check if product exists and belongs to this seller
  const product = await prisma.product.findUnique({
    where: { id: cleanInt(id) },
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  // Make sure seller can only edit their own products
  if (product.sellerId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to edit this product",
    });
  }

  // Weight and fee: whatever is sent, checked together with what is kept
  const sent = (x) => x !== undefined && x !== null && x !== "";
  const newWeight = sent(weightKg) ? Math.round(Number(weightKg) * 100) / 100 : Number(product.weightKg);
  const newFee = sent(deliveryFee) ? cleanPrice(deliveryFee) : Number(product.deliveryFee);
  if (sent(weightKg) || sent(deliveryFee)) {
    const feeError = deliveryProblem(newWeight, newFee);
    if (feeError) return res.status(400).json({ success: false, message: feeError });
  }

  // Only moving into Others needs a new confirmation
  const isCategoryChange =
    categoryId && cleanInt(categoryId) !== product.categoryId;
  if (isCategoryChange && (await needsDeliverableConfirmation(categoryId, req.body))) {
    return res.status(400).json({
      success: false,
      message: "Please confirm this is a physical item that can be picked up or delivered",
    });
  }

  // ── PHOTOS ─────────────────────────────────────────
  // Current photos — older products only have the single cover
  const current = product.images.length
    ? product.images
    : product.imageUrl ? [product.imageUrl] : [];
  const files = photoFiles(req);
  if (files.length > MAX_PHOTOS || hasNonImage(files)) {
    return res.status(400).json({
      success: false,
      message: `Upload up to ${MAX_PHOTOS} photos (JPG or PNG)`,
    });
  }
  // Optional variations — sent means replace the list, empty list removes them
  const variants = parseVariants(req.body.variants);
  if (variants?.error) {
    return res.status(400).json({ success: false, message: variants.error });
  }

  const added = await uploadPhotos(files);

  // photoOrder (JSON list) is the final gallery, cover first. Each entry
  // is a photo URL this product already has, or "new:N" for the Nth
  // uploaded file. Unknown URLs are dropped, so nobody can attach
  // someone else's photo.
  let images;
  if (req.body.photoOrder !== undefined) {
    let order = [];
    try {
      order = JSON.parse(req.body.photoOrder);
    } catch {
      order = [];
    }
    images = (Array.isArray(order) ? order : [])
      .map((entry) => {
        const m = /^new:(\d+)$/.exec(String(entry));
        if (m) return added[Number(m[1])];
        return current.includes(entry) ? entry : undefined;
      })
      .filter(Boolean);
  } else if (req.files?.image?.length) {
    // Old single "image" field: the new photo replaces the cover
    images = [...added, ...current.slice(1)];
  } else {
    // No photo changes sent: keep the current photos, add any new ones
    images = [...current, ...added];
  }
  images = [...new Set(images)];
  if (images.length > MAX_PHOTOS) {
    return res.status(400).json({
      success: false,
      message: `A product can have up to ${MAX_PHOTOS} photos`,
    });
  }
  const imageUrl = images[0] || null;

  // ── FIELD PATCHING RULE ───────────────────────────────
  // "0" and "" are falsy — plain `||` was silently ignoring
  // stock resets to zero and description clears. Explicit
  // undefined checks decide: sent → update, absent → keep.
  const updated = await prisma.product.update({
    where: { id: cleanInt(id) },
    data: {
      // Bug fix: cleanInts did not exist — every edit with a
      // category crashed with ReferenceError
      // Bug fix: explicit check lets stock reach 0 (sold out)
      name: name || product.name,
      description:
        description !== undefined && description !== null
          ? description || null // empty string clears it, on purpose
          : product.description,
      price:
        price !== undefined && price !== null && price !== ""
          ? cleanPrice(price)
          : product.price,
      stock:
        stock !== undefined && stock !== null && stock !== ""
          ? cleanInt(stock)
          : product.stock,
      categoryId:
        categoryId !== undefined && categoryId !== null && categoryId !== ""
          ? cleanInt(categoryId)
          : product.categoryId,
      weightKg: newWeight,
      deliveryFee: newFee,
      imageUrl,
      images,
    },
  });

  // Variations win over the plain price and stock: saving them
  // recalculates both. Products with variations ignore a plain stock edit.
  if (variants) {
    await prisma.$transaction((tx) => saveVariants(tx, updated.id, variants.list));
  } else {
    const hasVariants = await prisma.productVariant.count({ where: { productId: updated.id, isActive: true } });
    if (hasVariants) {
      await prisma.product.update({ where: { id: updated.id }, data: { price: product.price, stock: product.stock } });
    }
  }
  const updatedProduct = await prisma.product.findUnique({
    where: { id: updated.id },
    include: {
      variants: activeVariants,
      category: {
        select: { id: true, name: true },
      },
      barangay: {
        select: { id: true, name: true },
      },
    },
  });

  // Check if updated stock is low — notify seller
  await checkLowStock(updatedProduct.id, req.user.id);

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: updatedProduct,
  });
};

// ── DELETE PRODUCT ─────────────────────────────────────
// Seller only — soft delete own product
export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  // Check if product exists and belongs to this seller
  const product = await prisma.product.findUnique({
    where: { id: cleanInt(id) },
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  if (product.sellerId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to delete this product",
    });
  }

  if (!product.isActive) {
    return res.status(400).json({
      success: false,
      message: "Product is already deleted.",
    });
  }

  // Soft delete — set isActive to false
  // Hindi natin talaga dinelete para hindi masira ang order history
  await prisma.product.update({
    where: { id: cleanInt(id) },
    data: { isActive: false },
  });

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
};

// ── GET ALL BARANGAYS ──────────────────────────────────
// Public — for barangay dropdown filter
export const getBarangays = async (req, res) => {
  const barangays = await prisma.barangay.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  res.status(200).json({
    success: true,
    data: barangays,
  });
};

// ── GET ALL CATEGORIES ─────────────────────────────────
// Public — for category filter
export const getCategories = async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  // A to Z, but the catch-all Others always comes last
  categories.sort((a, b) => (a.name === "Others") - (b.name === "Others"));

  res.status(200).json({
    success: true,
    data: categories,
  });
};
