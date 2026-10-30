# AgroCommerce

E-commerce platform for farmers and retailers.

```
agri-commerce/
├── shared/      @agri/shared: constants, API types, zod schemas, money helpers (used by both apps)
├── backend/     Express 5 + Mongoose (MongoDB) REST API   http://localhost:4000/api/v1
└── frontend/    Next.js 16 website                         http://localhost:3000
```

## Setup

```bash
npm install          # installs all three workspaces
npm run db:up        # MongoDB in Docker (single-node replica set), waits until it is ready
npm run db:seed      # starter catalogue, CMS content, delivery areas and the admin account
npm run dev          # API + website together
```

| URL | What |
|---|---|
| http://localhost:3000 | Shop |
| http://localhost:3000/admin | Admin panel (`ADMIN_PHONE` / `ADMIN_PASSWORD` from `backend/.env`) |

- `backend/.env`: `MONGODB_URI`. For Atlas use `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/agri_commerce`.
- `frontend/.env.local`: `API_URL` and `NEXT_PUBLIC_API_URL`.
- `npm run db:seed` only creates missing documents, so it never overwrites your edits. To reset to the starter data, run `npm run seed -w backend -- --reset`.
- MongoDB runs as a **replica set** because placing an order uses a transaction (take stock + create order, all or nothing). Atlas is always a replica set, so nothing changes in production.

## Backend layers

Each feature is a folder in `backend/src/modules/`. A request passes through:

```
routes  ->  service  ->  repository  ->  model (MongoDB)
               |
             mapper  ->  API type from @agri/shared
```

| Layer | File | Job |
|---|---|---|
| Routes | `*.routes.ts` | URL, validation (zod), and a one-line handler that calls the service |
| Service | `*.service.ts` | Business rules (pricing, stock, the order state machine, locale fallback) |
| Repository | `*.repository.ts` | The only code that queries MongoDB |
| Model | `*.model.ts` | Mongoose schema = collection structure and indexes |
| Mapper | `*.mapper.ts` | Database document -> clean API shape (hides internal fields) |

A `*.controller.ts` exists only when a handler does more than call a service (`auth` sets cookies).

| Module | Covers |
|---|---|
| `product`, `category` | Catalogue, plus admin create/edit |
| `content` | CMS: site settings, menus, pages |
| `auth`, `customer` | OTP login, sessions, profile, addresses |
| `order` | Checkout quote, place order (COD), cancel, admin status changes. `order.pricing.ts` prices a cart for both the preview and the real order |
| `store` | Admin-editable rules (COD limits, free delivery, max quantity…) and delivery areas |
| `admin` | Dashboard reports; mounts every `/admin/*` route behind the ADMIN role check |

## Frontend layers

```
app/(shop)/*  and  app/admin/(panel)/*   pages (server components)
      |
components/*                              UI, grouped by feature
      |
lib/api/*                                 one client per backend area
```

- **State:** the cart is the only global state (`lib/cart/CartContext.tsx`, React Context + `useReducer`). Page data comes from server components, and form state stays inside each form. Every cart change is one named action in the reducer, so bugs are easy to trace.
- **Route groups:** `(shop)` has the navbar and footer; `admin/(panel)` has the sidebar and the admin check. URLs are unaffected.
- **API clients:** files with `"use client"` run in the browser and send cookies. `server.ts` reads data as the signed-in visitor from server components and redirects on 401/403. Content, categories and store rules are cached; products, stock and orders are always fresh.
- **Text:** `messages/en.ts` holds fixed interface text. Editable content lives in the CMS; business limits live in store settings.
- **Proxy** (`proxy.ts`): renews an expired 15-minute session from the 30-day cookie before a page renders, and redirects signed-out visitors away from account, checkout, order and admin pages.

## Ordering (cash on delivery)

1. The cart lives in the browser. Prices there are for display only.
2. Checkout sends only `{ variantId, quantity }` lines. The server re-prices them and checks stock, the per-item maximum, the minimum order, the pincode and COD limits.
3. Placing the order runs in one transaction: re-price, take stock atomically, create the order. If one item is short, nothing is taken.
4. Each checkout visit sends a unique key, so a double tap or retry returns the same order instead of creating two.
5. Admins move orders along `PLACED → CONFIRMED → PACKED → SHIPPED → DELIVERED`. Cancelling returns stock, and delivery marks COD as paid.

## Admin panel

| Page | What it does |
|---|---|
| Dashboard | Today's orders, 30-day revenue, open orders, customers, 14-day sales chart, top products, low stock |
| Orders | Filter by status, search by order number, name or phone, and move an order to its next status |
| Products | Search, create and edit products and pack sizes (price, MRP, retailer price, stock, visibility) |
| Store settings | COD on/off and limit, minimum order, free-delivery amount, max quantity, low-stock level, order prefix, timezone, and delivery areas (pincode, fee, days, COD) |

## Editing site content (CMS)

Content lives in MongoDB. Edit it with MongoDB Compass or the Atlas Data Explorer (both free). Changes appear on the site within about 1 minute.

| Collection | One document per | Controls |
|---|---|---|
| `site_settings` | locale | Site name, logo, theme colours, contact details, search placeholder, footer text, SEO |
| `navigations` | menu + locale (`header`, `footer`) | Header category bar; footer link columns |
| `pages` | page + locale (`home`) | The `sections` array: order = order on the page; `isActive: false` hides one |

Section types and their `data` fields are defined in `shared/src/schemas/content.schema.ts`:
- `hero`: eyebrow, title, subtitle, primaryCta, secondaryCta, backgroundImageUrl, highlights
- `categoryGrid`: title, categorySlugs (empty = all)
- `productGrid`: title, anchor, viewAllLink, query { category, featured, sort, limit }

If a section's data is invalid, that section is skipped (and logged by the API) instead of breaking the page.

**Gujarati:** copy a content document, set `locale: "gu"` and translate the text. Anything not yet translated falls back to English.

## Login

Customers and retailers sign in with a **phone OTP**; admins sign in with a **password**.

| Route | Purpose |
|---|---|
| `POST /auth/otp/request` | Send a 6-digit code. Rate limited per phone and per IP |
| `POST /auth/otp/verify` | Check the code; creates the account on first login |
| `POST /auth/admin/login` | Admin password login |
| `POST /auth/refresh` | Rotate tokens (called automatically by the browser client) |
| `POST /auth/logout` / `logout-all` | End this session / every session |
| `GET /auth/me` | The signed-in customer |
| `GET`/`PATCH /customers/me` | Profile |
| `POST`/`PATCH`/`DELETE /customers/me/addresses[/:id]` | Addresses |

### Testing without SMS

`SMS_PROVIDER=console` prints the code in the API terminal, and `OTP_DEV_ECHO=true` also returns it
in the response and shows it on the login screen. Both are refused in production by env validation.

```bash
curl -X POST localhost:4000/api/v1/auth/otp/request \
  -H 'Content-Type: application/json' -d '{"phone":"9876543210"}'
```

Admin login uses `ADMIN_PHONE` / `ADMIN_PASSWORD` from `backend/.env`. Quote the password: an
unquoted `#` starts a comment in `.env` files. After changing it run `npm run seed -w backend -- --reset`.

### How the session works

1. A verified OTP issues an **access token** (JWT, 15 min) and a **refresh token** (random, 30 days).
2. Both are `httpOnly` cookies, so page JavaScript can never read them.
3. When a call returns 401, the browser client silently calls `/auth/refresh` once and retries.
4. Refresh tokens **rotate** on every use. Presenting an already-used one means two parties hold
   it, so every session from that login is revoked and the event is logged.
5. `requireAuth` re-checks the account on each request, so disabling an account or
   "log out everywhere" takes effect immediately rather than when the token expires.

### Security notes

- OTPs are stored only as HMAC-SHA256 hashes with a server-side `OTP_PEPPER`, so a database
  leak cannot reveal codes. They are single-use, expire in 5 minutes and die after 5 wrong guesses.
- Codes come from `crypto.randomInt`, never `Math.random`.
- `role` cannot be self-assigned: signup accepts `CUSTOMER` or `RETAILER` only, and admins exist
  solely via the seed script. Admins are refused OTP login, so admin access never rests on a SIM.
- Login failures return one identical message, so the API cannot be used to discover which
  phone numbers are registered.
- `customer.mapper.ts` is the single gate that keeps `passwordHash`, `tokenVersion` and
  `isActive` out of every response.
- Logs redact cookies, tokens, passwords and OTP fields.
- `frontend/proxy.ts` only redirects for UX; it cannot verify a token. Real enforcement is
  `requireSession()` on the page plus `requireAuth` on the API.

**Before deploying:** host the website and API as subdomains of one domain
(`www.example.in` + `api.example.in`) and set `COOKIE_DOMAIN=.example.in`, otherwise the auth
cookies will not be shared. Also regenerate `JWT_ACCESS_SECRET` and `OTP_PEPPER`, and note that
sending real SMS in India needs DLT registration.

## Rules

- Money is always integer **paise**. Display it with `formatPaise()`.
- API shapes live in `shared/`. Change them there and both apps show type errors wherever an update is needed.
- Only repositories talk to the database. Only services contain business rules.
