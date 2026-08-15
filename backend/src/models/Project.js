const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    projectCode: { type: String, required: true, trim: true, uppercase: true, unique: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedInterns: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: ["Planned", "Active", "On Hold", "Completed", "Archived"], default: "Planned" },
    priority: { type: String, enum: ["Low", "Medium", "High", "Urgent"], default: "Medium" },
    startDate: { type: Date },
    dueDate: { type: Date },
    progress: { type: Number, min: 0, max: 100, default: 0 }
  },
  { timestamps: true }
);

projectSchema.index({ name: "text", description: "text", projectCode: "text" });
projectSchema.index({ assignedInterns: 1, status: 1 });

module.exports = mongoose.model("Project", projectSchema);
