# Society Maintenance Tracker

A small app for apartment societies to handle maintenance complaints. Residents log a complaint
(with a photo if they want) and can see its full status history. Admins go through the
complaints, set priority, update status and post notices for the whole society. Residents get
an email when their complaint status changes or when an important notice goes up.

Live app: https://society-maintenance-tracker-bay.vercel.app/

Demo accounts (these only exist after you run the seed script, see below):
- Admin: admin@maple.test / password123
- Resident: resident@maple.test / password123

## Stack

- Next.js 14 (App Router) with TypeScript for both the frontend and the API
- PostgreSQL through Prisma
- Email/password auth written by hand with bcrypt and jsonwebtoken. The JWT sits in an
  httpOnly cookie. I didn't use Auth0 or Clerk.
- Tailwind for styling
- Recharts for the two charts on the admin dashboard
- Nodemailer for sending email over plain SMTP

## Running it locally

You need Node 18+ and a Postgres database. If you don't have one, [Neon](https://neon.tech) has
a free tier and gives you a connection string in about a minute.

```bash
npm install
cp .env.example .env
```

Open `.env` and fill in at least `DATABASE_URL` and `JWT_SECRET`. Each variable has a comment
in the file, but in short:

- `DATABASE_URL`: your Postgres connection string
- `JWT_SECRET`: any random string, used to sign the login cookie
- `ADMIN_INVITE_CODE`: anyone who knows this code can register as an admin from the sign-up page
- `OVERDUE_THRESHOLD_DAYS`: how many days a complaint can stay open before it's flagged as
  overdue (default 5)
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM`: for sending emails

Then:

```bash
npx prisma db push      # creates all the tables in your database
npm run seed             # optional, adds a demo admin + resident + one sample complaint
npm run dev
```

The app runs at `http://localhost:3000`. Sign up as a resident normally, or enter the admin
invite code on the sign-up page to get an admin account.

If you leave the SMTP variables empty, nothing breaks. The app prints "would have sent email to
..." in the terminal instead of sending anything, so you can test the whole flow without a
mailbox. For real emails, a Gmail account with an App Password is the easiest option (turn on
2-Step Verification first, then go to Google Account > Security > App Passwords).

## Database

```
User
  id, name, email, passwordHash, role (RESIDENT/ADMIN), flatNumber, createdAt

Complaint
  id, title, category, description, photoUrl, status, priority,
  createdAt, updatedAt, resolvedAt, residentId (-> User)

ComplaintHistory
  id, complaintId (-> Complaint), status, note, actorId (-> User), createdAt
  one row gets added every time a complaint's status changes, so this table
  is the timeline you see on the complaint detail page

Notice
  id, title, body, important, createdAt, postedById (-> User)

Settings
  id, overdueThresholdDays
  (meant for a future admin screen that changes the threshold from the UI;
  for now the app reads it from the env variable)
```

The full schema with types and relations is in `prisma/schema.prisma`.

I used a separate history table instead of only a status column because the brief asks for a
recorded history (timestamp, actor and note) for every change, and both admins and residents
need to see it as a timeline. Rows in that table are never edited or deleted, so it also works
as a basic audit log. That seemed useful for something residents might look back at if there's
a dispute about when an issue was actually fixed.

## API routes

Everything is under `/api`. The client doesn't handle tokens itself: login and register set an
httpOnly cookie, and the browser sends it with every request after that.

Auth
- `POST /api/auth/register`: body `{ name, email, password, flatNumber?, role? }`. If `role` is
  `"ADMIN"`, you also need the header `x-admin-invite` set to your `ADMIN_INVITE_CODE`.
  Without it the account is created as a resident and no error is returned.
- `POST /api/auth/login`: body `{ email, password }`
- `POST /api/auth/logout`

Complaints
- `GET /api/complaints`: residents get only their own complaints, admins get all of them.
  Accepts `?status=&category=&from=&to=` for filtering. For admins, overdue complaints are
  sorted to the top.
- `POST /api/complaints`: residents only. Body `{ title, category, description, photoUrl? }`.
  Also creates the first history entry.
- `GET /api/complaints/:id`: full detail, including the history array (who changed what and
  when).
- `PATCH /api/complaints/:id/status`: admins only. Body `{ status, note? }`. Adds a history row,
  closes the complaint if the status is RESOLVED, and emails the resident.
- `PATCH /api/complaints/:id/priority`: admins only. Body `{ priority }`.

Notices
- `GET /api/notices`: important (pinned) notices first, then newest first.
- `POST /api/notices`: admins only. Body `{ title, body, important? }`. If the notice is marked
  important, every resident gets an email.

Dashboard
- `GET /api/dashboard`: admins only. Returns counts by status, category and priority, plus how
  many complaints are overdue right now.

About photos: I didn't set up S3 or Cloudinary for one photo per complaint. The browser converts
the image to a base64 string and it's stored directly in the `photoUrl` column. The client
rejects files over about 4MB and the server rejects payloads over about 6MB, so one upload
can't fill up the database. This wouldn't work at a large scale, but for a society of a few
hundred flats it saves running a separate storage service with its own credentials.

## Deploying

Push to GitHub, create a free Postgres database on Neon, import the repo into Vercel and add the
same env vars from `.env.example` in the Vercel project settings. Then run `npx prisma db push`
once against the production database before you use the app.

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
