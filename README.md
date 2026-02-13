# GhostLogic Black Box Console

Forensic capsule management dashboard for the GhostLogic Blackbox system. React + Vite + TypeScript + Tailwind CSS v4.

## Pages

- **Dashboard** — Server health, capsule stats, auto-seal status
- **Ingest** — POST events to the buffer via JSON editor
- **Seal** — Freeze the buffer into an immutable capsule
- **Capsules** — Browse, search, verify, and download capsules
- **Admin** — Cross-tenant stats, capsule listing, API key management (requires admin key)
- **Settings** — Configure tenant/admin API keys, view connection info

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```
VITE_BLACKBOX_URL=https://api.ghostlogic.tech
```

For local backend development, point to your VM:

```
VITE_BLACKBOX_URL=https://131.186.2.15:8443
```

## Build

```bash
# Type check + production build
npm run build

# Preview the production build locally
npm run preview
```

Output goes to `dist/`.

## Deploy to Cloudflare Pages

### Option A: Git Integration

1. Push this repo to GitHub
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) > Workers & Pages > Create
3. Connect your GitHub repo
4. Build settings:
   - **Framework preset**: None
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Environment variables:
   - `VITE_BLACKBOX_URL` = `https://blackbox.ghostlogic.tech`
6. Deploy

### Option B: Direct Upload

```bash
npm run build
npx wrangler pages deploy dist --project-name=blackbox-console
```

## Auth

Keys are stored in `localStorage`:

- **Tenant API Key** (`blackbox_tenant_key`) — Required for all capsule operations
- **Admin API Key** (`blackbox_admin_key`) — Optional, enables the Admin panel

Set keys in the Settings page. The tenant key is validated against `GET /api/v1/me` on save.

## API Endpoints

All calls go to `VITE_BLACKBOX_URL`:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | None | Service info |
| GET | `/health` | None | Health check |
| GET | `/api/v1/info` | None | Server info |
| GET | `/api/v1/me` | Tenant | Validate key |
| GET | `/api/v1/status` | Tenant | Buffer & capsule stats |
| POST | `/api/v1/ingest` | Tenant | Ingest events |
| POST | `/api/v1/seal` | Tenant | Seal capsule |
| GET | `/api/v1/capsules` | Tenant | List capsules |
| GET | `/api/v1/capsules/:id` | Tenant | Capsule manifest |
| POST | `/api/v1/verify` | Tenant | Verify integrity |
| GET | `/api/v1/capsules/:id/download` | Tenant | Download .glcf.gz |
| GET | `/api/v1/admin/stats` | Admin | Global stats |
| GET | `/api/v1/admin/capsules` | Admin | All capsules |
| GET | `/api/v1/keys` | Admin | List API keys |
| POST | `/api/v1/keys` | Admin | Create API key |
| DELETE | `/api/v1/keys/:id` | Admin | Revoke API key |

## Stack

- React 18 + TypeScript
- Vite 6
- Tailwind CSS v4
- Motion (Framer Motion)
- Lucide React icons
- Sonner toast notifications
