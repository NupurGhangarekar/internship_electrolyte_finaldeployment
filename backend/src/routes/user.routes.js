const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth.middleware");
const validate = require("../middleware/validation.middleware");
const { userCreateValidator, userUpdateValidator } = require("../validators/user.validators");
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateMyProfile
} = require("../controllers/user.controller");

router.use(protect);
router.put("/me", updateMyProfile);
router.use(authorize("admin"));
router.get("/", getUsers);
router.post("/", userCreateValidator, validate, createUser);
router.get("/:id", getUserById);
router.put("/:id", userUpdateValidator, validate, updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
