// ── DEMO DATA RESET + SEEDED ACCOUNTS ─────────────────────
// One-time controlled wipe + clean demo dataset for testing.
// Wipes: order items, orders, products, non-admin users.
// Never touches: ADMIN account, barangays, categories.
import bcrypt from "bcryptjs";
import readline from "node:readline";
// House Prisma client — loads env.js automatically on import
import prisma from "../src/config/prismaClient.js";

// ── CONSOLE CONFIRM GATE ──────────────────────────────────
// Destructive by design — never runs without a human typing WIPE
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

const answer = await ask(
  "This DELETES all orders, products, and non-admin users from the DB.\nType WIPE to continue, anything else to abort: "
);

if (answer.trim() !== "WIPE") {
  // Aborted — zero changes on disk
  console.log("Aborted. Nothing was deleted.");
  rl.close();
  process.exit(0);
}
rl.close();

async function main() {
  // ── STEP 1 — CONTROLLED WIPE ─────────────────────────────
  // FK-safe order: children first, parents last.
  // No cart tables exist (cart is frontend-only) — nothing to wipe there.
  const deleted = await prisma.$transaction([
    prisma.orderItem.deleteMany({}),
    prisma.order.deleteMany({}),
    prisma.product.deleteMany({}),
    // role != ADMIN keeps the seeded admin account parked untouched
    prisma.user.deleteMany({ where: { role: { not: "ADMIN" } } }),
  ]);

  // Human-readable wipe report
  console.log("\nWiped:");
  console.log(`  order items ...... ${deleted[0].count}`);
  console.log(`  orders ........... ${deleted[1].count}`);
  console.log(`  products ......... ${deleted[2].count}`);
  console.log(`  non-admin users .. ${deleted[3].count}`);

  // ── STEP 2 — BASE DATA CHECK ─────────────────────────────
  // Barangays + categories come from the base seed — we only READ them.
  const barangays = await prisma.barangay.findMany({ orderBy: { name: "asc" } });
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  if (barangays.length !== 8 || categories.length !== 7) {
    console.log(
      `\nDB is missing base data (found ${barangays.length} barangays / ${categories.length} categories).\nRun "npm run seed" first, then re-run this script.`
    );
    return;
  }
  console.log(`\nFound ${barangays.length} barangays and ${categories.length} categories — good.`);

  // ── STEP 3 — DEMO PASSWORD (same for all demo accounts) ──
  // Capstone demo convenience — change before any real deployment
  const PASSWORD = "demo1234";
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(PASSWORD, salt);

  // ── STEP 4 — BUYER DEFAULTS (yoy assigned me to pick) ────
  // 3 buyers, different base barangays, yoy's naming format
  const buyerPlans = [
    { n: 1, barangay: "Poblacion" }, // pilot barangay — main demo buyer
    { n: 2, barangay: "Alabang" },
    { n: 3, barangay: "Putatan" },
  ];

  // ── STEP 5 — USER ROWS ───────────────────────────────────
  // Sellers: 1 per barangay, VERIFIED (login + badge gating expect it),
  // OCR fields filled like a real auto-approved document check.
  const userRows = [];

  barangays.forEach((b, i) => {
    userRows.push({
      name: `Seller ${i + 1}`,
      email: `seller${i + 1}.${b.name.toLowerCase()}@demo.com`,
      password: hash,
      role: "SELLER",
      accountStatus: "VERIFIED",
      barangayId: b.id,
      // OCR snapshot — mirrors a passed dual-doc verification
      ocrResult: "AUTO_APPROVED",
      ocrConfidence: 90 + ((i * 7) % 8), // 90–97, deterministic
      ocrIssues: null,
    });
  });

  buyerPlans.forEach((p) => {
    userRows.push({
      name: `Buyer ${p.n}`,
      email: `buyer${p.n}.${p.barangay.toLowerCase()}@demo.com`,
      password: hash,
      role: "BUYER",
      accountStatus: "VERIFIED",
      barangayId: barangays.find((b) => b.name === p.barangay).id,
      // Buyers verify with ID docs too, but OCR fields stay empty here
    });
  });

  await prisma.user.createMany({ data: userRows });
  console.log(`Created ${userRows.length} demo accounts (8 sellers + 3 buyers, all VERIFIED).`);

  // ── STEP 6 — 21 PRODUCTS PER SELLER (3 per category) ─────
  // Fetch sellers fresh so every product links to the right seller + barangay
  const sellers = await prisma.user.findMany({
    where: { role: "SELLER" },
    include: { barangay: true },
  });

  // Vendor price variance — same goods, honest different vendor prices.
  // Deterministic ±10% spread per seller so Browse shows priced competition
  const PRICE_VARIANCE = [0.90, 0.95, 1.00, 1.05, 1.10];

  // 21-template catalog — 3 products per category, prices in PHP.
  // The original 7 templates KEEP their names so old test flows stay valid
  const PRODUCT_CATALOG = {
    "Food and Packaged Goods": [
      {
        name: "Sardines Pack",
        price: 85.5,
        description:
          "Sealed canned sardines in tomato sauce. Long shelf life, perfect pantry or sari-sari stock.",
      },
      {
        name: "Rice 5kg Sack",
        price: 275,
        description:
          "Well-milled 5kg rice in a sealed sack. Everyday family staple.",
      },
      {
        name: "Instant Coffee Sticks (10s)",
        price: 55,
        description:
          "Box of 10 instant coffee sticks for quick morning brews.",
      },
    ],
    "Clothing and Apparel": [
      {
        name: "Comfy Cotton Shirt",
        price: 249.75,
        description:
          "Breathable cotton shirt, everyday use. Pre-owned store stock in brand-new condition.",
      },
      {
        name: "Everyday Jogger Shorts",
        price: 199,
        description:
          "Light jogger shorts with drawstring waist and side pockets.",
      },
      {
        name: "Uniform White Polo",
        price: 289.5,
        description:
          "Crisp white school polo that keeps its shape through washes.",
      },
    ],
    "Electronics and Gadgets": [
      {
        name: "Mini Desk Fan",
        price: 449.25,
        description:
          "USB rechargeable mini desk fan. Quiet motor, foldable stand, perfect for hot afternoons.",
      },
      {
        name: "USB Charging Cable 1m",
        price: 45,
        description:
          "Durable 1-meter charging cable for phones and power banks.",
      },
      {
        name: "LED Emergency Bulb",
        price: 129,
        description:
          "Rechargeable LED bulb that keeps rooms lit during brownouts.",
      },
    ],
    "Home and Living": [
      {
        name: "Bamboo Storage Basket",
        price: 129,
        description:
          "Woven bamboo storage basket for household items. Sturdy handles, natural finish.",
      },
      {
        name: "Clothes Hanger Set (5s)",
        price: 89.75,
        description:
          "Set of 5 plastic hangers with non-slip bars for shirts and pants.",
      },
      {
        name: "Plastic Storage Bin 15L",
        price: 149.25,
        description:
          "Stackable 15-liter bin with lock lid. Keeps clothes and toys dust-free.",
      },
    ],
    "Health and Beauty": [
      {
        name: "Herbal Soap Bar",
        price: 65,
        description:
          "Handmade herbal soap for sensitive skin. Light scent, no harsh chemicals added.",
      },
      {
        name: "Toothpaste Family Size (150g)",
        price: 99,
        description:
          "Family-size toothpaste with cavity protection, lasts a household a month.",
      },
      {
        name: "Sanitizing Alcohol 500ml",
        price: 88.75,
        description:
          "All-purpose sanitizing alcohol, 70% solution in a spray-ready bottle.",
      },
    ],
    "Automotive Supplies": [
      {
        name: "Microfiber Car Cloth",
        price: 99.5,
        description:
          "Lint-free microfiber cloth for wiping cars, motorcycles, and bikes. Washable and reusable.",
      },
      {
        name: "Motorcycle Basic Tool Set",
        price: 185,
        description:
          "Compact wrench and screwdriver set that fits under most motorcycle seats.",
      },
      {
        name: "Tire Pressure Gauge",
        price: 79.25,
        description:
          "Analog tire pressure gauge with an easy-read dial, works on cars and scooters.",
      },
    ],
    Others: [
      {
        name: "Capiz Shell Keychain",
        price: 79,
        description:
          "Handmade capiz shell keychain from local craftsmen. Lightweight with a metal clasp.",
      },
      {
        name: "Souvenir Ref Magnet",
        price: 39,
        description:
          "Fridge magnet printed with local Muntinlupa designs. Gift-ready finish.",
      },
      {
        name: "Handmade Woven Wallet",
        price: 159,
        description:
          "Native woven wallet with a zip pocket that holds cards and small bills.",
      },
    ],
  };

  const productRows = [];
  sellers.forEach((s, si) => {
    // Vendor price multiplier — deterministic cycle, same goods vary ±10%
    const variance = PRICE_VARIANCE[si % PRICE_VARIANCE.length];

    // pi = running index inside this seller's 21 — drives the stock cycle
    let pi = 0;
    for (const cat of categories) {
      // Every template of this category becomes one row for this seller
      for (const tpl of PRODUCT_CATALOG[cat.name]) {
        productRows.push({
          sellerId: s.id,
          barangayId: s.barangayId,
          categoryId: cat.id,
          name: tpl.name,
          description: tpl.description,
          // Vendor price = base × variance, cleaned to 2 decimals
          price: Math.round(tpl.price * variance * 100) / 100,
          // Deterministic stock spread 0 / 3 / 6 / 9 / 12 cycling across
          // the 21 → all StockPill states + low-stock analytics covered
          stock: ((si + pi) % 5) * 3,
          // No image on purpose — demoImage attaches photos right after
          imageUrl: null,
          isActive: true,
        });
        pi += 1;
      }
    }
  });

  await prisma.product.createMany({ data: productRows });
  console.log(`Created ${productRows.length} products (8 sellers × 21, 3 per category, no images).`);

  // ── STEP 7 — FINAL STATE REPORT ──────────────────────────
  const users = await prisma.user.groupBy({
    by: ["role"],
    _count: { role: true },
  });
  console.log("\nDB now contains:");
  console.log(`  ${users.find((u) => u.role === "ADMIN")?._count.role ?? "?"} admin (untouched)`);
  console.log(`  ${users.find((u) => u.role === "SELLER")?._count.role ?? 0} sellers`);
  console.log(`  ${users.find((u) => u.role === "BUYER")?._count.role ?? 0} buyers`);
  console.log(`  ${productRows.length} products`);

  // Credentials card — paste straight into yoy's notes
  console.log("\nDemo credentials (password for ALL demo accounts: demo1234)");
  barangays.forEach((b, i) => {
    // barangay kept in email + parens so logging in is still unambiguous
    console.log(`  Seller ${i + 1}  →  seller${i + 1}.${b.name.toLowerCase()}@demo.com  (${b.name})`);
  });
  buyerPlans.forEach((p) => {
    console.log(`  Buyer ${p.n}  →  buyer${p.n}.${p.barangay.toLowerCase()}@demo.com  (${p.barangay})`);
  });
  console.log("  Admin (untouched) →  admin@propebuy.com / admin123");
  console.log("\nDone. Run npm run demoPurchases to seed the purchase history.");
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