require("dotenv").config();
const connectDB = require("../config/db");
const User = require("../models/User");
const Task = require("../models/Task");
const Document = require("../models/Document");

const seed = async () => {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD are required to seed the admin user");
  }

  await connectDB();
  await Promise.all([User.deleteMany({}), Task.deleteMany({}), Document.deleteMany({})]);

  const admin = await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: "admin",
    department: "People Operations",
    joiningDate: new Date()
  });

  const interns = await User.create([
    {
      name: "Aarav Mehta",
      email: "aarav@example.com",
      password: "password123",
      role: "intern",
      department: "Engineering",
      joiningDate: new Date()
    },
    {
      name: "Isha Rao",
      email: "isha@example.com",
      password: "password123",
      role: "intern",
      department: "Design",
      joiningDate: new Date()
    }
  ]);

  await Task.create([
    {
      title: "Complete company orientation",
      description: "Review onboarding docs and submit acknowledgment.",
      assignedTo: interns[0]._id,
      assignedBy: admin._id,
      priority: "High",
      dueDate: new Date(Date.now() + 5 * 86400000),
      status: "In Progress"
    },
    {
      title: "Submit first-week reflection",
      description: "Share blockers, learnings, and goals for next week.",
      assignedTo: interns[1]._id,
      assignedBy: admin._id,
      priority: "Medium",
      dueDate: new Date(Date.now() + 7 * 86400000)
    }
  ]);

  console.log("Seed complete");
  console.log(`Admin: ${ADMIN_EMAIL}`);
  console.log("Intern: aarav@example.com / password123");
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
