# PropeBuy

**A web-based hyper-local marketplace with an integrated Transaction Processing System for barangay commerce.**

PropeBuy gives small local vendors in Muntinlupa City a verified digital storefront and gives community buyers a safe way to discover and buy local goods. It is piloted in Barangay Poblacion.

> Capstone project for the Bachelor of Science in Information Technology program at Pamantasan ng Lungsod ng Muntinlupa (PLMUN), 2026.

---

## The problem

Barangay Poblacion has 431 registered local vendors and 927 commercial establishments, yet most of them are invisible online. Large platforms favor sellers with review histories, advertising budgets and large inventories. Our interviews with vendors, buyers and barangay officials pointed to three problems:

1. **No digital visibility** for small, community-based vendors.
2. **No community-based way to verify sellers.** Buyers cannot tell who is legitimate, and officials confirmed that business permit forgery is a real concern.
3. **Unreliable, informal transactions.** Handwritten lists and spreadsheets lead to stock errors and double selling.

## Our solution

PropeBuy is built on three pillars:

- **Hyper-local discovery.** Buyers browse and search products by barangay and category.
- **A verified community.** Every buyer and seller submits a government-issued ID and a Barangay Certificate of Residency. OCR reads and scores both documents, and an administrator makes the final decision on every account.
- **A reliable Transaction Processing System.** Checkout runs as one atomic database transaction with row-level locking, so two buyers can never purchase the same last item.

## Features

### Buyers
- Browse, search and filter products by barangay and category
- Cart with live stock checks: sold-out items are removed and lowered quantities are explained
- Checkout with store pickup or delivery
- Cash payment, or GCash through PayMongo
- Real-time order status updates without refreshing the page
- Saved delivery address and order history

### Sellers
- Product listing management for 7 categories of physical goods
- Inventory monitoring with low stock alerts
- Order fulfillment: process, fulfill, cancel and confirm cash payments
- Sales analytics: revenue trends, top-selling products and order summaries
- Optional delivery with a flat fee, prepaid online by the buyer
- Verified Local Vendor badge

### Administrators
- Verification queue sorted by OCR confidence into three groups: likely safe to approve, needs review, and likely reject
- View the uploaded documents, OCR results and issues, and re-run OCR
- User management, product moderation and an orders overview
- Barangay and category configuration

### Platform
- Email verification code before registration
- Saved notification list with a bell and unread count for every role
- Role-based access for buyers, sellers and administrators
- Security middleware, input validation and rate limiting

### In progress
- Mandatory ratings after a completed order
- Store location pin on an OpenStreetMap-based map
- Public deployment for system evaluation

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router 7, Zustand, Recharts |
| Backend | Node.js, Express 4 (ES modules) |
| Database | PostgreSQL on Neon, Prisma ORM 6 |
| Authentication | JSON Web Tokens, bcrypt, email one-time codes |
| Real-time | Socket.IO |
| Payments | PayMongo Checkout Sessions (GCash QR), signed webhooks |
| Document verification | Tesseract.js OCR with Sharp image preprocessing |
| File storage | Cloudinary |
| Security | Helmet, express-validator, express-rate-limit |

## How checkout stays reliable

1. The buyer places an order.
2. The server opens a single database transaction.
3. Each product row is locked with `SELECT ... FOR UPDATE`, so no other checkout can change it at the same time.
4. Stock is checked and deducted. If any item is short, the whole transaction rolls back and nothing is saved.
5. The order is committed. Payment sessions and notifications run only after the commit succeeds.

## Project structure

```
propebuy/
├── backend/
│   ├── prisma/          database schema, migrations, seed and demo data
│   └── src/
│       ├── config/      environment, database, Cloudinary, PayMongo
│       ├── controllers/ request handlers
│       ├── middleware/  authentication, validation, rate limits, errors
│       ├── routes/      API routes
│       ├── services/    checkout and order logic (the TPS)
│       └── utils/       OCR, payments, notifications, email
└── frontend/
    └── src/
        ├── api/         API clients
        ├── components/  shared UI components
        ├── hooks/       real-time socket hook
        ├── pages/       public, buyer, seller and admin pages
        ├── stores/      authentication and cart state
        └── utils/       helpers
```

## Getting started

### Requirements

- Node.js 22 LTS (Vite 8 needs 20.19 or newer)
- A PostgreSQL database (we use Neon)
- Cloudinary and PayMongo accounts (PayMongo test mode is enough)

### 1. Install

```bash
git clone https://github.com/wahazicantdev/PropeBuy.git
cd PropeBuy
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure

Create `backend/.env`:

| Variable | Purpose |
|---|---|
| `PORT` | API port, for example `5000` |
| `NODE_ENV` | `development` or `production` |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Token signing secret and lifetime |
| `CLIENT_URL` | Frontend address, for example `http://localhost:5173` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Image and document storage |
| `PAYMONGO_SECRET_KEY`, `PAYMONGO_PUBLIC_KEY`, `PAYMONGO_WEBHOOK_SECRET` | GCash payments and webhook verification |
| `PAYMENT_SUCCESS_URL`, `PAYMENT_FAILED_URL` | Pages buyers return to after paying |
| `BREVO_API_KEY`, `EMAIL_FROM` | Sends verification codes. Optional in development, where codes print in the terminal |

Create `frontend/.env`:

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | API address, for example `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | Socket address, for example `http://localhost:5000` |

### 3. Set up the database

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
npm run seed
```

`npm run seed` adds the barangays, categories and an administrator account. For sample vendors, products and orders, run `npm run demo`, `npm run demoImage` and `npm run demoPurchases`. Note that `npm run demo` clears existing orders, products and non-admin users first.

### 4. Run

```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```

Open `http://localhost:5173`.

## Scope

- Seven categories of physical, deliverable goods: Food and Packaged Goods, Clothing and Apparel, Home and Living, Health and Beauty, Electronics and Gadgets, Automotive Supplies, and Others.
- Services, dine-in food and fresh produce are outside the scope.
- PropeBuy is a web application. A mobile app, GPS barangay detection and government database checks are identified as future work.

## Evaluation

PropeBuy is evaluated using the ISO/IEC 25010:2023 software quality model, with separate instruments for actual users and IT experts.

## Team

| Name |
|---|
| William Rex Taglocop |
| Francis Cual |
| James Harold Gallego |
| Patrick John Villegas |

Bachelor of Science in Information Technology
Pamantasan ng Lungsod ng Muntinlupa

## Academic use

This repository is academic work submitted for a capstone requirement. It is shared for review and learning. Please contact the team before reusing any part of it.
