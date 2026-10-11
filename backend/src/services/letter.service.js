const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const formatDate = (value) => new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
const safeName = (value) => String(value || "letter").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();

const defaultTemplates = {
  "Offer Letter": {
    subject: "Appointment as Software Development Intern",
    intro: "We are pleased to appoint you as a Software Development Intern at Electrolyte Solutions.",
    body: "During your internship, you will contribute to the assigned project while building practical experience in web application development, database management, and dashboard analytics.",
    closing: "We look forward to your contribution and wish you a successful learning experience with us.",
    signatoryName: "Harish Yadav",
    signatoryTitle: "Chief Executive Officer"
  },
  "Letter of Recommendation": { subject: "Letter of Recommendation", intro: "This letter is to recommend the above intern for their contribution at Electrolyte Solutions.", body: "The intern demonstrated commitment, professionalism, and a willingness to learn throughout the internship.", closing: "We wish them continued success in their academic and professional journey.", signatoryName: "Harish Yadav", signatoryTitle: "Chief Executive Officer" },
  "Letter of Experience": { subject: "Letter of Experience", intro: "This is to certify that the above intern completed an internship at Electrolyte Solutions.", body: "The intern worked on the assigned project and gained practical experience during the stated internship period.", closing: "We appreciate their contribution and wish them continued success.", signatoryName: "Harish Yadav", signatoryTitle: "Chief Executive Officer" }
};

const generateLetter = ({ intern, type = "Offer Letter", template = {} }) => new Promise((resolve, reject) => {
  const settings = { ...(defaultTemplates[type] || defaultTemplates["Offer Letter"]), ...template };
  const uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || "uploads");
  fs.mkdirSync(uploadDir, { recursive: true });
  const filename = `${safeName(type)}-${safeName(intern.name)}-${Date.now()}.pdf`;
  const absolutePath = path.join(uploadDir, filename);
  const doc = new PDFDocument({ size: "A4", margin: 54 });
  const stream = fs.createWriteStream(absolutePath);
  doc.pipe(stream);
  doc.rect(28, 28, 539, 785).stroke();
  doc.fillColor("#111827").font("Helvetica-Bold").fontSize(27).text(settings.companyName || "Electrolyte Solutions", { align: "center" });
  doc.font("Helvetica-Oblique").fontSize(12).text(settings.companyTagline || "An ISO 2015:9001 Certified Company", { align: "center" });
  doc.moveDown(0.4).font("Helvetica").fontSize(9).text(settings.officeAddress || "Navi Mumbai, Maharashtra | contact@electrolytesoln.com", { align: "center" });
  doc.moveDown(3).font("Helvetica-Bold").fontSize(12).text(`Date: ${formatDate(new Date())}`, { align: "right" });
  doc.moveDown(2).font("Helvetica-Bold").fontSize(15).text(`Subject: ${settings.subject}`, { align: "center" });
  doc.moveDown(2).font("Helvetica").fontSize(13).text("To,");
  doc.font("Helvetica-Bold").text(intern.name);
  doc.moveDown(1.6).font("Helvetica").fontSize(12).text(settings.intro, { align: "justify", lineGap: 4 });
  if (type === "Offer Letter") {
    doc.moveDown(1).text(`Your internship period will be from ${formatDate(intern.joiningDate)} for ${intern.internshipDuration || "the agreed duration"}.`, { align: "justify", lineGap: 4 });
    if (intern.projectName) doc.moveDown(1).text(`You will be assigned to the project: ${intern.projectName}. Your mentor will be ${intern.mentorName || "assigned by the organization"}.`, { align: "justify", lineGap: 4 });
  }
  doc.moveDown(1).text(settings.body, { align: "justify", lineGap: 4 });
  doc.moveDown(1).text(settings.closing, { align: "justify", lineGap: 4 });
  doc.moveDown(2).text("Yours sincerely,");
  doc.moveDown(1).font("Helvetica-Bold").text(`For ${settings.companyName || "Electrolyte Solutions"}`);
  doc.moveDown(2).text(settings.signatoryName);
  doc.font("Helvetica").text(`(${settings.signatoryTitle})`);
  doc.fontSize(8).text(settings.registeredAddress || "Registered Office: Kalamboli, Navi Mumbai", 54, 780, { align: "center", width: 487 });
  doc.end();
  stream.on("finish", () => resolve({ filename, absolutePath, relativePath: path.join(process.env.UPLOAD_DIR || "uploads", filename).replace(/\\/g, "/") }));
  stream.on("error", reject);
});

module.exports = { generateLetter, defaultTemplates };
