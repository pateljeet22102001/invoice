# INVOICE — HisabSaathi

GST billing and stock management for Indian traders (purchase, sales, party ledger, accounting).

**Repository:** [pateljeet22102001/INVOICE](https://github.com/pateljeet22102001/INVOICE)  
**Author:** Jeet Patel ([@pateljeet22102001](https://github.com/pateljeet22102001))

## Stack

- Next.js 16, TypeScript, Tailwind CSS
- Prisma + PostgreSQL (Neon)
- NextAuth v5

## Setup

```bash
npm install
cp .env.example .env   # add DATABASE_URL and AUTH_SECRET
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo login

- Email: `demo@hisabsaathi.in`
- Password: `demo123456`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Prisma Studio |
