const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth.middleware");
const { calendarTasks } = require("../controllers/task.controller");
const { listEvents, createEvent, updateEvent, deleteEvent } = require("../controllers/calendar.controller");

router.use(protect);
router.get("/tasks", calendarTasks);
router.get("/events", listEvents);
router.post("/events", authorize("admin"), createEvent);
router.put("/events/:id", authorize("admin"), updateEvent);
router.delete("/events/:id", authorize("admin"), deleteEvent);

module.exports = router;
