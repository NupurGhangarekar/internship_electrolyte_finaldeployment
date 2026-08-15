const AppError = require("./AppError");

const normalizeIds = (value) => (Array.isArray(value) ? value : value ? [value] : []).map((id) => id.toString());

const userIsAssignedToTask = (task, userId) => normalizeIds(task.assignedTo).includes(userId.toString());

const ensureTaskAccess = (task, user) => {
  if (!task) throw new AppError("Task not found", 404);
  if (user.role === "admin") return;
  if (!userIsAssignedToTask(task, user._id)) throw new AppError("Task not found", 404);
};

module.exports = { normalizeIds, userIsAssignedToTask, ensureTaskAccess };
