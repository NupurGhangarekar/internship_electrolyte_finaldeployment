const crypto = require("crypto");
const XLSX = require("xlsx");
const User = require("../models/User");
const Project = require("../models/Project");
const Document = require("../models/Document");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { generateLetter, defaultTemplates } = require("../services/letter.service");
const { sendOnboardingEmail, sendLetterEmail } = require("../services/email.service");

const aliases = {
  name: ["intern name", "name", "internname"],
  email: ["intern email", "email", "email address", "internemail"],
  projectName: ["project name", "project", "projectname"],
  joiningDate: ["joining date", "joiningdate", "start date"],
  internshipDuration: ["duration of internship", "internship duration", "duration"],
  mentorName: ["mentor name", "mentor", "mentorname"],
  collegeName: ["college name", "college", "collegename"],
  branchName: ["branch name", "branch", "branchname"]
};

const normalized = (key) => String(key || "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
const mappedRow = (row) => Object.fromEntries(Object.entries(aliases).map(([field, names]) => {
  const source = Object.keys(row).find((key) => names.includes(normalized(key)));
  return [field, source ? row[source] : ""];
}));

const parseDate = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const validateRow = (input, index) => {
  const row = { ...input, name: String(input.name || "").trim(), email: String(input.email || "").trim().toLowerCase(), projectName: String(input.projectName || "").trim() };
  const errors = [];
  if (!row.name) errors.push("Intern name is required");
  if (!/^\S+@\S+\.\S+$/.test(row.email)) errors.push("Valid intern email is required");
  if (!row.projectName) errors.push("Project name is required");
  row.joiningDate = parseDate(row.joiningDate);
  if (!row.joiningDate) errors.push("Valid joining date is required");
  if (!String(row.internshipDuration || "").trim()) errors.push("Internship duration is required");
  if (!String(row.mentorName || "").trim()) errors.push("Mentor name is required");
  if (!String(row.collegeName || "").trim()) errors.push("College name is required");
  if (!String(row.branchName || "").trim()) errors.push("Branch name is required");
  return { row: { ...row, internshipDuration: String(row.internshipDuration || "").trim(), mentorName: String(row.mentorName || "").trim(), collegeName: String(row.collegeName || "").trim(), branchName: String(row.branchName || "").trim() }, index, errors };
};

const randomPassword = () => `${crypto.randomBytes(6).toString("base64url")}Aa1!`;
const projectCode = (name) => `${String(name).replace(/[^a-z0-9]/gi, "").slice(0, 7).toUpperCase() || "INTERN"}-${Date.now().toString().slice(-5)}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

const getProject = async ({ projectName, internId, adminId, joiningDate }) => {
  let project = await Project.findOne({ name: projectName, status: { $ne: "Archived" } });
  if (!project) project = await Project.create({ name: projectName, projectCode: projectCode(projectName), owner: adminId, assignedInterns: [internId], status: "Planned", startDate: joiningDate });
  else if (!project.assignedInterns.some((id) => id.equals(internId))) { project.assignedInterns.push(internId); await project.save(); }
  return project;
};

const createIntern = async ({ payload, admin, template = {} }) => {
  const exists = await User.findOne({ email: payload.email });
  if (exists) throw new AppError(`An account already exists for ${payload.email}`, 409);
  const temporaryPassword = randomPassword();
  const intern = await User.create({ ...payload, password: temporaryPassword, role: "intern", department: payload.branchName, mustChangePassword: true });
  const project = await getProject({ projectName: payload.projectName, internId: intern._id, adminId: admin._id, joiningDate: payload.joiningDate });
  const letter = await generateLetter({ intern: { ...intern.toObject(), projectName: project.name }, type: "Offer Letter", template });
  let emailStatus = "not_sent";
  let emailError = "";
  try {
    const delivery = await sendOnboardingEmail({ intern, temporaryPassword, letterPath: letter.absolutePath, letterName: letter.filename, portalUrl: process.env.CLIENT_URL });
    emailStatus = delivery.status;
  } catch (error) { emailStatus = "failed"; emailError = error.message; }
  const document = await Document.findOneAndUpdate(
    { intern: intern._id, type: "Offer Letter" },
    { intern: intern._id, type: "Offer Letter", filename: letter.filename, originalName: "Internship Appointment Letter.pdf", path: letter.relativePath, mimeType: "application/pdf", size: require("fs").statSync(letter.absolutePath).size, uploadedBy: admin._id, uploadDate: new Date(), emailStatus, emailedAt: emailStatus === "sent" ? new Date() : undefined, emailError },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return { intern, project, document, emailStatus };
};

const previewImport = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError("Excel or CSV file is required", 400);
  const workbook = XLSX.read(req.file.buffer, { type: "buffer", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const records = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });
  if (!records.length) throw new AppError("The spreadsheet has no data rows", 400);
  const seen = new Set();
  const rows = records.map((record, index) => {
    const result = validateRow(mappedRow(record), index + 2);
    if (result.row.email && seen.has(result.row.email)) result.errors.push("Duplicate email in spreadsheet");
    seen.add(result.row.email);
    return result;
  });
  const existing = await User.find({ email: { $in: rows.map((item) => item.row.email).filter(Boolean) } }).select("email");
  const existingEmails = new Set(existing.map((user) => user.email));
  rows.forEach((item) => { if (existingEmails.has(item.row.email)) item.errors.push("An account already exists for this email"); });
  sendSuccess(res, { validRows: rows.filter((item) => !item.errors.length), invalidRows: rows.filter((item) => item.errors.length), requiredColumns: Object.keys(aliases) }, "Spreadsheet preview created");
});

const onboardManual = asyncHandler(async (req, res) => {
  const checked = validateRow(req.body, 1);
  if (checked.errors.length) throw new AppError(checked.errors.join(". "), 400);
  const result = await createIntern({ payload: checked.row, admin: req.user, template: req.body.template || {} });
  sendSuccess(res, { intern: result.intern, project: result.project, document: result.document, emailStatus: result.emailStatus }, "Intern onboarded and offer letter generated", 201);
});

const onboardBulk = asyncHandler(async (req, res) => {
  if (!Array.isArray(req.body.rows) || !req.body.rows.length) throw new AppError("Valid onboarding rows are required", 400);
  const results = [];
  for (const row of req.body.rows) {
    const checked = validateRow(row, 1);
    if (checked.errors.length) { results.push({ email: row.email, status: "failed", errors: checked.errors }); continue; }
    try { const item = await createIntern({ payload: checked.row, admin: req.user, template: req.body.template || {} }); results.push({ email: item.intern.email, status: "created", emailStatus: item.emailStatus }); }
    catch (error) { results.push({ email: row.email, status: "failed", errors: [error.message] }); }
  }
  sendSuccess(res, results, "Bulk onboarding completed", 201);
});

const generateAndSendLetter = asyncHandler(async (req, res) => {
  const { type, template = {} } = req.body;
  if (!["Offer Letter", "Letter of Recommendation", "Letter of Experience"].includes(type)) throw new AppError("Unsupported letter type", 400);
  const intern = await User.findOne({ _id: req.params.internId, role: "intern" });
  if (!intern) throw new AppError("Intern not found", 404);
  const letter = await generateLetter({ intern, type, template });
  let emailStatus = "not_sent"; let emailError = "";
  try { const delivery = await sendLetterEmail({ intern, letterPath: letter.absolutePath, letterName: letter.filename, type }); emailStatus = delivery.status; } catch (error) { emailStatus = "failed"; emailError = error.message; }
  const document = await Document.findOneAndUpdate({ intern: intern._id, type }, { intern: intern._id, type, filename: letter.filename, originalName: `${type}.pdf`, path: letter.relativePath, mimeType: "application/pdf", size: require("fs").statSync(letter.absolutePath).size, uploadedBy: req.user._id, uploadDate: new Date(), emailStatus, emailedAt: emailStatus === "sent" ? new Date() : undefined, emailError }, { upsert: true, new: true, setDefaultsOnInsert: true });
  sendSuccess(res, document, `${type} generated`);
});

const letterDefaults = (_req, res) => sendSuccess(res, defaultTemplates, "Letter templates fetched");

module.exports = { previewImport, onboardManual, onboardBulk, generateAndSendLetter, letterDefaults };
