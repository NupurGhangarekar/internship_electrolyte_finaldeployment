const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");
const Activity = require("../models/Activity");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { recordActivity } = require("../services/activity.service");
const { notifyUsers } = require("../services/notification.service");

const buildProjectFilter = (req) => {
  const { search = "", status, priority } = req.query;
  const filter = req.user.role === "intern" ? { assignedInterns: req.user._id, status: { $ne: "Archived" } } : {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (search) filter.$text = { $search: search };
  return filter;
};

const getProjects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = "-createdAt" } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const filter = buildProjectFilter(req);
  const [projects, total] = await Promise.all([
    Project.find(filter).populate("owner", "name email").populate("assignedInterns", "name email department").sort(sort).skip(skip).limit(Number(limit)),
    Project.countDocuments(filter)
  ]);
  sendSuccess(res, projects, "Projects fetched", 200, { total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).populate("owner", "name email").populate("assignedInterns", "name email department");
  if (!project) throw new AppError("Project not found", 404);
  if (req.user.role === "intern" && !project.assignedInterns.some((intern) => intern._id.equals(req.user._id))) throw new AppError("Project not found", 404);
  const taskFilter = req.user.role === "intern" ? { project: project._id, assignedTo: req.user._id } : { project: project._id };
  const [tasks, activity] = await Promise.all([
    Task.find(taskFilter).populate("assignedTo", "name email department").sort({ dueDate: 1 }),
    Activity.find({ project: project._id }).populate("actor", "name role").sort({ createdAt: -1 }).limit(20)
  ]);
  sendSuccess(res, { project, tasks, activity }, "Project fetched");
});

const createProject = asyncHandler(async (req, res) => {
  const assignedInterns = req.body.assignedInterns || [];
  if (assignedInterns.length) {
    const count = await User.countDocuments({ _id: { $in: assignedInterns }, role: "intern" });
    if (count !== assignedInterns.length) throw new AppError("Assigned users must be interns", 400);
  }
  const project = await Project.create({ ...req.body, owner: req.user._id });
  await recordActivity({ actor: req.user._id, action: "project_created", message: `${req.user.name} created project ${project.name}.`, project: project._id });
  await notifyUsers(assignedInterns, { type: "project_assigned", title: "New project assigned", message: `You were added to ${project.name}.`, relatedProject: project._id });
  sendSuccess(res, project, "Project created", 201);
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError("Project not found", 404);
  const beforeInterns = project.assignedInterns.map(String);
  Object.assign(project, req.body);
  await project.save();
  const afterInterns = project.assignedInterns.map(String);
  const added = afterInterns.filter((id) => !beforeInterns.includes(id));
  if (added.length) await notifyUsers(added, { type: "project_assigned", title: "Project assignment updated", message: `You were added to ${project.name}.`, relatedProject: project._id });
  await recordActivity({ actor: req.user._id, action: "project_updated", message: `${req.user.name} updated project ${project.name}.`, project: project._id });
  sendSuccess(res, project, "Project updated");
});

const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError("Project not found", 404);
  project.status = "Archived";
  await project.save();
  await recordActivity({ actor: req.user._id, action: "project_archived", message: `${req.user.name} archived project ${project.name}.`, project: project._id });
  sendSuccess(res, project, "Project archived");
});

module.exports = { getProjects, getProjectById, createProject, updateProject, deleteProject };
