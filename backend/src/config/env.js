require("dotenv").config();

const requiredEnv = ["MONGO_URI", "JWT_SECRET", "CLIENT_URL"];

const validateEnv = () => {
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variable(s): ${missing.join(", ")}`);
  }
};

module.exports = { validateEnv };
