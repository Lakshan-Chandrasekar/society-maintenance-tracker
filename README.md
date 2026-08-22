# Society Maintenance Tracker

A simple system for apartment societies to manage maintenance complaints. Residents log
complaints (with a photo if needed) and can see the full status history. Admins go through
complaints, set priority, update status, and post notices to the whole society. Residents get
an email whenever their complaint status changes or an important notice goes up.

Live app: https://society-maintenance-tracker-bay.vercel.app/

Demo accounts (only work after you run the seed script, see below):
- Admin - admin@maple.test / password123
- Resident - resident@maple.test / password123

## Stack used

- Next.js 14 (App Router) with TypeScript for both frontend and API
- PostgreSQL, accessed through Prisma
- Auth done manually - email/password, JWT kept in an httpOnly cookie. No Auth0/Clerk, just
  bcrypt + jsonwebtoken
- Tailwind for styling
- Recharts for the two charts on the admin dashboard
- Nodemailer for sending emails over plain SMTP

## Setting it up locally

You need Node 18+ and a Postgres database. If you don't already have one, the quickest way is
[Neon](https://neon.tech) - free tier, gives you a connection string in about a minute.

```bash
npm install
cp .env.example .env
```

Open `.env` and fill in at least `DATABASE_URL` and `JWT_SECRET`. Everything in there is
explained with a comment, but roughly:

- `DATABASE_URL` - your Postgres connection string
- `JWT_SECRET` - any random string, used to sign the login cookie
- `ADMIN_INVITE_CODE` - whoever knows this code can register as an admin from the sign-up page
- `OVERDUE_THRESHOLD_DAYS` - how many days a complaint can sit open before it gets flagged
  overdue (defaults to 5)
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` - for sending emails

Once the env file is ready:

```bash
npx prisma db push      # creates all the tables in your database
npm run seed             # optional, adds a demo admin + resident + one sample complaint
npm run dev
```

App runs at `http://localhost:3000`. Sign up as a resident normally, or use the admin invite
code to sign up as admin.

A note on email - if you don't set the SMTP variables, the app doesn't break, it just prints
"would have sent email to ..." in the terminal instead of actually sending anything. That's
fine for testing the whole flow without setting up a mailbox. When you do want real emails,
the easiest route is a Gmail account with an App Password (turn on 2-Step Verification first,
then Google Account > Security > App Passwords).

## How the database is laid out

```
User
  id, name, email, passwordHash, role (RESIDENT/ADMIN), flatNumber, createdAt

Complaint
  id, title, category, description, photoUrl, status, priority,
  createdAt, updatedAt, resolvedAt, residentId (-> User)

ComplaintHistory
  id, complaintId (-> Complaint), status, note, actorId (-> User), createdAt
  one row gets added every time a complaint's status changes, so this table
  is basically the full timeline you see on the complaint detail page

Notice
  id, title, body, important, createdAt, postedById (-> User)

Settings
  id, overdueThresholdDays
  (table exists for a future admin screen to change the threshold from the UI;
  right now the app just reads it from the env variable instead)
```

Actual schema with types and relations is in `prisma/schema.prisma`.

Why a separate history table instead of just a status column - the brief asks for a recorded
history with timestamp, actor and note for every change, and the admin/resident both need to
see that as a timeline. Keeping it append-only (nothing in that table ever gets edited or
deleted) means it also works as a basic audit log, which felt like the right call for
something residents might refer back to if there's a dispute about when an issue was actually
fixed.

## API routes

Everything sits under `/api`. No separate token handling on the client - login/register sets
an httpOnly cookie and every request after that just carries it automatically.

**Auth**
- `POST /api/auth/register` - body: `{ name, email, password, flatNumber?, role? }`. If
  `role` is `"ADMIN"`, you also need the header `x-admin-invite` set to your
  `ADMIN_INVITE_CODE`, otherwise it silently registers as a resident.
- `POST /api/auth/login` - body: `{ email, password }`
- `POST /api/auth/logout`

**Complaints**
- `GET /api/complaints` - residents get only their own, admins get everything. Supports
  `?status=&category=&from=&to=` query params for filtering. For admins the list comes back
  with overdue complaints sorted to the top.
- `POST /api/complaints` - resident only. Body: `{ title, category, description, photoUrl? }`.
  This also creates the first history entry automatically.
- `GET /api/complaints/:id` - full detail including the history array with who did what and
  when.
- `PATCH /api/complaints/:id/status` - admin only. Body: `{ status, note? }`. Adds a history
  row, closes the complaint if status is RESOLVED, and fires an email to the resident.
- `PATCH /api/complaints/:id/priority` - admin only. Body: `{ priority }`.

**Notices**
- `GET /api/notices` - pinned/important ones first, then newest first.
- `POST /api/notices` - admin only. Body: `{ title, body, important? }`. If marked important,
  every resident gets emailed.

**Dashboard**
- `GET /api/dashboard` - admin only, returns counts by status, category, priority, and how
  many complaints are currently overdue.

One implementation note on photos: instead of wiring up S3 or Cloudinary for one photo per
complaint, the image gets converted to a base64 string in the browser and stored directly in
the `photoUrl` column. Capped at ~4MB on the client and ~6MB on the server so nobody can blow
up the database with a huge upload. It's not how you'd do it at real scale, but for a society
of a few hundred flats it avoids an entire extra service and its credentials.

## Deploying

Covered separately, but in short: push to GitHub, spin up a free Postgres on Neon, import the
repo into Vercel, add the same env vars from `.env.example` in the Vercel project settings,
then run `npx prisma db push` once against the production database before you use the app.

## Folder structure

```
app/
  page.tsx                     landing page
  login/, register/            auth pages
  resident/dashboard/          resident's complaint list + the raise-complaint form
  resident/complaints/[id]/    complaint detail + history timeline (admin uses this too)
  admin/dashboard/             stat cards + charts
  admin/complaints/            filterable table of every complaint, overdue ones first
  admin/notices/               posting notices
  notices/                     read-only notice board for residents
  api/                         route handlers, one folder per resource
src/
  lib/                         prisma client, auth helpers, mailer, small utils
  components/                  navbar, status/priority badges, stat card
prisma/
  schema.prisma                the data model
  seed.js                      demo admin/resident + sample complaint and notice
```
```
