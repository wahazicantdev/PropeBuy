import { cleanInt, cleanPrice } from "./format.helper.js";

// ── PRODUCT VARIANTS (Yoy, 11-17) ──────────────────────
// A product can have options like sizes, colors or pack sizes, each with
// its own price and stock. When a product has variants:
//   product.price = the lowest variant price ("from ₱X" on cards)
//   product.stock = the total stock of all its variants
// so browse, filters and low-stock alerts keep working unchanged.

export const MAX_VARIANTS = 20;

// Reads the "variants" form field (JSON list).
// Returns undefined when not sent (keep as is), or { error }, or
// { list: [{ id?, name, price, stock }] } — an empty list removes them.
export const parseVariants = (raw) => {
  if (raw === undefined) return undefined;
  let list;
  try {
    list = typeof raw === "string" ? JSON.parse(raw || "[]") : raw;
  } catch {
    return { error: "Variations could not be read. Please try again." };
  }
  if (!Array.isArray(list)) return { error: "Variations could not be read. Please try again." };
  if (list.length > MAX_VARIANTS) return { error: `A product can have up to ${MAX_VARIANTS} variations` };

  const seen = new Set();
  const clean = [];
  for (const v of list) {
    const name = typeof v?.name === "string" ? v.name.trim().replace(/\s+/g, " ") : "";
    const price = Number(String(v?.price ?? "").replace(/,/g, ""));
    const stock = Number(v?.stock);
    if (!name || name.length > 50) return { error: "Each variation needs a name of up to 50 characters" };
    if (seen.has(name.toLowerCase())) return { error: `"${name}" is listed twice. Each variation needs its own name.` };
    if (!Number.isFinite(price) || price < 1 || price > 1000000) return { error: `Price of "${name}" must be at least ₱1` };
    if (!Number.isInteger(stock) || stock < 0 || stock > 100000) return { error: `Stock of "${name}" must be a whole number, 0 or more` };
    seen.add(name.toLowerCase());
    clean.push({ id: v.id ? cleanInt(v.id) : null, name, price: cleanPrice(price), stock });
  }
  return { list: clean };
};

// Saves the variant list of one product inside a transaction.
// Matching ids are updated, new ones created, missing ones switched off
// (never deleted, so old orders keep their variant). Then the product's
// price and stock are recalculated from the active variants.
// Returns true when the product now has variants.
export const saveVariants = async (tx, productId, list) => {
  const existing = await tx.productVariant.findMany({ where: { productId }, select: { id: true } });
  const ownIds = new Set(existing.map((v) => v.id));
  const keep = [];
  for (const v of list) {
    if (v.id && ownIds.has(v.id)) {
      await tx.productVariant.update({
        where: { id: v.id },
        data: { name: v.name, price: v.price, stock: v.stock, isActive: true },
      });
      keep.push(v.id);
    } else {
      const created = await tx.productVariant.create({
        data: { productId, name: v.name, price: v.price, stock: v.stock },
      });
      keep.push(created.id);
    }
  }
  await tx.productVariant.updateMany({
    where: { productId, id: { notIn: keep.length ? keep : [0] } },
    data: { isActive: false },
  });
  if (!list.length) return false;
  await syncProductFromVariants(tx, productId);
  return true;
};

// Product price = lowest active variant price, stock = their total
export const syncProductFromVariants = async (tx, productId) => {
  const active = await tx.productVariant.findMany({
    where: { productId, isActive: true },
    select: { price: true, stock: true },
  });
  if (!active.length) return;
  await tx.product.update({
    where: { id: productId },
    data: {
      price: Math.min(...active.map((v) => Number(v.price))),
      stock: active.reduce((s, v) => s + v.stock, 0),
    },
  });
};

// Prisma include for the active variants, cheapest first
export const activeVariants = {
  where: { isActive: true },
  orderBy: [{ price: "asc" }, { id: "asc" }],
  select: { id: true, name: true, price: true, stock: true },
};
