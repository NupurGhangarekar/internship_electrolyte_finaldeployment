const router = require("express").Router();
const { body } = require("express-validator");
const { protect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validation.middleware");
const { updateComment, deleteComment } = require("../controllers/task.controller");

router.use(protect);
router.put("/:id", body("content").trim().notEmpty().withMessage("Comment is required"), validate, updateComment);
router.delete("/:id", deleteComment);

module.exports = router;
