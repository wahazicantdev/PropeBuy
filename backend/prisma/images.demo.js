// ── DEMO PRODUCT IMAGES — ONE-OFF SEED ────────────────────
// Downloads 21 freely-licensed Wikimedia Commons photos (one per
// product template in demo.js), uploads each to Cloudinary via the
// house helper uploadToCloudinary(buffer, folder), then attaches the
// secure_url to every demo product with that exact name (all 8 sellers).
// Wipes nothing. Runs: npm run demoImage
// Optional: npm run demoImage -- skip  → only fills EMPTY imageUrl,
// so any photos you already added via Edit Product survive.
import prisma from "../src/config/prismaClient.js";
// House helper — uploads to folder propebuy/products, same as Edit Product does
import { uploadToCloudinary } from "../src/config/cloudinary.js";

// ── THE 21 SOURCED PHOTOS ─────────────────────────────────
// Keys MUST match PRODUCT_CATALOG names in demo.js exactly.
// All licenses verified via the Commons API: Public Domain / CC0 /
// CC BY / CC BY-SA only — no NonCommercial, no NoDerivs.
const PRODUCT_IMAGES = {
  // ── Food and Packaged Goods ──
  "Sardines Pack": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/Canned_sardines.jpg/960px-Canned_sardines.jpg",
    credit: "Canned sardines — ProjectManhattan — CC BY-SA 3.0",
  },
  "Rice 5kg Sack": {
    url: "https://upload.wikimedia.org/wikipedia/commons/d/dc/Basmati_Rice_Sack_%281%29.jpg",
    credit: "Basmati Rice Sack (1) — My Community Sg — CC BY-SA 4.0",
  },
  "Instant Coffee Sticks (10s)": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/26/Instant_coffee.jpg/960px-Instant_coffee.jpg",
    credit: "Instant coffee — Editor at Large — CC BY-SA 2.5",
  },

  // ── Clothing and Apparel ──
  "Comfy Cotton Shirt": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b3/Ironed_blue_T-shirt_%28001%29.JPG/960px-Ironed_blue_T-shirt_%28001%29.JPG",
    credit: "Ironed blue T-shirt (001) — Juan de Vojníkov — CC BY-SA 3.0",
  },
  "Everyday Jogger Shorts": {
    url: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Shorts_%28clothing%29.jpg",
    credit: "Shorts (clothing) — David Ring — CC0",
  },
  "Uniform White Polo": {
    url: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Polo_shirt.jpg",
    credit: "Polo shirt — David Ring — CC0",
  },

  // ── Electronics and Gadgets ──
  "Mini Desk Fan": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fc/Small_Desk_Fan_1.jpg/960px-Small_Desk_Fan_1.jpg",
    credit: "Small Desk Fan 1 — Couch-scratching-cats — Public Domain",
  },
  "USB Charging Cable 1m": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/59/Black_charging_cable_type_USB-C_plugs_01.jpg/960px-Black_charging_cable_type_USB-C_plugs_01.jpg",
    credit: "Black charging cable type USB-C plugs 01 — Chenspec — CC BY-SA 4.0",
  },
  "LED Emergency Bulb": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/94/3W_light_bulb_emergency_lighting.JPG/960px-3W_light_bulb_emergency_lighting.JPG",
    credit: "3W light bulb emergency lighting — Sokolshok — CC BY-SA 3.0",
  },

  // ── Home and Living ──
  "Bamboo Storage Basket": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fa/Bamboo_Woven_Basket.jpg/960px-Bamboo_Woven_Basket.jpg",
    credit: "Bamboo Woven Basket — Nabunje Leticia — CC BY-SA 4.0",
  },
  "Clothes Hanger Set (5s)": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/Colorful_plastic_hangers_for_sale_at_Wal-Mart.jpg/960px-Colorful_plastic_hangers_for_sale_at_Wal-Mart.jpg",
    credit: "Colorful plastic hangers for sale at Wal-Mart — Ser Amantio di Nicolao — CC BY-SA 4.0",
  },
  "Plastic Storage Bin 15L": {
    url: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Storage_bin_in_a_model_home_in_Tigray_photo_Nena_Terrell_usaid.jpg",
    credit: "Storage bin in a model home in Tigray — USAID/Nena Terrell — Public Domain",
  },

  // ── Health and Beauty ──
  "Herbal Soap Bar": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d9/Handmade_soap.jpg/960px-Handmade_soap.jpg",
    credit: "Handmade soap — Malene Thyssen — CC BY 2.5",
  },
  "Toothpaste Family Size (150g)": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9d/Toothpaste.jpg/960px-Toothpaste.jpg",
    credit: "Toothpaste — Scott Ehardt — Public Domain",
  },
  "Sanitizing Alcohol 500ml": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b7/Rubbing_alcohol.JPG/960px-Rubbing_alcohol.JPG",
    credit: "Rubbing alcohol — Craig Spurrier — CC BY 2.5",
  },

  // ── Automotive Supplies ──
  "Microfiber Car Cloth": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cd/Microfiber_cloth.jpg/960px-Microfiber_cloth.jpg",
    credit: "Microfiber cloth — BeVegan22 — CC BY-SA 4.0",
  },
  "Motorcycle Basic Tool Set": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b8/Spanner_set.jpg/960px-Spanner_set.jpg",
    credit: "Spanner set — Sunnybansodeva — CC BY-SA 4.0",
  },
  "Tire Pressure Gauge": {
    url: "https://upload.wikimedia.org/wikipedia/commons/8/80/Tire_pressure_gauge.jpg",
    credit: "Tire pressure gauge — U.S. Air Force / Airman Frank Snider — Public Domain",
  },

  // ── Others ──
  "Capiz Shell Keychain": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a0/Keychain.jpg/960px-Keychain.jpg",
    credit: "Keychain — Sergei S. Scurfield — CC BY-SA 3.0",
  },
  "Souvenir Ref Magnet": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6d/Refrigerator_Magnet.jpg/960px-Refrigerator_Magnet.jpg",
    credit: "Refrigerator Magnet — AnnaKhrobolova (WMUA) — CC BY-SA 4.0",
  },
  "Handmade Woven Wallet": {
    url: "https://upload.wikimedia.org/wikipedia/commons/6/67/Wallet.jpg",
    credit: "Wallet — David Ring — CC0",
  },
};

// Wikimedia asks scripts to send a descriptive User-Agent — generic ones can get 403
const FETCH_HEADERS = { "User-Agent": "PropeBuyCapstoneSeed/1.0 (demo image seeder)" };

async function main() {
  // CLI flag: "skip" = only touch products still missing an image
  const skipExisting = process.argv.includes("skip");

  // ── PRE-CHECK — DB names vs photo map ───────────────────
  // Catches typos / renamed templates BEFORE any upload happens
  const dbNames = (
    await prisma.product.findMany({ distinct: ["name"], select: { name: true } })
  ).map((p) => p.name);

  if (dbNames.length === 0) {
    console.log('No products found. Run "npm run demo" first. Nothing changed.');
    return;
  }

  const noPhoto = dbNames.filter((n) => !PRODUCT_IMAGES[n]);
  if (noPhoto.length > 0) {
    // Not fatal — those rows just keep their current imageUrl
    console.log(`Heads up: no photo mapped for → ${noPhoto.join(", ")}`);
  }

  let totalUpdated = 0;

  // ── DOWNLOAD → UPLOAD → LINK, one product name at a time ─
  for (const [name, plan] of Object.entries(PRODUCT_IMAGES)) {
    // Skip map entries with no matching DB rows — no wasted Cloudinary upload
    if (!dbNames.includes(name)) {
      console.log(`${name}: not in DB, skipped`);
      continue;
    }

    // DOWNLOAD — Node global fetch, validate it is real image bytes
    const res = await fetch(plan.url, { headers: FETCH_HEADERS });
    if (!res.ok) {
      throw new Error(`Download failed for ${name} (HTTP ${res.status})`);
    }
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      throw new Error(`Source for ${name} is not an image (${contentType})`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 10000) {
      // Broken/placeholder bytes — refuse, protect the data
      throw new Error(`Image for ${name} looks broken (${buffer.length} bytes)`);
    }

    // UPLOAD — house Cloudinary helper, same folder as Edit Product
    const uploaded = await uploadToCloudinary(buffer, "products");
    if (!uploaded?.secure_url) {
      throw new Error(`Cloudinary upload failed for ${name}`);
    }

    // LINK — every seller's copy of this product gets this photo
    const updated = await prisma.product.updateMany({
      where: {
        name,
        // skip mode: leave already-attached photos untouched
        ...(skipExisting ? { imageUrl: null } : {}),
      },
      data: { imageUrl: uploaded.secure_url },
    });

    totalUpdated += updated.count;
    console.log(`${name}: ${updated.count} products → ${uploaded.secure_url}`);
  }

  console.log(`\nDone. ${totalUpdated} products now carry real photos.`);
  console.log("Credits for all 21 source photos are kept in PRODUCT_IMAGES above.");
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
