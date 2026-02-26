const nodemailer = require("nodemailer");

// testmail.app SMTP configuration
// API Key: 394b332c-63aa-4e8d-9f82-f0259b5226db
// Set TESTMAIL_NAMESPACE in your .env file (e.g., "mynamespace")
const transporter = nodemailer.createTransport({
  host: "smtp.testmail.app",
  port: 587,
  secure: false,
  auth: {
    user: process.env.TESTMAIL_NAMESPACE,
    pass: process.env.TESTMAIL_API_KEY || "394b332c-63aa-4e8d-9f82-f0259b5226db"
  }
});

/**
 * Send an email using testmail.app
 * @param {object} options - { to, subject, html, text }
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const namespace = process.env.TESTMAIL_NAMESPACE || "collab";
    const from = `StudentCollabHub <${namespace}.noreply@testmail.app>`;

    await transporter.sendMail({ from, to, subject, html, text });
    console.log(`📧 Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error("Email send error:", err.message);
  }
};

// ─── Pre-built email templates ───────────────────────────────────────────────

const sendTaskAssignedEmail = async ({ toEmail, toName, taskTitle, projectTitle, dueDate }) => {
  const dueLine = dueDate ? `<p><strong>Due:</strong> ${dueDate}</p>` : "";
  await sendEmail({
    to: toEmail,
    subject: `[${projectTitle}] You have been assigned a task`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
        <h2 style="color:#22d3ee;">New Task Assigned</h2>
        <p>Hi <strong>${toName}</strong>,</p>
        <p>You've been assigned a task in <strong>${projectTitle}</strong>:</p>
        <div style="background:#f1f5f9;padding:12px 16px;border-radius:8px;margin:12px 0;">
          <strong>${taskTitle}</strong>
          ${dueLine}
        </div>
        <p>Log in to StudentCollabHub to view and manage this task.</p>
      </div>
    `,
    text: `Hi ${toName}, you've been assigned task "${taskTitle}" in project "${projectTitle}". ${dueDate ? `Due: ${dueDate}` : ""}`
  });
};

const sendMemberInvitedEmail = async ({ toEmail, toName, projectTitle, inviterName }) => {
  await sendEmail({
    to: toEmail,
    subject: `[${projectTitle}] You've been added as a collaborator`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
        <h2 style="color:#22d3ee;">You're now a project member</h2>
        <p>Hi <strong>${toName}</strong>,</p>
        <p><strong>${inviterName}</strong> added you to <strong>${projectTitle}</strong> on StudentCollabHub.</p>
        <p>Log in to start collaborating.</p>
      </div>
    `,
    text: `Hi ${toName}, ${inviterName} added you to project "${projectTitle}". Log in to StudentCollabHub to start collaborating.`
  });
};

const sendMentionEmail = async ({ toEmail, toName, mentionedBy, projectTitle, messagePreview }) => {
  await sendEmail({
    to: toEmail,
    subject: `[${projectTitle}] ${mentionedBy} mentioned you`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
        <h2 style="color:#22d3ee;">You were mentioned</h2>
        <p>Hi <strong>${toName}</strong>,</p>
        <p><strong>${mentionedBy}</strong> mentioned you in <strong>${projectTitle}</strong>:</p>
        <blockquote style="border-left:3px solid #22d3ee;padding:8px 12px;margin:12px 0;background:#f8fafc;color:#334155;">
          ${messagePreview}
        </blockquote>
        <p>Log in to reply.</p>
      </div>
    `,
    text: `Hi ${toName}, ${mentionedBy} mentioned you in "${projectTitle}": ${messagePreview}`
  });
};

const sendMilestoneCompletedEmail = async ({ toEmail, toName, milestoneTitle, projectTitle }) => {
  await sendEmail({
    to: toEmail,
    subject: `[${projectTitle}] Milestone completed: ${milestoneTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
        <h2 style="color:#10b981;">Milestone Completed 🎉</h2>
        <p>Hi <strong>${toName}</strong>,</p>
        <p>The milestone <strong>${milestoneTitle}</strong> in <strong>${projectTitle}</strong> has been marked as completed.</p>
      </div>
    `,
    text: `Hi ${toName}, milestone "${milestoneTitle}" in project "${projectTitle}" has been completed!`
  });
};

module.exports = {
  sendEmail,
  sendTaskAssignedEmail,
  sendMemberInvitedEmail,
  sendMentionEmail,
  sendMilestoneCompletedEmail
};
