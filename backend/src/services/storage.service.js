const fs = require("fs");
const path = require("path");
const multer = require("multer");
const AppError = require("../utils/AppError");

const uploadRoot = path.join(process.cwd(), process.env.UPLOAD_DIR || "uploads");
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const safeBase = path.parse(file.originalname).name.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    cb(null, `${Date.now()}-${safeBase}${path.extname(file.originalname).toLowerCase()}`);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["application/pdf", "image/png", "image/jpeg"];
  if (!allowed.includes(file.mimetype)) return cb(new AppError("Only PDF, PNG, and JPG files are allowed", 400));
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const removeLocalFile = async (filePath) => {
  if (!filePath) return;
  const absolute = path.join(process.cwd(), filePath);
  await fs.promises.rm(absolute, { force: true });
};

module.exports = { upload, removeLocalFile };
