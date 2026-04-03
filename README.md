# Command Center

A polished personal dashboard built with Next.js, Tailwind CSS, Prisma, and SQLite.

## Stack

- Next.js App Router
- Tailwind CSS
- Prisma + SQLite
- Recharts for analytics
- Local-first architecture with a service worker and manifest

## Getting Started

1. Install Node.js 20+.
2. Run `npm install`.
3. Run `npx prisma generate`.
4. Run `npm run db:push`.
5. Run `npm run db:seed`.
6. Run `npm run dev`.

## Notes

- Data is stored in `prisma/dev.db`.
- The schema is designed to support future authentication and online deployment.
- The app includes seeded sample data for OCC, HSE, Training, AI Projects, and Personal workspaces.
