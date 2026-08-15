const router = require("express").Router();
const { body } = require("express-validator");
const { protect, authorize } = require("../middleware/auth.middleware");
const validate = require("../middleware/validation.middleware");
const { getProjects, getProjectById, createProject, updateProject, deleteProject } = require("../controllers/project.controller");

const projectValidator = [
  body("name").optional().trim().notEmpty().withMessage("Project name is required"),
  body("projectCode").optional().trim().notEmpty().withMessage("Project code is required"),
  body("assignedInterns").optional().isArray().withMessage("Assigned interns must be an array"),
  body("status").optional().isIn(["Planned", "Active", "On Hold", "Completed", "Archived"]).withMessage("Invalid project status"),
  body("priority").optional().isIn(["Low", "Medium", "High", "Urgent"]).withMessage("Invalid priority"),
  body("progress").optional().isInt({ min: 0, max: 100 }).withMessage("Progress must be 0-100")
];

router.use(protect);
router.get("/", getProjects);
router.get("/:id", getProjectById);
router.post("/", authorize("admin"), body("name").trim().notEmpty(), body("projectCode").trim().notEmpty(), projectValidator, validate, createProject);
router.put("/:id", authorize("admin"), projectValidator, validate, updateProject);
router.delete("/:id", authorize("admin"), deleteProject);

module.exports = router;
