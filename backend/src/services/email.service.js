const nodemailer = require("nodemailer");

const sendTaskAssignedEmail = async ({ to, name, taskTitle, dueDate }) => {
  if (process.env.EMAIL_ENABLED !== "true") return;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `New internship task assigned: ${taskTitle}`,
    html: `<p>Hello ${name},</p><p>You have been assigned <strong>${taskTitle}</strong>.</p><p>Due date: ${new Date(dueDate).toDateString()}</p>`
  });
};

module.exports = { sendTaskAssignedEmail };
