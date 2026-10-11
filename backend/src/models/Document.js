const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  intern: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["Offer Letter", "Letter of Recommendation", "Letter of Experience", "Certificate", "Completion Certificate", "Other"],
    required: true
  },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  path: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  uploadDate: { type: Date, default: Date.now },
  emailStatus: { type: String, enum: ["not_sent", "sent", "skipped", "failed"], default: "not_sent" },
  emailedAt: { type: Date },
  emailError: { type: String }
});

documentSchema.index({ intern: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("Document", documentSchema);
