import { Link } from "react-router-dom";
import PublicNav from "../../components/PublicNav.jsx";
import SiteFooter from "../../components/SiteFooter.jsx";

// Last change to either document
const UPDATED = "November 15, 2026";

// ── TERMS OF USE ───────────────────────────────────────
// Plain-language rules. Each section is [heading, paragraphs[]].
const TERMS = [
  ["About PropeBuy", [
    "PropeBuy is an online marketplace for verified residents and sellers of Muntinlupa City barangays, piloted in Barangay Poblacion. It was built as a capstone project by BSIT students of Pamantasan ng Lungsod ng Muntinlupa.",
    "PropeBuy connects buyers and sellers. The seller sells the goods; PropeBuy runs the website, checks accounts and handles online payments.",
  ]],
  ["Accounts", [
    "You must be at least 18 years old and live or do business in Muntinlupa City. Each account needs a valid government ID and a Barangay Certificate of Residency issued within the last 6 months.",
    "An administrator reviews every account. You cannot check out or sell until your account is verified. Accounts with false documents are rejected or suspended.",
    "Keep your password private. You are responsible for what happens under your account.",
  ]],
  ["What can be sold", [
    "Only physical goods that can be picked up or delivered, in these categories: Food and Packaged Goods, Clothing and Apparel, Home and Living, Health and Beauty, Electronics and Gadgets, Automotive Supplies, and Others.",
    "Not allowed: services, dine-in meals, fresh palengke produce, and regulated goods that need a permit the seller does not have (for example medicines, alcohol sold to minors, firearms). Administrators may remove any listing that breaks these rules.",
  ]],
  ["Orders and stock", [
    "Placing an order reserves the items right away, so two buyers can never buy the same last item. The seller then processes and fulfils the order.",
    "Delivery orders come from one seller at a time. The seller sets one flat delivery fee per order, paid online before the seller delivers.",
    "After an order is fulfilled, the buyer rates each item before placing the next order. Ratings must be honest and about the item.",
  ]],
  ["Payments and fees", [
    "Buyers pay in cash on pickup or delivery, or online with GCash through PayMongo, a payment processor regulated by the Bangko Sentral ng Pilipinas.",
    "Online payments are received by PropeBuy, held until the seller fulfils the order, then sent to the seller's GCash payout account.",
    "Listing products is free. PropeBuy keeps a 5% commission on items paid online, which covers the payment processing fee and running the platform. Cash sales and delivery fees have no commission.",
    "As required by BIR Revenue Regulations No. 16-2023, PropeBuy withholds 1% income tax on one-half of a seller's online earnings once the seller's earnings for the year pass ₱500,000.",
  ]],
  ["Cancellations and refunds", [
    "A buyer may cancel an order while it is still Reserved. A seller may cancel an order before it is fulfilled. Cancelled items go back to stock.",
    "If a cancelled order was already paid online, PropeBuy refunds the buyer through PayMongo. Cash orders have nothing to refund.",
  ]],
  ["Complaints", [
    "If something goes wrong with an order, report it to the barangay administrator with the order number. The administrator can review the order, the payment and both accounts, and can suspend sellers who break these terms.",
    "Under the Internet Transactions Act of 2023 (RA 11967), the seller is primarily responsible for the goods. PropeBuy keeps records of verified sellers and transactions to help settle complaints.",
  ]],
  ["Changes", [
    "We may update these terms. The date at the top shows the latest version. Continuing to use PropeBuy means you accept the update.",
  ]],
];

// ── PRIVACY POLICY ─────────────────────────────────────
const PRIVACY = [
  ["What we collect", [
    "Account: your name, email address, password (stored scrambled, never readable), role and barangay.",
    "Verification: photos of your government ID and Barangay Certificate, and the text our system reads from them to help the administrator check them.",
    "Shopping and selling: delivery or store address, store map pin, products, orders, payments, ratings and, for sellers, the GCash number for payouts.",
  ]],
  ["Why we collect it", [
    "To verify that every buyer and seller is a real resident, to process orders and payments, to deliver goods, to pay sellers, to meet tax rules, and to keep the marketplace safe.",
    "We never sell your data and never use it for advertising.",
  ]],
  ["Who can see it", [
    "Barangay administrators see verification documents and account details. Sellers see the name, barangay and delivery address of buyers who order from them. Buyers see a seller's store name, address and map pin.",
    "Service providers process data for us under their own security rules: Neon (database), Cloudinary (photos), PayMongo (payments) and Brevo (email codes). We do not see or store your GCash or card login.",
  ]],
  ["How long we keep it", [
    "We keep account and order records while your account is active and for as long as tax and consumer laws require. You may ask us to delete an account that has no open orders.",
  ]],
  ["Your rights", [
    "Under the Data Privacy Act of 2012 (RA 10173), you have the right to be informed, to access your data, to correct it, to object, to ask for it to be erased or blocked, and to file a complaint with the National Privacy Commission.",
    "To use these rights, contact the barangay administrator, who will pass your request to the PropeBuy team.",
  ]],
  ["Security", [
    "Passwords are hashed with bcrypt, connections use HTTPS, and every account action is checked against your role. Email codes expire in 10 minutes. No system is perfectly secure, so tell us right away if you think your account was used by someone else.",
  ]],
];

// Shared layout for both documents
const LegalPage = ({ title, intro, sections, other }) => (
  <div className="min-h-screen bg-white page-enter">
    <PublicNav />
    <main className="max-w-3xl mx-auto px-4 py-10 md:py-14">
      <p className="font-body text-xs text-passive">Last updated {UPDATED}</p>
      <h1 className="heading-body text-3xl md:text-4xl font-bold mt-2">{title}</h1>
      <p className="font-body text-base text-black/70 mt-3">{intro}</p>
      {/* Numbered sections, easy to point to in a complaint */}
      <ol className="mt-8 space-y-8">
        {sections.map(([heading, paragraphs], i) => (
          <li key={heading}>
            <h2 className="heading-body text-lg font-bold">
              {i + 1}. {heading}
            </h2>
            {paragraphs.map((p) => (
              <p key={p.slice(0, 40)} className="font-body text-sm md:text-base text-black/75 mt-2 leading-relaxed">
                {p}
              </p>
            ))}
          </li>
        ))}
      </ol>
      <p className="font-body text-sm mt-10 pt-6 border-t border-black/10">
        See also the <Link to={other.to} className="font-bold underline">{other.label}</Link>.
      </p>
    </main>
    <SiteFooter />
  </div>
);

export const Terms = () => (
  <LegalPage
    title="Terms of Use"
    intro="The rules for buying and selling on PropeBuy, in plain words."
    sections={TERMS}
    other={{ to: "/privacy", label: "Privacy Policy" }}
  />
);

export const Privacy = () => (
  <LegalPage
    title="Privacy Policy"
    intro="What personal data PropeBuy collects, why, and how you control it."
    sections={PRIVACY}
    other={{ to: "/terms", label: "Terms of Use" }}
  />
);
