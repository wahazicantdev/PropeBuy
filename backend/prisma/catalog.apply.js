// ── APPLY THE DEMO CATALOG ─────────────────────────────────
// Turns every demo and evaluation product into a different item from
// catalog.data.js: new name, description, price and its own drawn image
// (shown in all 4 gallery slots). No two products end up the same.
// Touches only products of demo sellers (@demo.com) and evaluation
// vendors (vendorNN.eval@propebuy.test) that still carry a seed name
// (an old starter name or a catalog name). Products a seller added
// themselves, stock, orders and reviews are never changed.
// Each category keeps its own products, so a store's mix stays the same.
// Safe to re-run: products are matched in a fixed order (seller, then id).
//
// Usage (in backend/):  npm run demoCatalog
// Run it again after `npm run demo` or `npm run evalAccounts`.
import { readFileSync } from "node:fs";
// House Prisma client — loads env.js automatically on import
import prisma from "../src/config/prismaClient.js";
import { CATALOG, expandCatalog } from "./catalog.data.js";

// { note, items: { [name]: cloudinaryUrl } }
const { items: PHOTOS } = JSON.parse(readFileSync(new URL("./catalog.photos.json", import.meta.url), "utf8"));

// Names the demo and eval scripts create, before this catalog existed
const OLD_NAMES = [
  "Sardines Pack", "Rice 5kg Sack", "Instant Coffee Sticks (10s)", "Homemade Peanut Butter 250g",
  "Comfy Cotton Shirt", "Cotton Plain Shirt", "Everyday Jogger Shorts", "Uniform White Polo",
  "Mini Desk Fan", "USB Charging Cable 1m", "USB-C Charging Cable 1m", "LED Emergency Bulb",
  "Bamboo Storage Basket", "Woven Storage Basket", "Clothes Hanger Set (5s)", "Plastic Storage Bin 15L",
  "Herbal Soap Bar", "Herbal Bath Soap", "Toothpaste Family Size (150g)", "Sanitizing Alcohol 500ml",
  "Microfiber Car Cloth", "Microfiber Car Towel", "Motorcycle Basic Tool Set", "Tire Pressure Gauge",
  "Capiz Shell Keychain", "Souvenir Ref Magnet", "Handmade Woven Wallet",
];

// Demo sellers and evaluation vendors only
const seedSeller = {
  OR: [{ email: { endsWith: "@demo.com" } }, { email: { startsWith: "vendor", endsWith: ".eval@propebuy.test" } }],
};

async function main() {
  const categories = await prisma.category.findMany();
  let updated = 0;

  for (const [catName, bases] of Object.entries(CATALOG)) {
    const category = categories.find((c) => c.name === catName);
    if (!category) { console.log(`${catName}: category not in DB, skipped`); continue; }
    const catalog = expandCatalog(bases);
    const seedNames = [...OLD_NAMES, ...catalog.map((i) => i.name)];

    // Fixed order so a re-run gives every product the same item
    const products = await prisma.product.findMany({
      where: { categoryId: category.id, name: { in: seedNames }, seller: seedSeller },
      orderBy: [{ sellerId: "asc" }, { id: "asc" }],
      select: { id: true },
    });
    if (products.length > catalog.length) {
      console.log(`${catName}: ${products.length} products but only ${catalog.length} items. Extra products keep their old name.`);
    }

    // One catalog item per product, in a single transaction per category
    const updates = products.slice(0, catalog.length).map((p, i) => {
      const item = catalog[i];
      const url = PHOTOS[item.name];
      if (!url) throw new Error(`No image for "${item.name}" in catalog.photos.json`);
      return prisma.product.update({
        where: { id: p.id },
        data: { name: item.name, description: item.description, price: item.price, imageUrl: url, images: [url, url, url, url] },
      });
    });
    await prisma.$transaction(updates);
    updated += updates.length;
    console.log(`${catName}: ${updates.length} products updated`);
  }
  console.log(`\nDone. ${updated} products are now different items with their own image.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
