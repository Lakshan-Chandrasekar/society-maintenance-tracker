# Society Maintenance Tracker

A web app for apartment societies to manage maintenance complaints. Residents raise complaints
with an optional photo and can follow each one's status history. Admins set priority, update
status and post notices for the whole society. Residents get an email when their complaint
status changes or an important notice is posted.

Live app: https://society-maintenance-tracker-bay.vercel.app/

Demo accounts (created by the seed script):
- Admin: admin@maple.test / password123
- Resident: resident@maple.test / password123

## Stack

- Next.js 14 (App Router) with TypeScript
- PostgreSQL with Prisma
- Email/password auth with bcrypt and jsonwebtoken, session JWT in an httpOnly cookie
- Tailwind CSS
- Recharts for the admin dashboard charts
- Nodemailer (SMTP) for email

## Running locally

Requires Node 18+ and a PostgreSQL database.

```bash
npm install
cp .env.example .env
npx prisma db push
npm run seed      # optional demo data
npm run dev
```

The app runs at `http://localhost:3000`.

Environment variables:

- `DATABASE_URL`: Postgres connection string
- `JWT_SECRET`: secret used to sign the session cookie
- `ADMIN_INVITE_CODE`: code required to register as an admin
- `OVERDUE_THRESHOLD_DAYS`: days before an open complaint is flagged as overdue (default 5)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: mail settings. When these
  are empty, emails are logged to the console.

## Database

```
User              id, name, email, passwordHash, role (RESIDENT/ADMIN), flatNumber, createdAt
Complaint         id, title, category, description, photoUrl, status, priority,
                  createdAt, updatedAt, resolvedAt, residentId -> User
ComplaintHistory  id, complaintId -> Complaint, status, note, actorId -> User, createdAt
Notice            id, title, body, important, createdAt, postedById -> User
Settings          id, overdueThresholdDays
```

Every status change adds a row to `ComplaintHistory`, which is the timeline shown on the
complaint page. The full schema is in `prisma/schema.prisma`, and the design decisions are in
[SYSTEM_DESIGN.md](SYSTEM_DESIGN.md).

## API

All routes are under `/api`. Login and register set an httpOnly session cookie that the
browser sends with later requests.

Auth
- `POST /api/auth/register`: `{ name, email, password, flatNumber?, role? }`. Registering as
  `"ADMIN"` needs the `x-admin-invite` header to match `ADMIN_INVITE_CODE`; otherwise the
  account is created as a resident.
- `POST /api/auth/login`: `{ email, password }`
- `POST /api/auth/logout`

Complaints
- `GET /api/complaints`: residents get their own, admins get all. Filters:
  `?status=&category=&from=&to=`. Admins see overdue complaints first.
- `POST /api/complaints`: residents only. `{ title, category, description, photoUrl? }`
- `GET /api/complaints/:id`: complaint detail with its history
- `PATCH /api/complaints/:id/status`: admins only. `{ status, note? }`. Adds a history row and
  emails the resident. Setting `RESOLVED` closes the complaint.
- `PATCH /api/complaints/:id/priority`: admins only. `{ priority }`

Notices
- `GET /api/notices`: important notices first, then newest first
- `POST /api/notices`: admins only. `{ title, body, important? }`. Important notices are
  emailed to every resident.

Dashboard
- `GET /api/dashboard`: admins only. Counts by status, category and priority, and the number
  of overdue complaints.

## Folder structure

```
app/
  page.tsx                     landing page
  login/, register/            auth pages
  resident/dashboard/          resident's complaints and the new complaint form
  resident/complaints/[id]/    complaint detail and history timeline (also used by admins)
  admin/dashboard/             stat cards and charts
  admin/complaints/            all complaints with filters, overdue first
  admin/notices/               posting notices
  notices/                     notice board for residents
  api/                         route handlers
src/
  lib/                         prisma client, auth, mailer, utils
  components/                  navbar, badges, stat card
prisma/
  schema.prisma                data model
  seed.js                      demo users, complaint and notice
```
