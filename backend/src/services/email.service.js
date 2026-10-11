const nodemailer = require("nodemailer");

const transporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

const sendTaskAssignedEmail = async ({ to, name, taskTitle, dueDate }) => {
  if (process.env.EMAIL_ENABLED !== "true") return;

  await transporter().sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `New internship task assigned: ${taskTitle}`,
    html: `<p>Hello ${name},</p><p>You have been assigned <strong>${taskTitle}</strong>.</p><p>Due date: ${new Date(dueDate).toDateString()}</p>`
  });
};

const sendOnboardingEmail = async ({ intern, temporaryPassword, letterPath, letterName, portalUrl }) => {
  if (process.env.EMAIL_ENABLED !== "true") return { status: "skipped" };
  await transporter().sendMail({
    from: process.env.SMTP_FROM,
    to: intern.email,
    subject: "Welcome to Electrolyte Solutions - Internship onboarding",
    html: `<p>Hello ${intern.name},</p><p>Congratulations - your internship offer letter is attached.</p><p>Your portal account has been created.</p><p><strong>Login email:</strong> ${intern.email}<br/><strong>Temporary password:</strong> ${temporaryPassword}</p><p>Sign in at <a href="${portalUrl}">${portalUrl}</a> and change this password immediately.</p>`,
    attachments: [{ filename: letterName, path: letterPath, contentType: "application/pdf" }]
  });
  return { status: "sent" };
};

const sendLetterEmail = async ({ intern, letterPath, letterName, type }) => {
  if (process.env.EMAIL_ENABLED !== "true") return { status: "skipped" };
  await transporter().sendMail({
    from: process.env.SMTP_FROM,
    to: intern.email,
    subject: `${type} - Electrolyte Solutions`,
    html: `<p>Hello ${intern.name},</p><p>Please find your ${type.toLowerCase()} attached.</p>`,
    attachments: [{ filename: letterName, path: letterPath, contentType: "application/pdf" }]
  });
  return { status: "sent" };
};

module.exports = { sendTaskAssignedEmail, sendOnboardingEmail, sendLetterEmail };
