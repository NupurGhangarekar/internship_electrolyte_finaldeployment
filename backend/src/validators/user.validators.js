const { body } = require("express-validator");

const userCreateValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").optional().isIn(["admin", "intern"]).withMessage("Invalid role"),
  body("joiningDate").optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage("Invalid joining date")
];

const userUpdateValidator = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("email").optional().isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").optional().isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").optional().isIn(["admin", "intern"]).withMessage("Invalid role"),
  body("joiningDate").optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage("Invalid joining date")
];

module.exports = { userCreateValidator, userUpdateValidator };
