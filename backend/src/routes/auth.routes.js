const router = require("express").Router();
const { login, logout, me } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validation.middleware");
const { loginValidator } = require("../validators/auth.validators");

router.post("/login", loginValidator, validate, login);
router.post("/logout", protect, logout);
router.get("/me", protect, me);

module.exports = router;
