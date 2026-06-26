# 🗳️ Secure Online Election System

A full-stack online election platform built with **Next.js** (frontend) and **Express + Prisma + PostgreSQL** (backend). Features role-based access control, anonymous ballot casting, real-time election status, and a professional admin dashboard.

## ✨ Features

- **Voter Portal** — Register, login, browse elections, cast anonymous ballots
- **Admin Dashboard** — Create elections, manage candidates, view results, export CSV
- **Security Hardened** — JWT auth, bcrypt passwords, rate limiting, CORS, Helmet, input sanitization, role escalation prevention
- **Anonymous Voting** — Ballots are cryptographically separated from voter identity
- **Mobile Responsive** — Works on all devices

## 🏗️ Architecture

```
frontend/          → Next.js 16 (Vercel)
backend/           → Express 5 + Prisma + PostgreSQL (Render)
```

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL running locally

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/Online-Election.git
cd Online-Election

# 2. Backend setup
cd backend
cp .env.example .env        # Edit .env with your DB credentials
npm install
npx prisma generate
npx prisma migrate dev
npm run dev                  # Starts on http://localhost:3000

# 3. Frontend setup (new terminal)
cd frontend
npm install
npm run dev                  # Starts on http://localhost:3001
```

### Create an Admin User

```bash
cd backend
npx prisma studio           # Opens DB GUI at http://localhost:5555
# Manually change a user's role from VOTER to ADMIN
```

## 🌐 Deployment

### Backend → Render

1. Push code to GitHub
2. Go to [render.com](https://render.com) → **New** → **Blueprint**
3. Connect your GitHub repo — Render reads `render.yaml` automatically
4. It creates:
   - **Web Service** (Express API)
   - **PostgreSQL Database** (free tier)
5. Set environment variables on the web service:
   - `CORS_ORIGIN` → your Vercel URL (e.g., `https://your-app.vercel.app`)
   - `FRONTEND_URL` → same as CORS_ORIGIN

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo
3. Set **Root Directory** to `frontend`
4. Set environment variable:
   - `NEXT_PUBLIC_API_URL` → your Render backend URL (e.g., `https://online-election-api.onrender.com`)
5. Deploy!

## 🔐 Security Features

| Feature | Implementation |
|---------|---------------|
| Password Hashing | bcrypt (12 rounds) |
| Authentication | JWT (HS256, 24h expiry) |
| Rate Limiting | Global (100/min), Auth (10/15min), Vote (10/min) |
| Input Sanitization | HTML stripping, email normalization, UUID validation |
| HTTP Headers | Helmet (CSP, HSTS, X-Frame-Options, noSniff) |
| Role Escalation | Registration hardcodes VOTER role |
| Anonymous Voting | Ballot table has NO user foreign key |
| CORS | Strict origin validation |

## 📁 Project Structure

```
backend/
├── prisma/
│   └── schema.prisma        # Database schema
├── src/
│   ├── controllers/          # Route handlers
│   ├── middleware/            # Auth, validators
│   ├── lib/                   # Prisma client, email
│   ├── routes/                # Express routes
│   └── server.ts              # Entry point
└── .env.example               # Environment template

frontend/
├── src/
│   ├── app/                   # Next.js pages
│   │   ├── admin/             # Admin dashboard
│   │   ├── dashboard/         # Voter dashboard
│   │   ├── login/             # Voter login
│   │   ├── register/          # Voter registration
│   │   └── vote/              # Voting interface
│   ├── components/            # Reusable components
│   ├── hooks/                 # Auth hooks
│   └── lib/                   # API client, types
├── next.config.ts             # API proxy config
└── vercel.json                # Vercel deployment
```

## 📄 License

MIT
