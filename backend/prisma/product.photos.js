// ── MATCHING PRODUCT PHOTOS ────────────────────────────────
// Gives every demo and evaluation product its own image that matches its
// name. The images were drawn by code (product.art.js), not downloaded.
// No two products share an image; each product shows its one image in all
// 4 gallery slots.
// Images are already on Cloudinary and listed in product.photos.json, so
// this script only updates imageUrl and images.
// Touches only products of demo sellers (@demo.com) and evaluation
// vendors (vendorNN.eval@propebuy.test) whose name is in the JSON.
// Products a seller added themselves are never changed.
// Safe to re-run: the same product always gets the same photo.
//
// Usage (in backend/):  npm run productPhotos
import { readFileSync } from "node:fs";
// House Prisma client — loads env.js automatically on import
import prisma from "../src/config/prismaClient.js";

// { note, groups: { [group]: { names: [...], photos: [{ url, file }] } } }
const { groups } = JSON.parse(readFileSync(new URL("./product.photos.json", import.meta.url), "utf8"));

// Demo sellers and evaluation vendors only
const seedSeller = {
  OR: [{ email: { endsWith: "@demo.com" } }, { email: { startsWith: "vendor", endsWith: ".eval@propebuy.test" } }],
};

async function main() {
  let updated = 0;
  for (const [group, { names, photos }] of Object.entries(groups)) {
    // Stable order (name, then id) so a re-run gives each product the same photo
    const products = await prisma.product.findMany({
      where: { name: { in: names }, seller: seedSeller },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: { id: true },
    });

    // Never reuse a photo: stop and say so if the list is too short
    if (products.length > photos.length) {
      console.log(`${group}: ${products.length} products but only ${photos.length} photos. Extra products keep their old photo.`);
    }

    // One photo per product, shown in all 4 slots (cover first)
    for (const [i, p] of products.slice(0, photos.length).entries()) {
      const url = photos[i].url;
      await prisma.product.update({
        where: { id: p.id },
        data: { imageUrl: url, images: [url, url, url, url] },
      });
      updated++;
    }
    console.log(`${group}: ${Math.min(products.length, photos.length)} products updated`);
  }
  console.log(`\nDone. ${updated} products now have their own matching photo.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
