require("dotenv").config();
const app = require("./index");
const { connectDB } = require("./lib/db");

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    console.log("✓ MongoDB connected");
  } catch (err) {
    console.error("✗ MongoDB connection failed:", err.message);
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`✓ Server running on http://0.0.0.0:${PORT}`));
})();
