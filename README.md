# Society Maintenance Tracker

A maintenance-complaint platform for apartment societies. Residents raise complaints with
photos and track them to resolution. Admins triage by priority, see overdue items surfaced
automatically, post notices, and get a live dashboard. Residents are emailed on every status
change and on important notices.

Live demo: _add your deployed URL here after deploying_

Demo logins (after running the seed script):
- Admin: `admin@maple.test` / `password123`
- Resident: `resident@maple.test` / `password123`

---

## Tech stack

- **Frontend + Backend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** Custom email/password auth, JWT stored in an httpOnly cookie (no third-party auth
  service needed)
- **Charts:** Recharts (dashboard)
- **Email:** Nodemailer over SMTP (works with a free Gmail App Password, or any SMTP provider)

---

## 1. Local setup

### Prerequisites
- Node.js 18+ and npm
- A Postgres database. The fastest free option is [Neon](https://neon.tech) — sign up, create
  a project, and copy the connection string it gives you.

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Copy the environment template and fill in real values
cp .env.example .env
# then edit .env — at minimum set DATABASE_URL and JWT_SECRET

# 3. Push the Prisma schema to your database (creates all tables)
npx prisma db push

# 4. (Optional but recommended) seed a demo admin + resident + sample data
npm run seed

# 5. Run the dev server
npm run dev
```

Visit `http://localhost:3000`. Register a resident account from `/register`, or use the admin
invite code from your `.env` to register an admin account.

### Email setup (optional for local testing)
If `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` aren't set, the app still works normally — it just
logs "would have sent email" to the console instead of actually sending one. To send real
emails with a free Gmail account:
1. Turn on 2-Step Verification on the Gmail account.
2. Create an "App Password" (Google Account → Security → App passwords).
3. Set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER` to the Gmail address, and
   `SMTP_PASS` to the 16-character app password.

---

## 2. Environment variables

See `.env.example` for the full list with comments. Summary:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Signs the session cookie — any long random string |
| `ADMIN_INVITE_CODE` | Required in the register form to create an ADMIN account |
| `OVERDUE_THRESHOLD_DAYS` | Days a complaint can stay open before it's flagged overdue (default 5) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Outgoing email |

---

## 3. Database schema

```
User
  id, name, email (unique), passwordHash, role (RESIDENT | ADMIN), flatNumber, createdAt
  -> complaints (as resident), historyEntries (as actor), notices (as poster)

Complaint
  id, title, category, description, photoUrl, status (OPEN | IN_PROGRESS | RESOLVED),
  priority (LOW | MEDIUM | HIGH), createdAt, updatedAt, resolvedAt
  -> residentId (FK -> User)
  -> history (1-to-many ComplaintHistory)

ComplaintHistory
  id, complaintId (FK), status, note, actorId (FK -> User), createdAt
  -- one row per status change, in order, forming a full audit trail

Notice
  id, title, body, important (boolean), createdAt, postedById (FK -> User)

Settings
  id, overdueThresholdDays  -- reserved for a future admin-configurable threshold UI;
                                currently the threshold is read from OVERDUE_THRESHOLD_DAYS
```

Full definitions are in [`prisma/schema.prisma`](./prisma/schema.prisma).

---

## 4. API reference

All routes are under `/api`. Auth is via an httpOnly session cookie set on login/register —
no bearer tokens needed from the client.

### Auth
| Method | Route | Body | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password, flatNumber?, role? }` | `role: "ADMIN"` also requires header `x-admin-invite: <ADMIN_INVITE_CODE>` |
| POST | `/api/auth/login` | `{ email, password }` | |
| POST | `/api/auth/logout` | — | Clears the session cookie |

### Complaints
| Method | Route | Who | Notes |
|---|---|---|---|
| GET | `/api/complaints?status=&category=&from=&to=` | Resident (own only) / Admin (all) | Admin results are sorted overdue-first |
| POST | `/api/complaints` | Resident | `{ title, category, description, photoUrl? }`. Creates the first history entry (OPEN) automatically |
| GET | `/api/complaints/:id` | Resident (own) / Admin | Includes full history with actor names |
| PATCH | `/api/complaints/:id/status` | Admin | `{ status: "IN_PROGRESS"|"RESOLVED", note? }`. Appends a history row, sets `resolvedAt` when resolved, emails the resident |
| PATCH | `/api/complaints/:id/priority` | Admin | `{ priority: "LOW"|"MEDIUM"|"HIGH" }` |

### Notices
| Method | Route | Who | Notes |
|---|---|---|---|
| GET | `/api/notices` | Any logged-in user | Sorted important-first, then newest-first |
| POST | `/api/notices` | Admin | `{ title, body, important? }`. If `important`, emails every resident |

### Dashboard
| Method | Route | Who | Returns |
|---|---|---|---|
| GET | `/api/dashboard` | Admin | `{ total, byStatus, byCategory, byPriority, overdueCount }` |

Photos are uploaded as base64 data URLs directly in the complaint's `photoUrl` field (capped at
~4MB client-side, ~6MB server-side) — no separate file storage service required, which keeps
the app deployable on Vercel's serverless runtime without extra configuration.

---

## 5. Deployment

See the step-by-step guide you were given alongside this project for pushing to GitHub and
deploying to Vercel with a free Neon database.

---

## 6. Project structure

```
app/
  page.tsx                    landing page
  login/, register/           auth pages
  resident/dashboard/         resident's complaint list + raise-complaint form
  resident/complaints/[id]/   complaint detail + history timeline (shared by admin)
  admin/dashboard/            stats + charts
  admin/complaints/           filterable complaint table, overdue-first
  admin/notices/              post notices
  notices/                    read-only notice board (residents)
  api/                        all backend route handlers
src/
  lib/                        db client, auth helpers, mailer, utils
  components/                 Navbar, badges, StatCard
prisma/
  schema.prisma                data model
  seed.js                      demo data
```
