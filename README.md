# Blog Panel

Monorepo containing the admin dashboard and its backend API.

```
blog-panel/
├── admin/     React admin dashboard (websites, blogs, categories, products, SEO)
└── backend/   Express + MongoDB API
```

## Local setup

```bash
# Backend
cd backend
cp .env.example .env   # fill in real values
npm install
npm start               # http://localhost:5014

# Admin (in a separate terminal)
cd admin
cp .env.example .env
npm install
npm start                # http://localhost:3000
```

## VPS deployment

1. Clone this repo on the server.
2. `backend/`: copy `.env.example` to `.env`, fill in real `MONGODB_URI`, a strong random `ADMIN_API_KEY`, `CORS_ORIGINS`, `PUBLIC_BASE_URL`, and `NODE_ENV=production`. Run with `npm install && npm start` (or under PM2), behind Nginx as a reverse proxy.
3. `admin/`: copy `.env.example` to `.env` with `REACT_APP_API_URL` pointing at the deployed backend, then `npm install && npm run build`. Serve the `build/` folder as static files (e.g. via Nginx).
4. `backend/uploads/` must be writable by the Node process — it stores uploaded images at runtime and is intentionally not committed to git.

See each subfolder's own README for endpoint/feature details.
