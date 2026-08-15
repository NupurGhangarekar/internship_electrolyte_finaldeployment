const AppError = require("../utils/AppError");

const notFound = (req, _res, next) => next(new AppError(`Route not found: ${req.originalUrl}`, 404));

const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Something went wrong";
  if (process.env.NODE_ENV !== "test") console.error(err);
  res.status(statusCode).json({ success: false, message, errors: err.errors || undefined });
};

module.exports = { notFound, errorHandler };
