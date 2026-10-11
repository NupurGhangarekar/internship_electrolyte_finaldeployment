const mongoose = require("mongoose");

const calendarEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    type: { type: String, enum: ["Meeting", "Deadline", "Review", "General"], default: "General" },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date },
    meetingUrl: { type: String, trim: true, default: "" },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

calendarEventSchema.index({ startsAt: 1, attendees: 1 });

module.exports = mongoose.model("CalendarEvent", calendarEventSchema);
