const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    priority: { type: String, enum: ["Low", "Medium", "High", "Urgent"], default: "Medium" },
    startDate: { type: Date },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Backlog", "To Do", "In Progress", "Review", "Completed", "Blocked", "Pending", "Submitted"],
      default: "To Do"
    },
    estimatedHours: { type: Number, min: 0, default: 0 },
    actualHours: { type: Number, min: 0, default: 0 },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    labels: [{ type: String, trim: true }],
    parentTask: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    completedAt: { type: Date },
    remarks: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

taskSchema.index({ title: "text", description: "text", labels: "text" });
taskSchema.index({ assignedTo: 1, status: 1, dueDate: 1 });
taskSchema.index({ project: 1, status: 1 });

module.exports = mongoose.model("Task", taskSchema);
