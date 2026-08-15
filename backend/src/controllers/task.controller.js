const path = require("path");
const Task = require("../models/Task");
const User = require("../models/User");
const Project = require("../models/Project");
const Comment = require("../models/Comment");
const Activity = require("../models/Activity");
const Notification = require("../models/Notification");
const TaskAttachment = require("../models/TaskAttachment");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { sendTaskAssignedEmail } = require("../services/email.service");
const { removeLocalFile } = require("../services/storage.service");
const { recordActivity } = require("../services/activity.service");
const { notifyUsers } = require("../services/notification.service");
const { normalizeIds, ensureTaskAccess, userIsAssignedToTask } = require("../utils/taskAccess");

const activeStatuses = ["Backlog", "To Do", "In Progress", "Review", "Blocked", "Pending", "Submitted"];
const internStatuses = ["Backlog", "To Do", "In Progress", "Review", "Blocked", "Pending", "Submitted"];
const statusProgress = { Backlog: 0, "To Do": 0, Pending: 0, "In Progress": 50, Review: 80, Submitted: 80, Blocked: 40, Completed: 100 };

const toArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

const buildTaskFilter = (req) => {
  const { search = "", status, priority, assignedTo, project, label, overdue, completed, dueFrom, dueTo } = req.query;
  const filter = req.user.role === "intern" ? { assignedTo: req.user._id } : {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignedTo && req.user.role === "admin") filter.assignedTo = assignedTo;
  if (project) filter.project = project;
  if (label) filter.labels = label;
  if (completed === "true") filter.status = "Completed";
  if (completed === "false") filter.status = { $ne: "Completed" };
  if (overdue === "true") filter.dueDate = { ...(filter.dueDate || {}), $lt: new Date() };
  if (dueFrom) filter.dueDate = { ...(filter.dueDate || {}), $gte: new Date(dueFrom) };
  if (dueTo) filter.dueDate = { ...(filter.dueDate || {}), $lte: new Date(dueTo) };
  if (search) filter.$text = { $search: search };
  return filter;
};

const populateTask = (query) =>
  query.populate("assignedTo", "name email department").populate("assignedBy", "name email").populate("project", "name projectCode status priority");

const getTasks = asyncHandler(async (req, res) => {
  const { sort = "-createdAt", page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const filter = buildTaskFilter(req);
  const [tasks, total] = await Promise.all([
    populateTask(Task.find(filter)).sort(sort).skip(skip).limit(Number(limit)),
    Task.countDocuments(filter)
  ]);
  sendSuccess(res, tasks, "Tasks fetched", 200, { total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

const getTaskById = asyncHandler(async (req, res) => {
  const task = await populateTask(Task.findById(req.params.id));
  ensureTaskAccess(task, req.user);
  const [subtasks, comments, attachments, activity] = await Promise.all([
    populateTask(Task.find({ parentTask: task._id }).sort({ createdAt: 1 })),
    Comment.find({ task: task._id }).populate("author", "name role").sort({ createdAt: 1 }),
    TaskAttachment.find({ task: task._id }).populate("uploadedBy", "name role").sort({ uploadedAt: -1 }),
    Activity.find({ task: task._id }).populate("actor", "name role").sort({ createdAt: -1 }).limit(30)
  ]);
  sendSuccess(res, { task, subtasks, comments, attachments, activity }, "Task fetched");
});

const createTask = asyncHandler(async (req, res) => {
  const assignedTo = toArray(req.body.assignedTo);
  if (!assignedTo.length) throw new AppError("At least one intern must be assigned", 400);
  const internCount = await User.countDocuments({ _id: { $in: assignedTo }, role: "intern" });
  if (internCount !== assignedTo.length) throw new AppError("Assigned users must be interns", 400);
  if (req.body.project) {
    const project = await Project.findById(req.body.project);
    if (!project) throw new AppError("Project not found", 404);
  }

  const task = await Task.create({
    ...req.body,
    assignedTo,
    assignedBy: req.user._id,
    progress: req.body.progress ?? statusProgress[req.body.status] ?? 0,
    completedAt: req.body.status === "Completed" ? new Date() : undefined
  });
  await task.populate([
    { path: "assignedTo", select: "name email department" },
    { path: "assignedBy", select: "name email" },
    { path: "project", select: "name projectCode status priority" }
  ]);
  await recordActivity({ actor: req.user._id, action: "task_created", message: `${req.user.name} created task ${task.title}.`, task: task._id, project: task.project?._id });
  await notifyUsers(assignedTo, { type: "task_assigned", title: "New task assigned", message: `You were assigned ${task.title}.`, relatedTask: task._id, relatedProject: task.project?._id });
  task.assignedTo.forEach((intern) => sendTaskAssignedEmail({ to: intern.email, name: intern.name, taskTitle: task.title, dueDate: task.dueDate }).catch(console.error));
  sendSuccess(res, task, "Task created", 201);
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  ensureTaskAccess(task, req.user);
  const previous = task.toObject();

  if (req.user.role === "intern") {
    if (req.body.status && !internStatuses.includes(req.body.status)) throw new AppError("Interns cannot use that task status", 403);
    ["status", "remarks", "progress", "actualHours"].forEach((field) => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });
    if (task.progress > 100 || task.progress < 0) throw new AppError("Progress must be between 0 and 100", 400);
  } else {
    const payload = { ...req.body };
    if (payload.assignedTo !== undefined) payload.assignedTo = toArray(payload.assignedTo);
    Object.assign(task, payload);
  }

  if (req.body.status && req.body.progress === undefined) task.progress = statusProgress[req.body.status] ?? task.progress;
  if (task.status === "Completed" && !task.completedAt) task.completedAt = new Date();
  if (previous.status === "Completed" && task.status !== "Completed") task.completedAt = undefined;

  await task.save();
  await task.populate([
    { path: "assignedTo", select: "name email department" },
    { path: "assignedBy", select: "name email" },
    { path: "project", select: "name projectCode status priority" }
  ]);

  if (previous.status !== task.status) {
    await recordActivity({ actor: req.user._id, action: "status_changed", message: `${req.user.name} changed task status from ${previous.status} to ${task.status}.`, task: task._id, project: task.project?._id });
  }
  if (previous.priority !== task.priority) {
    await recordActivity({ actor: req.user._id, action: "priority_changed", message: `${req.user.name} changed priority from ${previous.priority} to ${task.priority}.`, task: task._id, project: task.project?._id });
  }
  if (previous.dueDate?.toISOString() !== task.dueDate?.toISOString()) {
    await recordActivity({ actor: req.user._id, action: "due_date_changed", message: `${req.user.name} changed the due date for ${task.title}.`, task: task._id, project: task.project?._id });
  }

  const assignedIds = normalizeIds(task.assignedTo);
  if (req.user.role === "admin") {
    const previousAssigned = normalizeIds(previous.assignedTo);
    const newlyAssigned = assignedIds.filter((id) => !previousAssigned.includes(id));
    if (newlyAssigned.length) await notifyUsers(newlyAssigned, { type: "task_reassigned", title: "Task assignment updated", message: `You were assigned ${task.title}.`, relatedTask: task._id, relatedProject: task.project?._id });
  } else {
    const admins = await User.find({ role: "admin" }).select("_id");
    await notifyUsers(admins.map((admin) => admin._id), { type: "task_status_changed", title: "Intern updated a task", message: `${req.user.name} updated ${task.title} to ${task.status}.`, relatedTask: task._id, relatedProject: task.project?._id });
  }

  sendSuccess(res, task, "Task updated");
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new AppError("Task not found", 404);
  const attachments = await TaskAttachment.find({ task: task._id });
  await Promise.all(attachments.map((attachment) => removeLocalFile(attachment.path)));
  await Promise.all([
    Task.deleteMany({ parentTask: task._id }),
    Comment.deleteMany({ task: task._id }),
    TaskAttachment.deleteMany({ task: task._id }),
    task.deleteOne()
  ]);
  await recordActivity({ actor: req.user._id, action: "task_deleted", message: `${req.user.name} deleted task ${task.title}.`, project: task.project });
  sendSuccess(res, null, "Task deleted");
});

const addSubtask = asyncHandler(async (req, res) => {
  const parent = await Task.findById(req.params.id);
  if (!parent) throw new AppError("Parent task not found", 404);
  const task = await Task.create({
    title: req.body.title,
    description: req.body.description || req.body.title,
    project: parent.project,
    assignedTo: req.body.assignedTo ? toArray(req.body.assignedTo) : parent.assignedTo,
    assignedBy: req.user._id,
    priority: req.body.priority || parent.priority,
    status: req.body.status || "To Do",
    startDate: req.body.startDate,
    dueDate: req.body.dueDate || parent.dueDate,
    estimatedHours: req.body.estimatedHours || 0,
    labels: req.body.labels || parent.labels,
    parentTask: parent._id
  });
  await recordActivity({ actor: req.user._id, action: "subtask_created", message: `${req.user.name} added subtask ${task.title}.`, task: parent._id, project: parent.project });
  sendSuccess(res, task, "Subtask created", 201);
});

const updateSubtask = asyncHandler(async (req, res) => {
  const subtask = await Task.findOne({ _id: req.params.subtaskId, parentTask: req.params.id });
  ensureTaskAccess(subtask, req.user);
  if (req.user.role === "intern") {
    ["status", "remarks", "progress", "actualHours"].forEach((field) => {
      if (req.body[field] !== undefined) subtask[field] = req.body[field];
    });
  } else {
    Object.assign(subtask, req.body);
  }
  if (subtask.status === "Completed") subtask.completedAt = subtask.completedAt || new Date();
  await subtask.save();
  sendSuccess(res, subtask, "Subtask updated");
});

const deleteSubtask = asyncHandler(async (req, res) => {
  const subtask = await Task.findOne({ _id: req.params.subtaskId, parentTask: req.params.id });
  if (!subtask) throw new AppError("Subtask not found", 404);
  await subtask.deleteOne();
  sendSuccess(res, null, "Subtask deleted");
});

const getComments = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  ensureTaskAccess(task, req.user);
  const comments = await Comment.find({ task: task._id }).populate("author", "name role").sort({ createdAt: 1 });
  sendSuccess(res, comments, "Comments fetched");
});

const addComment = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  ensureTaskAccess(task, req.user);
  const comment = await Comment.create({ task: task._id, author: req.user._id, content: req.body.content });
  await comment.populate("author", "name role");
  await recordActivity({ actor: req.user._id, action: "comment_added", message: `${req.user.name} commented on ${task.title}.`, task: task._id, project: task.project });
  const recipients = req.user.role === "admin" ? normalizeIds(task.assignedTo) : (await User.find({ role: "admin" }).select("_id")).map((admin) => admin._id);
  await notifyUsers(recipients, { type: "comment_added", title: "New task comment", message: `${req.user.name} commented on ${task.title}.`, relatedTask: task._id, relatedProject: task.project });
  sendSuccess(res, comment, "Comment added", 201);
});

const updateComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new AppError("Comment not found", 404);
  if (!comment.author.equals(req.user._id) && req.user.role !== "admin") throw new AppError("Forbidden", 403);
  comment.content = req.body.content;
  await comment.save();
  sendSuccess(res, comment, "Comment updated");
});

const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new AppError("Comment not found", 404);
  if (!comment.author.equals(req.user._id) && req.user.role !== "admin") throw new AppError("Forbidden", 403);
  await comment.deleteOne();
  sendSuccess(res, null, "Comment deleted");
});

const uploadAttachment = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  ensureTaskAccess(task, req.user);
  if (!req.file) throw new AppError("Attachment file is required", 400);
  const relativePath = path.join(process.env.UPLOAD_DIR || "uploads", req.file.filename).replace(/\\/g, "/");
  const attachment = await TaskAttachment.create({
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: relativePath,
    mimeType: req.file.mimetype,
    size: req.file.size,
    uploadedBy: req.user._id,
    task: task._id
  });
  await attachment.populate("uploadedBy", "name role");
  await recordActivity({ actor: req.user._id, action: "attachment_uploaded", message: `${req.user.name} uploaded ${attachment.originalName}.`, task: task._id, project: task.project });
  sendSuccess(res, attachment, "Attachment uploaded", 201);
});

const getAttachment = asyncHandler(async (req, res) => {
  const attachment = await TaskAttachment.findOne({ _id: req.params.attachmentId, task: req.params.id });
  if (!attachment) throw new AppError("Attachment not found", 404);
  const task = await Task.findById(attachment.task);
  ensureTaskAccess(task, req.user);
  res.download(path.join(process.cwd(), attachment.path), attachment.originalName);
});

const dashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endToday = new Date(startToday.getTime() + 86400000);
  const endWeek = new Date(startToday.getTime() + 7 * 86400000);
  const baseTaskFilter = req.user.role === "intern" ? { assignedTo: req.user._id } : {};
  const baseProjectFilter = req.user.role === "intern" ? { assignedInterns: req.user._id } : {};

  const assignedTaskIds = req.user.role === "intern" ? await Task.find({ assignedTo: req.user._id }).distinct("_id") : null;
  const activityFilter = req.user.role === "intern" ? { task: { $in: assignedTaskIds } } : {};
  const [totalInterns, totalProjects, totalTasks, completedTasks, pendingTasks, inProgressTasks, overdueTasks, tasksDueToday, tasksDueThisWeek, recentActivity] = await Promise.all([
    req.user.role === "admin" ? User.countDocuments({ role: "intern" }) : Promise.resolve(undefined),
    Project.countDocuments(baseProjectFilter),
    Task.countDocuments(baseTaskFilter),
    Task.countDocuments({ ...baseTaskFilter, status: "Completed" }),
    Task.countDocuments({ ...baseTaskFilter, status: { $in: activeStatuses } }),
    Task.countDocuments({ ...baseTaskFilter, status: "In Progress" }),
    Task.countDocuments({ ...baseTaskFilter, status: { $ne: "Completed" }, dueDate: { $lt: now } }),
    Task.countDocuments({ ...baseTaskFilter, dueDate: { $gte: startToday, $lt: endToday } }),
    Task.countDocuments({ ...baseTaskFilter, dueDate: { $gte: startToday, $lte: endWeek } }),
    Activity.find(activityFilter).populate("actor", "name role").sort({ createdAt: -1 }).limit(8)
  ]);
  const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  sendSuccess(res, {
    totalInterns,
    activeInterns: totalInterns,
    totalProjects,
    totalTasks,
    assignedTasks: totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    overdueTasks,
    tasksDueToday,
    tasksDueThisWeek,
    progress,
    taskCompletionRate: progress,
    recentActivity
  }, "Dashboard stats fetched");
});

const calendarTasks = asyncHandler(async (req, res) => {
  const filter = buildTaskFilter(req);
  const tasks = await populateTask(Task.find(filter).select("title project assignedTo status priority startDate dueDate").sort({ dueDate: 1 }).limit(200));
  const projectFilter = req.user.role === "intern" ? { assignedInterns: req.user._id } : {};
  const projects = await Project.find(projectFilter).select("name projectCode status startDate dueDate").sort({ dueDate: 1 }).limit(100);
  sendSuccess(res, { tasks, projects }, "Calendar fetched");
});

const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(50);
  const unread = await Notification.countDocuments({ recipient: req.user._id, read: false });
  sendSuccess(res, notifications, "Notifications fetched", 200, { unread });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { read: true }, { new: true });
  if (!notification) throw new AppError("Notification not found", 404);
  sendSuccess(res, notification, "Notification marked read");
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  sendSuccess(res, null, "Notifications marked read");
});

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addSubtask,
  updateSubtask,
  deleteSubtask,
  getComments,
  addComment,
  updateComment,
  deleteComment,
  uploadAttachment,
  getAttachment,
  dashboardStats,
  calendarTasks,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  userIsAssignedToTask
};
