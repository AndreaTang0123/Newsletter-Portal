# Newsletter Subscriber Portal

BioCryst's internal tool for managing employee newsletter distribution lists — curators and admins maintain subscriber rosters, bulk-import contacts, and audit every change; employees manage their own subscriptions through a public self-service page. See [docs/product-overview.md](docs/product-overview.md) for the full picture.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (static export) · React 18 · TypeScript, hosted on Azure Static Web Apps |
| Backend | FastAPI · Python, hosted on Azure App Service |
| Database | Azure Database for PostgreSQL Flexible Server (private network) |
| Authentication | Microsoft Entra ID SSO, restricted to `@biocryst.com` |

## Documentation

| Doc | Covers |
|---|---|
| [Product Overview](docs/product-overview.md) | What this is, who it's for, what it does and doesn't do |
| [User Guide](docs/user-guide.md) | How to use every screen in the portal |
| [FAQ](docs/faq.md) | Common questions |
| [Architecture Overview](docs/architecture-overview.md) | System design, components, auth flow |
| [Deployment Guide](docs/deployment-guide.md) | Azure resources, CI/CD, local dev setup, environment variables |
| [API Reference](docs/api-reference.md) | Every backend endpoint |
| [Database Schema](docs/database-schema.md) | Tables, columns, relationships |
| [Troubleshooting](docs/troubleshooting.md) | Known issues and how they were fixed |
| [Release Notes](docs/release-notes.md) | What's changed over time |

## Quick start (local development)

See [Deployment Guide → Local Development](docs/deployment-guide.md#local-development) for full setup steps. Short version:

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in DATABASE_URL and AZURE_AD_* values
python -m uvicorn app.main:app --reload   # http://localhost:8000

# Frontend
cd frontend
npm install
cp .env.local.example .env.local   # fill in NEXT_PUBLIC_* values
npm run dev   # http://localhost:3000
```

## License

Proprietary — internal use only.
