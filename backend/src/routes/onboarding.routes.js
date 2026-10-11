const router = require("express").Router();
const multer = require("multer");
const { protect, authorize } = require("../middleware/auth.middleware");
const { previewImport, onboardManual, onboardBulk, generateAndSendLetter, letterDefaults } = require("../controllers/onboarding.controller");

const spreadsheetUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  const allowed = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel", "text/csv"];
  cb(allowed.includes(file.mimetype) ? null : new Error("Only .xlsx, .xls, and .csv files are allowed"), allowed.includes(file.mimetype));
} });

router.use(protect, authorize("admin"));
router.get("/letter-defaults", letterDefaults);
router.post("/preview", spreadsheetUpload.single("file"), previewImport);
router.post("/manual", onboardManual);
router.post("/bulk", onboardBulk);
router.post("/letters/:internId", generateAndSendLetter);

module.exports = router;
