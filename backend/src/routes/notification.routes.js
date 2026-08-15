const router = require("express").Router();
const { protect } = require("../middleware/auth.middleware");
const { getNotifications, markNotificationRead, markAllNotificationsRead } = require("../controllers/task.controller");

router.use(protect);
router.get("/", getNotifications);
router.put("/read-all", markAllNotificationsRead);
router.put("/:id/read", markNotificationRead);

module.exports = router;
