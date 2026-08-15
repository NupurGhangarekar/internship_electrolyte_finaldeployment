const path = require("path");
const Document = require("../models/Document");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { removeLocalFile } = require("../services/storage.service");

const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError("Document file is required", 400);
  const { intern, type } = req.body;
  const user = await User.findOne({ _id: intern, role: "intern" });
  if (!user) throw new AppError("Valid intern is required", 400);

  const existing = await Document.findOne({ intern, type });
  if (existing) await removeLocalFile(existing.path);

  const relativePath = path.join(process.env.UPLOAD_DIR || "uploads", req.file.filename).replace(/\\/g, "/");
  const doc = await Document.findOneAndUpdate(
    { intern, type },
    {
      intern,
      type,
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: relativePath,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id,
      uploadDate: new Date()
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).populate("intern", "name email department");

  sendSuccess(res, doc, existing ? "Document replaced" : "Document uploaded", existing ? 200 : 201);
});

const getDocuments = asyncHandler(async (req, res) => {
  const internId = req.params.internId;
  if (req.user.role === "intern" && req.user._id.toString() !== internId) throw new AppError("Forbidden", 403);
  const docs = await Document.find({ intern: internId }).populate("uploadedBy", "name email").sort({ uploadDate: -1 });
  sendSuccess(res, docs, "Documents fetched");
});

const getMyDocuments = asyncHandler(async (req, res) => {
  const docs = await Document.find({ intern: req.user._id }).populate("uploadedBy", "name email").sort({ uploadDate: -1 });
  sendSuccess(res, docs, "Documents fetched");
});

const deleteDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) throw new AppError("Document not found", 404);
  await removeLocalFile(doc.path);
  await doc.deleteOne();
  sendSuccess(res, null, "Document deleted");
});

module.exports = { uploadDocument, getDocuments, getMyDocuments, deleteDocument };
