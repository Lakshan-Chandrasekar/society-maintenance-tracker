import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

/**
 * Sends an email if SMTP is configured. If it isn't (e.g. local dev without
 * credentials), this quietly logs to the console instead of throwing, so a
 * missing mail setup never breaks the complaint/notice flow.
 */
export async function sendMail(to: string, subject: string, html: string) {
  const t = getTransporter();
  const from = process.env.SMTP_FROM || "Society Desk <no-reply@society.local>";

  if (!t) {
    console.log(`[mailer] SMTP not configured. Would have sent to ${to}: ${subject}`);
    return { skipped: true };
  }

  try {
    await t.sendMail({ from, to, subject, html });
    return { sent: true };
  } catch (err) {
    console.error("[mailer] failed to send email:", err);
    return { error: true };
  }
}

export function statusChangeEmail(residentName: string, complaintTitle: string, status: string, note?: string | null) {
  const friendly: Record<string, string> = {
    OPEN: "Open",
    IN_PROGRESS: "In Progress",
    RESOLVED: "Resolved",
  };
  return `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: auto; color: #1f2740;">
      <h2 style="color:#a95121;">Complaint update</h2>
      <p>Hi ${residentName},</p>
      <p>Your complaint <strong>${complaintTitle}</strong> has been updated to
      <strong>${friendly[status] || status}</strong>.</p>
      ${note ? `<p style="background:#f4f6f8;padding:10px 14px;border-left:3px solid #c96a2c;">${note}</p>` : ""}
      <p style="color:#566380;font-size:13px;">— Society Maintenance Desk</p>
    </div>
  `;
}

export function importantNoticeEmail(residentName: string, title: string, body: string) {
  return `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: auto; color: #1f2740;">
      <h2 style="color:#a95121;">📌 Important notice</h2>
      <p>Hi ${residentName},</p>
      <h3>${title}</h3>
      <p>${body}</p>
      <p style="color:#566380;font-size:13px;">— Society Maintenance Desk</p>
    </div>
  `;
}
