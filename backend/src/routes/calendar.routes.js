const router = require("express").Router();
const { protect } = require("../middleware/auth.middleware");
const { calendarTasks } = require("../controllers/task.controller");

router.use(protect);
router.get("/tasks", calendarTasks);

module.exports = router;
