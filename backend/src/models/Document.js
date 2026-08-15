const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  intern: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["Certificate", "Letter of Recommendation", "Completion Certificate", "Other"],
    required: true
  },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  path: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  uploadDate: { type: Date, default: Date.now }
});

documentSchema.index({ intern: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("Document", documentSchema);
