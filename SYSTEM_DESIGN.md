# System design notes

## Complaint history

The `Complaint` table holds the current state of each complaint (`status`, `priority`,
`resolvedAt`). A separate `ComplaintHistory` table gets one row per change, with the new status,
an optional note, the user who made the change and a timestamp. Raising a complaint creates the
first history row (`OPEN`, with the resident as the actor), so every timeline has a starting
point.

The two tables are read in different places. The complaint lists and the overdue check only
need the current status, so they read the `Complaint` table and never look at history. The
detail page reads `ComplaintHistory` ordered by `createdAt` to draw the timeline. There's no API
route that edits or deletes history rows, so the timeline residents and admins see is a record
of what actually happened, which helps if there's a dispute about when something was fixed.

This means `status` is stored in two places. When an admin changes the status, the route writes
the new status and the history row in one Prisma nested write, so the two stay in sync, and the
app never has to rebuild the current state by replaying history.

## Overdue detection

Overdue isn't stored anywhere. Each time complaints are read, one is flagged as overdue if its
status isn't `RESOLVED` and it was created more than `OVERDUE_THRESHOLD_DAYS` days ago (default
5). A stored flag would need a scheduled job to keep updating it as time passes. Working it out
on read means the flag is correct whenever the page loads and there's no cron job to maintain.

The cost is one date subtraction per complaint on each request, which is small. For admins, the
list endpoint sorts overdue complaints to the top after computing the flag, so they don't have
to filter for them. The `Settings` table exists so that a later admin screen can change the
threshold from the UI; for now the value comes from the environment variable.

## Photos

When a resident attaches a photo, the browser reads it with `FileReader`, turns it into a base64
data URL and sends it with the complaint. It's stored as text in `Complaint.photoUrl`. I went
this way to avoid setting up object storage (S3, Cloudinary and so on) with buckets, credentials
and signed URLs for a feature that is one photo per complaint.

The client rejects images over about 4MB before encoding them, and the server rejects photo
payloads over about 6MB. This won't hold up with many large images. A bigger deployment should
upload to blob storage with presigned URLs and keep only the URL in the database. For one photo
per complaint in a single society, it's enough.

## Notifications

Two events send email: a complaint's status changing, and an admin posting a notice marked as
important. Both use one `sendMail` helper built on Nodemailer over SMTP, so it works with any
SMTP provider.

Email is sent in the background. The status update and notice routes don't wait for the mail
call, and its errors are caught (`.catch(() => {})`), so a slow or broken mail server can't make
a status update fail. Important notices go to every resident, so those emails are sent with
`Promise.allSettled`; one bad address doesn't stop the others. The trade-off is that an email
can fail without anyone noticing. I accepted that because the status change itself is saved in
the database and shown in the app either way.
