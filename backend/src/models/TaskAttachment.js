const mongoose = require("mongoose");

const taskAttachmentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  path: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true, index: true },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("TaskAttachment", taskAttachmentSchema);
