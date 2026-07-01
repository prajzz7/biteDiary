# BiteDiary

BiteDiary is organized as an npm workspace monorepo.

## Workspaces

- `backend`: TypeScript Express API, Prisma schema, migrations, and database access.
- `frontend`: TypeScript Next.js app.

## Commands

```powershell
npm run dev:backend
npm run dev:frontend
npm run build:backend
npm run build:frontend
npm run typecheck
npm run prisma:migrate
npm run prisma:generate
npm run prisma:studio
```

The backend uses `backend/.env`. A safe template is available at `backend/.env.example`.

## Codex Notes

- [Codex skills and agents quick reference](docs/codex-skills-and-agents.md)
