const router = require("express").Router();
const { body } = require("express-validator");
const { protect, authorize } = require("../middleware/auth.middleware");
const validate = require("../middleware/validation.middleware");
const { upload } = require("../services/storage.service");
const { taskCreateValidator, taskUpdateValidator } = require("../validators/task.validators");
const {
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
  uploadAttachment,
  getAttachment,
  dashboardStats
} = require("../controllers/task.controller");

router.use(protect);
router.get("/stats/dashboard", dashboardStats);
router.get("/", getTasks);
router.get("/:id", getTaskById);
router.post("/", authorize("admin"), taskCreateValidator, validate, createTask);
router.put("/:id", taskUpdateValidator, validate, updateTask);
router.delete("/:id", authorize("admin"), deleteTask);
router.post("/:id/subtasks", authorize("admin"), body("title").trim().notEmpty().withMessage("Title is required"), validate, addSubtask);
router.put("/:id/subtasks/:subtaskId", taskUpdateValidator, validate, updateSubtask);
router.delete("/:id/subtasks/:subtaskId", authorize("admin"), deleteSubtask);
router.get("/:id/comments", getComments);
router.post("/:id/comments", body("content").trim().notEmpty().withMessage("Comment is required"), validate, addComment);
router.post("/:id/attachments", upload.single("file"), uploadAttachment);
router.get("/:id/attachments/:attachmentId", getAttachment);

module.exports = router;
