const { body } = require("express-validator");

const taskCreateValidator = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("assignedTo").custom((value) => {
    const ids = Array.isArray(value) ? value : [value];
    return ids.every((id) => /^[a-f\d]{24}$/i.test(id));
  }).withMessage("At least one valid intern is required"),
  body("project").optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage("Invalid project"),
  body("priority").optional().isIn(["Low", "Medium", "High", "Urgent"]).withMessage("Invalid priority"),
  body("status").optional().isIn(["Backlog", "To Do", "In Progress", "Review", "Completed", "Blocked", "Pending", "Submitted"]).withMessage("Invalid status"),
  body("progress").optional().isInt({ min: 0, max: 100 }).withMessage("Progress must be 0-100"),
  body("dueDate").isISO8601().withMessage("Valid due date is required")
];

const taskUpdateValidator = [
  body("title").optional().trim().notEmpty().withMessage("Title cannot be empty"),
  body("description").optional().trim().notEmpty().withMessage("Description cannot be empty"),
  body("assignedTo").optional().custom((value) => {
    const ids = Array.isArray(value) ? value : [value];
    return ids.every((id) => /^[a-f\d]{24}$/i.test(id));
  }).withMessage("Invalid intern"),
  body("project").optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage("Invalid project"),
  body("priority").optional().isIn(["Low", "Medium", "High", "Urgent"]).withMessage("Invalid priority"),
  body("dueDate").optional().isISO8601().withMessage("Invalid due date"),
  body("status").optional().isIn(["Backlog", "To Do", "In Progress", "Review", "Completed", "Blocked", "Pending", "Submitted"]).withMessage("Invalid status"),
  body("progress").optional().isInt({ min: 0, max: 100 }).withMessage("Progress must be 0-100")
];

module.exports = { taskCreateValidator, taskUpdateValidator };
