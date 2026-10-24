// ── DEMO PRODUCT IMAGES — ONE-OFF SEED ────────────────────
// Downloads 7 freely-licensed Wikimedia Commons photos (one per
// category), uploads them to Cloudinary via the house helper
// uploadToCloudinary(buffer, folder), then attaches the returned
// secure_url to every demo product in that category.
// Wipes nothing. Runs: node prisma/images.demo.js
// Optional: node prisma/images.demo.js skip  → only fills EMPTY imageUrl,
// so any photos you already added via Edit Product survive.
import prisma from "../src/config/prismaClient.js";
// House helper — uploads to folder propebuy/products, same as Edit Product does
import { uploadToCloudinary } from "../src/config/cloudinary.js";

// ── THE 7 SOURCED PHOTOS ──────────────────────────────────
// All from Wikimedia Commons — replayed by URL, then re-hosted on
// yoy's own Cloudinary. License honored via the credits kept here.
const CATEGORY_IMAGES = {
  "Food and Packaged Goods": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6f/Canned_sardines_with_lemon.jpg/960px-Canned_sardines_with_lemon.jpg",
    // Photo: "Canned sardines with lemon" — Pannet — CC BY-SA 4.0
  },
  "Clothing and Apparel": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/32/Ambigram_Ideal%2C_polysymmetrical_logo_printed_on_a_green_T-shirt.jpg/960px-Ambigram_Ideal%2C_polysymmetrical_logo_printed_on_a_green_T-shirt.jpg",
    // Photo: "Ambigram Ideal T-shirt" — Basile Morin — CC BY-SA 4.0
  },
  "Home and Living": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/69/Traditional%2C_hand-woven_bamboo_baskets.jpg/960px-Traditional%2C_hand-woven_bamboo_baskets.jpg",
    // Photo: "Traditional, hand-woven bamboo baskets" — পাপৰি বৰা — CC0
  },
  "Health and Beauty": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bd/Nature_Bar_natural_soap_bar.jpg/960px-Nature_Bar_natural_soap_bar.jpg",
    // Photo: "Nature Bar natural soap bar" — MarliesVH — CC BY 4.0
  },
  "Electronics and Gadgets": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/12/Desk_Fan_on_Box.jpg/960px-Desk_Fan_on_Box.jpg",
    // Photo: "Desk Fan on Box" — Infrogmation of New Orleans — CC BY-SA 4.0
  },
  "Automotive Supplies": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/54/A_person_cleans_the_engine.jpg/960px-A_person_cleans_the_engine.jpg",
    // Photo: "A person cleans the engine" — Shixart1985 — CC BY 2.0
  },
  Others: {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/84/Eiffel_Tower_Keychain.jpg/960px-Eiffel_Tower_Keychain.jpg",
    // Photo: "Eiffel Tower Keychain" — AndonicO — CC BY 2.5
  },
};

async function main() {
  // CLI flag: "skip" = only touch products still missing an image
  const skipExisting = process.argv.includes("skip");

  // Pull categories fresh — names must match the seeded 7 exactly
  const categories = await prisma.category.findMany();
  const missing = categories.filter((c) => !CATEGORY_IMAGES[c.name]);
  if (categories.length !== 7 || missing.length > 0) {
    console.log(
      `Category mismatch (found ${categories.length}). Expected the 7 seeded categories. Aborting — nothing changed.`
    );
    return;
  }

  let totalUpdated = 0;

  // ── DOWNLOAD → UPLOAD → LINK, one category at a time ─────
  for (const cat of categories) {
    const plan = CATEGORY_IMAGES[cat.name];

    // DOWNLOAD — Node 22 global fetch, validate it is real image bytes
    const res = await fetch(plan.url);
    if (!res.ok) {
      throw new Error(`Download failed for ${cat.name} (HTTP ${res.status})`);
    }
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      throw new Error(`Source for ${cat.name} is not an image (${contentType})`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 10000) {
      // Broken/placeholder bytes — refuse, protect the data
      throw new Error(`Image for ${cat.name} looks broken (${buffer.length} bytes)`);
    }

    // UPLOAD — house Cloudinary helper, same folder as Edit Product
    const uploaded = await uploadToCloudinary(buffer, "products");
    if (!uploaded?.secure_url) {
      throw new Error(`Cloudinary upload failed for ${cat.name}`);
    }

    // LINK — every demo product in this category gets the same photo
    const updated = await prisma.product.updateMany({
      where: {
        categoryId: cat.id,
        // skip mode: leave already-attached photos untouched
        ...(skipExisting ? { imageUrl: null } : {}),
      },
      data: { imageUrl: uploaded.secure_url },
    });

    totalUpdated += updated.count;
    console.log(`${cat.name}: ${updated.count} products → ${uploaded.secure_url}`);
  }

  console.log(`\nDone. ${totalUpdated} products now carry real photos.`);
  console.log("Credits for the 7 source photos are preserved as comments at the top of this file.");
}

// Run + clean shutdown, same shape as the base seed
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });