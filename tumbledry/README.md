# Tumbledry POS — React + Netlify + Neon

Production-grade laundry POS system built with React, deployed on Netlify, with Neon PostgreSQL as the database.

---

## 🏗️ Architecture

```
React (Vite) → Netlify CDN
                    ↕
            Netlify Functions (serverless Node.js)
                    ↕
            Neon (PostgreSQL)
```

---

## 🚀 Setup Guide

### Step 1 — Neon Database

1. Go to [neon.tech](https://neon.tech) → Create a free account
2. Create a new project called `tumbledry`
3. Open the **SQL Editor** and paste the contents of `schema.sql` → Run
4. Go to **Connection Details** → copy the connection string (looks like `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`)

### Step 2 — Netlify Setup

1. Push this project to a GitHub repository
2. Go to [netlify.com](https://netlify.com) → New site from Git → select your repo
3. Build settings are auto-detected from `netlify.toml`
4. Go to **Site Settings → Environment Variables** and add:

```
DATABASE_URL    = postgresql://...  (your Neon connection string)
API_SECRET      = tumbledry2026     (choose your own password)
VITE_API_SECRET = tumbledry2026     (same password — used by React frontend)
```

5. Trigger a deploy → your site is live!

### Step 3 — Local Development

```bash
# Install dependencies
npm install

# Install Netlify CLI
npm install -g netlify-cli

# Copy env file
cp .env.example .env
# Edit .env with your actual DATABASE_URL and API_SECRET

# Run locally (Netlify dev proxies functions + React)
netlify dev
```

### Step 4 — Import existing data (optional)

If you have the CSV export from your old POS:

1. Go to your live site → Dashboard → Data Management
2. Or use psql directly:
```bash
psql $DATABASE_URL -c "\copy orders FROM 'tumbledry_orders_import.csv' CSV HEADER"
```

---

## 📁 Project Structure

```
tumbledry/
├── netlify/
│   └── functions/
│       ├── _db.js          ← Shared DB connection + auth helpers
│       ├── orders.js       ← GET all orders, POST upsert/bulk import
│       └── attendance.js   ← GET/POST attendance records
├── src/
│   ├── components/
│   │   ├── Layout.jsx      ← Sidebar navigation
│   │   └── ui/index.jsx    ← Reusable UI components
│   ├── lib/
│   │   ├── api.js          ← All API calls to Netlify Functions
│   │   └── garments.js     ← Rate card, categories, helpers
│   ├── pages/
│   │   ├── POS.jsx         ← Order entry + cart + billing
│   │   ├── Dashboard.jsx   ← Orders list + stats + timeline
│   │   ├── Analytics.jsx   ← Charts + insights + KPIs
│   │   └── Attendance.jsx  ← Staff attendance management
│   ├── store/index.js      ← Zustand global state
│   ├── App.jsx             ← Routes
│   ├── main.jsx            ← Entry point
│   └── index.css           ← Design system + CSS variables
├── schema.sql              ← Run this in Neon SQL Editor
├── netlify.toml            ← Netlify build + redirect config
├── vite.config.js
└── package.json
```

---

## 🔒 Security

- Database credentials are **never** in the browser — only in Netlify environment variables
- All API calls require the `x-api-secret` header matching `API_SECRET`
- Set a strong, unique `API_SECRET` — not the default `tumbledry2026`

---

## 💰 Cost

| Service | Free Tier | Your usage |
|---------|-----------|------------|
| Netlify | 100GB bandwidth, 125k function calls/month | ~$0 |
| Neon | 0.5GB storage, unlimited connections | ~$0 |
| **Total** | | **$0/month** |

---

## 🔧 Adding features

**New API endpoint:**
1. Create `netlify/functions/your-feature.js`
2. Add the call to `src/lib/api.js`
3. Use it in your React component

**New database column:**
1. Run `ALTER TABLE orders ADD COLUMN ...` in Neon SQL Editor
2. Update the INSERT/SELECT in `netlify/functions/orders.js`
3. Update the order object in `src/pages/POS.jsx`
