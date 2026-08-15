const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  relatedTask: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  relatedProject: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  read: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now }
});

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
