const CalendarEvent = require("../models/CalendarEvent");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { notifyUsers } = require("../services/notification.service");

const populate = (query) => query.populate("project", "name projectCode").populate("attendees", "name email department").populate("createdBy", "name email");

const validateAttendees = async (attendees) => {
  const attendeeIds = [...new Set(attendees || [])];
  if (!attendeeIds.length) return attendeeIds;
  const count = await User.countDocuments({ _id: { $in: attendeeIds }, role: "intern" });
  if (count !== attendeeIds.length) throw new AppError("Calendar attendees must be interns", 400);
  return attendeeIds;
};

const listEvents = asyncHandler(async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { attendees: req.user._id };
  const events = await populate(CalendarEvent.find(filter).sort({ startsAt: 1 }).limit(300));
  sendSuccess(res, events, "Calendar events fetched");
});

const createEvent = asyncHandler(async (req, res) => {
  const attendeeIds = await validateAttendees(req.body.attendees);
  if (req.body.endsAt && new Date(req.body.endsAt) < new Date(req.body.startsAt)) throw new AppError("End time must be after start time", 400);
  const event = await CalendarEvent.create({ ...req.body, attendees: attendeeIds, createdBy: req.user._id });
  await event.populate("project", "name projectCode");
  if (attendeeIds.length) await notifyUsers(attendeeIds, { type: "calendar_event", title: event.type, message: `${event.title} is scheduled for ${event.startsAt.toLocaleString()}.`, relatedProject: event.project?._id });
  sendSuccess(res, event, "Calendar event created", 201);
});

const updateEvent = asyncHandler(async (req, res) => {
  const event = await CalendarEvent.findById(req.params.id);
  if (!event) throw new AppError("Calendar event not found", 404);
  if (req.body.endsAt && new Date(req.body.endsAt) < new Date(req.body.startsAt || event.startsAt)) throw new AppError("End time must be after start time", 400);
  if (req.body.attendees) req.body.attendees = await validateAttendees(req.body.attendees);
  Object.assign(event, req.body);
  await event.save();
  sendSuccess(res, await populate(CalendarEvent.findById(event._id)), "Calendar event updated");
});

const deleteEvent = asyncHandler(async (req, res) => {
  const event = await CalendarEvent.findByIdAndDelete(req.params.id);
  if (!event) throw new AppError("Calendar event not found", 404);
  sendSuccess(res, null, "Calendar event deleted");
});

module.exports = { listEvents, createEvent, updateEvent, deleteEvent };
