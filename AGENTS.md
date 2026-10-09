# dash: instructions for agents

Jaber's personal dashboard (dash.jabx.me) and public site (jabx.me): projects, tasks, notes,
calendar and resources for one person, used on desktop and as an iPhone home-screen web app.

## Stack

TypeScript, Next.js 14 (App Router), Tailwind, Prisma on SQLite/Turso. Private pages:
`app/dash/*` (served on the private host by `middleware.ts`); features in `features/*`; server
actions in `lib/actions.ts`; auth in `lib/auth*.ts`. Deployed by Vercel on every push to `main`.

## Gates

Run these before reporting work as done:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run test:e2e` when pages or flows change

## Design system

Tokens are HSL variables in `app/globals.css`, mapped in `tailwind.config.ts`; Inter via
`lib/fonts.ts`; components in `components/ui/*`. Use only the styles they define.

## Rules

- Do not commit, push, send or publish unless your brief or the user asks for it.
- Change only what the task needs; leave unrelated files alone.
- Keep a checklist of every part of the task. Before ending your turn, check it: if
  anything is open, keep going or say what is blocking it.
