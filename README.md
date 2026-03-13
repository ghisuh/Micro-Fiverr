# Micro-Fiverr

A full-stack Fiverr-style marketplace built with Next.js App Router, TypeScript, Tailwind, NextAuth (credentials), Prisma, and PostgreSQL.

## Features
- Auth: credentials login/signup with bcrypt + NextAuth.
- Gigs: create/list gigs with tags, gallery, FAQs, packages, slugged URLs, search/filters.
- Orders: create orders, mock payment, status flow (pending → active → delivered → completed / cancelled), buyer/seller role filtering.
- Messaging: order thread with optional attachment URLs.
- Reviews: buyers can rate (1–5) and review completed orders; gig pages show average rating and review list.

## Live Demo
- App: https://micro-fiverr-el49.vercel.app
- Demo accounts:  
  - Seller: `demo-seller@microfiverr.com` / `password123`  
  - Buyer: `demo-buyer@microfiverr.com` / `password123`

## Screenshots / GIFs
Add your captures to `public/demo/` (examples below). Suggested filenames:
- `home.png` – Home hero
- `gigs.png` – Gigs list with filters
- `gig-detail.png` – Gig detail with packages
- `checkout.png` – Checkout summary
- `order-thread.png` – Order detail with messages/status
- `signup.png` / `login.png`

Then reference them in markdown, e.g.:
```
![Home](public/demo/home.png)
![Gigs](public/demo/gigs.png)
```

## Quick start
1. Install deps
   ```bash
   npm install
   ```
2. Env
   - Create `.env.local` and set:
     - `DATABASE_URL` (Postgres; Railway works)
     - `NEXTAUTH_SECRET`
     - `NEXTAUTH_URL` (e.g., http://localhost:3000)
3. Migrate DB
   ```bash
   npx prisma migrate dev
   ```
4. Seed demo data
   ```bash
   npm run seed
   ```
5. Run dev server
   ```bash
   npm run dev
   ```

## Loom walkthrough outline (90s)
1) 0:00–0:15 – What it is (Micro-Fiverr clone) + stack (Next.js App Router, TS, Prisma/Postgres, NextAuth, Tailwind).  
2) 0:15–0:35 – Demo login (use demo buyer), browse gigs, filters.  
3) 0:35–1:00 – Gig detail → checkout → create order → “Pay now” → show status transitions.  
4) 1:00–1:20 – Order messages + review after completion.  
5) 1:20–1:30 – Mention mocked payments, URL uploads, and next improvements (Stripe, uploads, email verify).

## Usage tips
- Create an account via /signup, then log in.
- Post gigs at /gigs (must be logged in). Cards link to gig detail.
- Checkout from a gig package → creates an order. Pay from order page to unlock status actions.
- Use order page to send messages, mark delivered, accept delivery, cancel, and leave a review.

## Tech stack
- Next.js (App Router), TypeScript, Tailwind CSS
- NextAuth credentials provider
- Prisma ORM with PostgreSQL

## Repo structure (key)
- `src/app/api/auth/[...nextauth]/route.ts` – auth config
- `src/app/api/signup/route.ts` – signup API
- `src/app/api/gigs/*` – gig list/create/detail
- `src/app/api/orders/*` – orders, status, messages, pay, reviews
- `src/app/signup/page.tsx`, `src/app/login/page.tsx`, `src/app/gigs/page.tsx`, `src/app/gigs/[slug]/page.tsx`, `src/app/orders/*`

## Notes
- Payments are mocked (`/api/orders/pay`). Swap with Stripe/PayPal when ready.
- File uploads are URL-based; plug in S3/UploadThing for real files.
- Revalidation disabled on gig detail for immediacy; adjust for caching if needed.

## Screenshots (capture locally)
- Home, Gigs list, Gig detail, Checkout, Order page with messages/review.

## Next improvements (optional)
- Real file uploads for messages/deliveries
- Stripe payment intent and webhooks
- Pagination on gigs/orders, skeleton loaders
- CI lint/test workflow
