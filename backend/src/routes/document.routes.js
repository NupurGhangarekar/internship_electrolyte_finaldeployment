const router = require("express").Router();
const { body } = require("express-validator");
const { protect, authorize } = require("../middleware/auth.middleware");
const validate = require("../middleware/validation.middleware");
const { upload } = require("../services/storage.service");
const { uploadDocument, getDocuments, getMyDocuments, deleteDocument } = require("../controllers/document.controller");

router.use(protect);
router.post(
  "/upload",
  authorize("admin"),
  upload.single("file"),
  [
    body("intern").isMongoId().withMessage("Valid intern is required"),
    body("type").isIn(["Certificate", "Letter of Recommendation", "Completion Certificate", "Other"]).withMessage("Invalid document type")
  ],
  validate,
  uploadDocument
);
router.get("/me/list", getMyDocuments);
router.get("/:internId", getDocuments);
router.delete("/:id", authorize("admin"), deleteDocument);

module.exports = router;
