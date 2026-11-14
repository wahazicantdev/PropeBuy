// ── EVALUATION ACCOUNTS ────────────────────────────────────
// Prepared accounts for the ISO 25010 evaluation, so respondents log in
// instead of uploading their real IDs (RA 10173).
// Safe to re-run: it creates or updates only these accounts and never
// deletes anything.
//
// Usage (in backend/):
//   npm run evalAccounts -- "RespondentPassword" "AdminPassword"
// Both passwords are required and never stored in the code, because the
// repository is public.
import bcrypt from "bcryptjs";
// House Prisma client — loads env.js automatically on import
import prisma from "../src/config/prismaClient.js";

// ── SETTINGS ───────────────────────────────────────────────
// 01-20: Actual Users (15 plus spares). 21-50: IT Experts, one pair each.
const BUYERS = 50;
const VENDORS = 50;
const PRODUCTS_PER_VENDOR = 3;
const password = process.argv[2];
const adminPassword = process.argv[3];

// No defaults — a password written here would be public on GitHub
if (!password || !adminPassword || password.length < 8 || adminPassword.length < 8) {
  console.log('Usage: npm run evalAccounts -- "RespondentPassword" "AdminPassword"');
  console.log("Both are required, at least 8 characters each.");
  process.exit(1);
}
if (password === adminPassword) {
  console.log("Use a different password for the admin account.");
  process.exit(1);
}

// Two-digit numbering: 01, 02 ... 18
const pad = (n) => String(n).padStart(2, "0");

// Starter goods, one set per vendor, rotated through the categories
const STARTER_GOODS = [
  ["Food and Packaged Goods", "Homemade Peanut Butter 250g", 120, "Creamy peanut butter made in small batches."],
  ["Clothing and Apparel", "Cotton Plain Shirt", 199, "Soft everyday cotton shirt, assorted sizes."],
  ["Home and Living", "Woven Storage Basket", 160, "Handwoven basket for clothes or toys."],
  ["Health and Beauty", "Herbal Bath Soap", 65, "Gentle herbal soap for daily use."],
  ["Electronics and Gadgets", "USB-C Charging Cable 1m", 89, "Fast-charging cable for phones and tablets."],
  ["Automotive Supplies", "Microfiber Car Towel", 99, "Lint-free towel for washing and drying."],
];

async function main() {
  // ── BASE DATA ──────────────────────────────────────────
  // Barangays and categories come from npm run seed
  const poblacion = await prisma.barangay.findUnique({ where: { name: "Poblacion" } });
  const categories = await prisma.category.findMany();
  if (!poblacion || categories.length === 0) {
    console.log('Missing barangays or categories. Run "npm run seed" first.');
    process.exit(1);
  }
  const categoryId = (name) => categories.find((c) => c.name === name)?.id ?? categories[0].id;

  // Reuse demo product photos so listings do not look empty
  const photos = (
    await prisma.product.findMany({
      where: { imageUrl: { not: null } },
      select: { imageUrl: true },
      take: 30,
    })
  ).map((p) => p.imageUrl);

  const hashed = await bcrypt.hash(password, 10);
  const adminHashed = await bcrypt.hash(adminPassword, 10);

  // Every account is verified and placed in the pilot barangay
  const upsertUser = (email, data, hash = hashed) =>
    prisma.user.upsert({
      where: { email },
      create: { email, password: hash, accountStatus: "VERIFIED", barangayId: poblacion.id, ...data },
      update: { password: hash, accountStatus: "VERIFIED", barangayId: poblacion.id, ...data },
    });

  // ── BUYERS ─────────────────────────────────────────────
  for (let n = 1; n <= BUYERS; n++) {
    await upsertUser(`buyer${pad(n)}.eval@propebuy.test`, {
      name: `Eval Buyer ${pad(n)}`,
      role: "BUYER",
      address: `Evaluation address ${pad(n)}, Poblacion, Muntinlupa City`,
    });
  }

  // ── VENDORS ────────────────────────────────────────────
  let newProducts = 0;
  for (let n = 1; n <= VENDORS; n++) {
    const vendor = await upsertUser(`vendor${pad(n)}.eval@propebuy.test`, {
      name: `Eval Store ${pad(n)}`,
      role: "SELLER",
      address: `Stall ${pad(n)}, Poblacion, Muntinlupa City`,
      offersDelivery: true,
      deliveryFee: 30,
      // Pins spread a little around Poblacion so each store has its own spot
      storeLat: 14.3866 + ((n % 10) - 5) * 0.0009,
      storeLng: 121.0465 + (Math.floor(n / 10) - 2) * 0.0009,
    });

    // Starter products only once — re-runs never duplicate them
    const existing = await prisma.product.count({ where: { sellerId: vendor.id } });
    if (existing === 0) {
      for (let i = 0; i < PRODUCTS_PER_VENDOR; i++) {
        const [category, name, price, description] = STARTER_GOODS[(n + i) % STARTER_GOODS.length];
        await prisma.product.create({
          data: {
            sellerId: vendor.id,
            barangayId: poblacion.id,
            categoryId: categoryId(category),
            name,
            description,
            price,
            stock: 50,
            imageUrl: photos.length ? photos[(n * PRODUCTS_PER_VENDOR + i) % photos.length] : null,
          },
        });
        newProducts++;
      }
    }
  }

  // ── EVALUATION ADMIN ───────────────────────────────────
  // For IT experts who evaluate the admin portal
  await upsertUser("admin.eval@propebuy.test", { name: "Eval Administrator", role: "ADMIN" }, adminHashed);

  // ── SUMMARY ────────────────────────────────────────────
  console.log("\nEvaluation accounts ready (all VERIFIED, Barangay Poblacion):");
  console.log(`  Buyers   buyer01.eval@propebuy.test  to buyer${pad(BUYERS)}.eval@propebuy.test`);
  console.log(`  Vendors  vendor01.eval@propebuy.test to vendor${pad(VENDORS)}.eval@propebuy.test`);
  console.log("  Admin    admin.eval@propebuy.test");
  console.log("  Buyers and vendors use the respondent password. The admin uses its own.");
  console.log(`  New starter products: ${newProducts}`);
}

main()
  .catch((err) => {
    console.error("Evaluation accounts failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
