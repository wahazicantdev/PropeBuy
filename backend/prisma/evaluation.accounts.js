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
// Staff accounts (Yoy, 11-18). The verifier is shared by the barangay
// staff respondents, one barangay desk like a real office, and uses the
// respondent password. Moderators are for IT experts and use the admin
// password, like the super admin.
const VERIFIER_EMAIL = "verifier.eval@propebuy.test";
const MODERATORS = 5;
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
      // Public store name — buyers never see the real name
      storeName: `Eval Store ${pad(n)}`,
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

  // ── EVALUATION STAFF ───────────────────────────────────
  // Super admin for IT experts who evaluate the whole admin portal
  await upsertUser(
    "admin.eval@propebuy.test",
    { name: "Eval Administrator", role: "ADMIN", adminLevel: "SUPER_ADMIN" },
    adminHashed,
  );
  // Moderators: daily moderation, no money or staff pages
  for (let n = 1; n <= MODERATORS; n++) {
    await upsertUser(
      `moderator${pad(n)}.eval@propebuy.test`,
      { name: `Eval Moderator ${pad(n)}`, role: "ADMIN", adminLevel: "MODERATOR" },
      adminHashed,
    );
  }
  // Barangay verifier: one per barangay, like a real barangay office
  // (Yoy, 11-18). The 10 numbered verifiers from the first version are
  // turned off, not deleted, so their past actions stay in the audit log.
  const oldVerifiers = Array.from({ length: 10 }, (_, i) => `verifier${pad(i + 1)}.eval@propebuy.test`);
  const turnedOff = await prisma.user.updateMany({
    where: { email: { in: oldVerifiers }, accountStatus: "VERIFIED" },
    data: { accountStatus: "REJECTED" },
  });
  await upsertUser(VERIFIER_EMAIL, {
    name: "Eval Poblacion Verifier",
    role: "ADMIN",
    adminLevel: "BARANGAY_VERIFIER",
  });
  // The app allows one active verifier per barangay. Warn, never change,
  // if someone else is also active for Poblacion.
  const others = await prisma.user.findMany({
    where: {
      role: "ADMIN",
      adminLevel: "BARANGAY_VERIFIER",
      barangayId: poblacion.id,
      accountStatus: "VERIFIED",
      email: { not: VERIFIER_EMAIL },
    },
    select: { email: true },
  });

  // ── SUMMARY ────────────────────────────────────────────
  console.log("\nEvaluation accounts ready (all VERIFIED, Barangay Poblacion):");
  console.log(`  Buyers   buyer01.eval@propebuy.test  to buyer${pad(BUYERS)}.eval@propebuy.test`);
  console.log(`  Vendors  vendor01.eval@propebuy.test to vendor${pad(VENDORS)}.eval@propebuy.test`);
  console.log("  Super admin  admin.eval@propebuy.test");
  console.log(`  Moderators   moderator01.eval@propebuy.test to moderator${pad(MODERATORS)}.eval@propebuy.test`);
  console.log(`  Verifier     ${VERIFIER_EMAIL} (Poblacion, the only one)`);
  if (turnedOff.count) console.log(`  Turned off ${turnedOff.count} old numbered verifier account(s)`);
  if (others.length) {
    console.log(`  WARNING: other active Poblacion verifier(s): ${others.map((o) => o.email).join(", ")}`);
    console.log("  Turn them off on the Staff page so Poblacion has one verifier.");
  }
  console.log("  Buyers, vendors and the verifier use the respondent password.");
  console.log("  The super admin and moderators use the admin password.");
  console.log(`  New starter products: ${newProducts}`);
}

main()
  .catch((err) => {
    console.error("Evaluation accounts failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
