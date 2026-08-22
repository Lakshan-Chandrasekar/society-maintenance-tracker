# System Design Write-up — Society Maintenance Tracker

## Complaint history model

Every complaint's lifecycle is modeled as an **append-only log**, not a single mutable status
field. The `Complaint` table holds the current snapshot (`status`, `priority`, `resolvedAt`)
for fast reads, while a separate `ComplaintHistory` table stores one row per change: the
resulting status, an optional note, the actor who made the change, and a timestamp. Raising a
complaint itself creates the first history row (`OPEN`, actor = the resident), so the audit
trail is never missing its starting point.

This split exists because the two tables answer different questions. "What's the state of this
complaint right now, and is it overdue?" is answered from the `Complaint` row alone — a single
indexed lookup, no joins, which matters for the admin list view rendering hundreds of rows.
"How did we get here, and who touched it?" is answered by reading `ComplaintHistory` ordered by
`createdAt`, which is only needed on the detail page. Keeping history append-only (rows are
never edited or deleted, enforced simply by never exposing an update/delete route for it) means
the timeline shown to residents and admins is always a faithful, tamper-evident record — useful
if there's ever a dispute about when something was actually fixed. The trade-off is minor
denormalization: `status` lives in both tables, but writing both in a single Prisma nested
`create` keeps them from drifting apart, and reads never need to reconstruct current state by
scanning history.

## Overdue detection

Overdue status is **derived, not stored**. On every read, a complaint is flagged overdue if its
`status` is not `RESOLVED` and `now - createdAt` exceeds a configurable threshold
(`OVERDUE_THRESHOLD_DAYS`, defaulting to 5). This was chosen over a stored boolean or a cron job
for a simple reason: "overdue" is a function of the current time, and a stored flag would need a
background process to keep flipping it as the clock advances, adding an infrastructure
dependency (a scheduler) for what is really a stateless calculation. Computing it at read time
means the flag is always correct the instant you load the page, with zero staleness and zero
moving parts to fail silently.

The cost is repeated computation on every list fetch, but this is negligible — it's a single
subtraction per row, done in application code after a normal indexed query on `status`. The
admin complaint list additionally **sorts overdue items first** (computed client-visible via the
API response before pagination-level concerns arise), so the people who need to act on aging
complaints see them without hunting through filters. If the society later wants a per-category
threshold (e.g., electrical issues overdue after 2 days, cosmetic ones after 10), the `Settings`
table is already scaffolded to hold that without changing the detection logic's shape.

## Photo handling

Complaint photos are accepted as image files client-side, converted to base64 data URLs in the
browser via `FileReader`, and stored directly on the `Complaint.photoUrl` column as text. This
is an intentional simplification: it avoids standing up a separate object-storage service
(S3, Cloudinary, etc.) and its associated credentials, buckets, and signed-URL logic, which
would be disproportionate infrastructure for a feature that's "attach one photo per complaint."
Size limits are enforced both client-side (reject over ~4MB before encoding) and server-side
(reject payloads over ~6MB) so a single upload can't bloat a database row or slow down the list
API, which deliberately does not select `photoUrl` for list views — only the detail endpoint
returns it. The clear trade-off is that this doesn't scale to many large images per complaint;
a production version handling higher volume would move to presigned uploads to blob storage
and store only a URL, but for one photo per complaint at society scale, inlining it removes a
whole category of moving infrastructure.

## Notification flow

Two events trigger email: a complaint's status changing, and a notice being posted as
"important." Both go through a single `sendMail` helper wrapping Nodemailer over SMTP, chosen
over a third-party email API so the project runs on any free SMTP credential (including a
Gmail App Password) without a paid account. Sending is **best-effort and non-blocking** — the
HTTP response to the admin's status-change or notice-post action returns immediately, and the
email call is fired with `.catch(() => {})` so a slow or failing mail server never turns into a
failed status update. For important notices, which can fan out to every resident, emails are
sent with `Promise.allSettled` so one bad address doesn't stop the rest from going out. This
favors availability of the core workflow (the status change *did* happen, is recorded in
history, and is visible in-app) over guaranteed delivery of the notification about it — the
right trade-off for a maintenance desk where the system-of-record status is more important than
the email being real-time.
