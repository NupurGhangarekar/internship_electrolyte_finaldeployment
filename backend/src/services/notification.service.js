const Notification = require("../models/Notification");

const notifyUsers = async (recipients, payload) => {
  const uniqueRecipients = [...new Set((recipients || []).filter(Boolean).map(String))];
  if (!uniqueRecipients.length) return [];
  return Notification.insertMany(
    uniqueRecipients.map((recipient) => ({
      recipient,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      relatedTask: payload.relatedTask,
      relatedProject: payload.relatedProject
    }))
  );
};

module.exports = { notifyUsers };
