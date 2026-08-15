const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { signToken } = require("../services/token.service");

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  joiningDate: user.joiningDate,
  profileImage: user.profileImage
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) throw new AppError("Invalid email or password", 401);
  sendSuccess(res, { token: signToken(user), user: publicUser(user) }, "Logged in successfully");
});

const logout = asyncHandler(async (_req, res) => {
  sendSuccess(res, null, "Logged out successfully");
});

const me = asyncHandler(async (req, res) => {
  sendSuccess(res, req.user, "Profile fetched");
});

module.exports = { login, logout, me };
