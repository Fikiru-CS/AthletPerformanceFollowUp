# APTS — Athlete Performance Tracking System

A full-stack web application for athletes to record, monitor, and analyze training sessions.

---

## Project Structure

```
APTS/
├── database/          ← PostgreSQL schema (run first)
├── backend/           ← Node.js + Express REST API
└── frontend/          ← Next.js web app
```

---

## Quick Start (Step-by-Step)

### Step 1 — Install Prerequisites

Make sure you have these installed before starting:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v18+ | https://nodejs.org |
| PostgreSQL | v14+ | https://postgresql.org |
| VS Code | latest | https://code.visualstudio.com |

---

### Step 2 — Set Up the Database

Open a terminal and run:

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE apts_db;"

# Run the schema (creates all tables + indexes)
psql -U postgres -d apts_db -f database/schema.sql

# Verify tables were created
psql -U postgres -d apts_db -c "\dt"
```

You should see three tables: `users`, `training_sessions`, `kilometer_splits`

---

### Step 3 — Configure and Start the Backend

```bash
# Go into the backend folder
cd backend

# Install all packages
npm install

# Create your environment file
# (copy .env.example to .env and fill in your DB password)
cp .env.example .env
```

Open `.env` and edit it:
```
DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/apts_db
JWT_SECRET=any_long_random_string_like_this_xyz123abc456
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Then start the server:
```bash
npm run dev
# ✅ APTS API running on http://localhost:5000
```

Test it works: open http://localhost:5000/api/health — you should see `{ "status": "ok" }`

---

### Step 4 — Configure and Start the Frontend

Open a **second terminal**:

```bash
# Go into the frontend folder
cd frontend

# Install all packages
npm install

# Create your environment file
cp .env.local.example .env.local
```

The `.env.local` file should contain:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Then start the frontend:
```bash
npm run dev
# App running at http://localhost:3000
```

---

### Step 5 — Open the App

Go to **http://localhost:3000** in your browser.

You'll be redirected to the login page. Click "Create one" to register a new athlete account.

---

## How It Works

### Authentication Flow
1. User submits email + password on the Register page
2. Backend hashes password with `bcrypt` and saves to `users` table
3. Backend creates a JWT token (valid for 7 days) and returns it
4. Frontend saves token to a browser cookie (`apts_token`)
5. Every API request automatically includes `Authorization: Bearer <token>`
6. Backend middleware verifies the token before processing any protected route

### Recording a Session
1. Athlete fills in the New Session form (distance, duration, route, etc.)
2. Frontend sends `POST /api/sessions` to the backend
3. Backend calculates `avg_speed = distance / (duration/60)` and `avg_pace = duration / distance`
4. Backend opens a database transaction, inserts the session row, then inserts each km split row
5. If any step fails, the transaction is rolled back (no partial data)
6. Frontend redirects to the sessions list on success

### Analytics
1. Dashboard page calls `GET /api/analytics/summary` and `GET /api/analytics/trends`
2. Summary endpoint runs aggregated SQL queries (`SUM`, `AVG`, `MIN`, `MAX`) for the current user
3. Trends endpoint returns day-by-day records for the last N days
4. Recharts library renders the data as Area charts, Line charts, and Bar charts

---

## File Explanations

### Database (`database/schema.sql`)
- Creates 3 tables with UUID primary keys
- Adds indexes for fast queries
- Sets up a trigger to auto-update `updated_at` timestamps
- `ON DELETE CASCADE` means deleting a user removes all their data

### Backend Files

| File | What it does |
|------|-------------|
| `server.js` | Starts Express, registers middleware and routes |
| `db/pool.js` | Creates a PostgreSQL connection pool (reuses connections for speed) |
| `middleware/auth.js` | Reads the JWT from request header, verifies it, adds user info to `req.user` |
| `middleware/validate.js` | Checks input data before it reaches controllers |
| `controllers/authController.js` | register, login, getMe, updateProfile logic |
| `controllers/sessionsController.js` | Create/Read/Update/Delete sessions + splits |
| `controllers/analyticsController.js` | Summary stats and time-series trends |
| `routes/auth.js` | Maps URLs to auth controller functions |
| `routes/sessions.js` | Maps URLs to session controller functions |
| `routes/analytics.js` | Maps URLs to analytics controller functions |

### Frontend Files

| File | What it does |
|------|-------------|
| `lib/api.js` | Axios HTTP client; automatically adds JWT to all requests |
| `lib/AuthContext.js` | React Context that stores current user; provides login/logout |
| `app/layout.js` | Root HTML shell; loads fonts; wraps everything in AuthProvider |
| `app/globals.css` | All CSS variables, component styles, design system |
| `components/layout/Sidebar.js` | Left navigation bar shown on all protected pages |
| `app/page.js` | Root route — redirects to dashboard or login |
| `app/auth/login/page.js` | Login form |
| `app/auth/register/page.js` | Registration form |
| `app/dashboard/page.js` | Home dashboard with stats + charts |
| `app/sessions/page.js` | Paginated table of all sessions |
| `app/sessions/new/page.js` | Form to log a new session + km splits |
| `app/sessions/[id]/page.js` | Detail view with splits chart |
| `app/sessions/[id]/edit/page.js` | Edit an existing session |
| `app/analytics/page.js` | Full analytics: distance, speed, pace charts + weekly table |
| `app/profile/page.js` | User profile editor + career stats |

---

## All Packages

### Backend
```bash
npm install express pg bcryptjs jsonwebtoken cors dotenv express-validator
npm install --save-dev nodemon
```

| Package | Purpose |
|---------|---------|
| `express` | HTTP server framework |
| `pg` | PostgreSQL driver and connection pool |
| `bcryptjs` | Secure password hashing |
| `jsonwebtoken` | Create and verify JWT tokens |
| `cors` | Allow frontend to call the API |
| `dotenv` | Read `.env` file into `process.env` |
| `express-validator` | Input validation rules |
| `nodemon` | Auto-restart server during development |

### Frontend
```bash
npm install next react react-dom axios recharts lucide-react js-cookie clsx date-fns
```

| Package | Purpose |
|---------|---------|
| `next` | React framework (routing, SSR) |
| `react` / `react-dom` | UI component engine |
| `axios` | HTTP client with interceptors |
| `recharts` | Charts: AreaChart, LineChart, BarChart |
| `js-cookie` | Read/write browser cookies for JWT |
| `lucide-react` | SVG icon library |
| `clsx` | Conditional CSS class names |
| `date-fns` | Date formatting utilities |

---

## API Reference

### Auth (Public)
```
POST /api/auth/register   { name, email, password }
POST /api/auth/login      { email, password }
```

### Auth (Protected — needs JWT header)
```
GET  /api/auth/me
PUT  /api/auth/profile    { name, bio }
```

### Sessions (Protected)
```
POST   /api/sessions                { title, distance_km, duration_minutes, training_date, ... }
GET    /api/sessions?page=1&limit=10
GET    /api/sessions/:id
PUT    /api/sessions/:id
DELETE /api/sessions/:id
```

### Analytics (Protected)
```
GET /api/analytics/summary
GET /api/analytics/trends?days=30
```

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `ECONNREFUSED 5432` | PostgreSQL not running | Start PostgreSQL service |
| `JWT malformed` | Token missing/expired | Log out and log back in |
| `relation does not exist` | Schema not applied | Run `schema.sql` again |
| `CORS error` | Wrong FRONTEND_URL in .env | Check `.env` matches port 3000 |
| `MODULE_NOT_FOUND` | packages not installed | Run `npm install` in both folders |

---

## VS Code Tips

Recommended extensions to install:
- **ESLint** — code quality hints
- **Prettier** — auto-format on save
- **PostgreSQL** (by Chris Kolkman) — run SQL directly in VS Code
- **Thunder Client** or **REST Client** — test API endpoints without Postman
