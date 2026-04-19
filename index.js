require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./lib/db");
const authRoutes = require("./routes/auth");
const dataRoutes = require("./routes/data");

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

const originList = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const allowAnyOrigin = originList.includes("*");
const allowed = new Set(originList);
const LOCAL_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowAnyOrigin) return cb(null, true);
      if (LOCAL_ORIGIN_RE.test(origin)) return cb(null, true);
      if (allowed.has(origin)) return cb(null, true);
      console.warn(`[CORS] blocked origin: ${origin}`);
      return cb(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);

app.get("/", (_req, res) => res.json({ message: "AuthStack API", status: "healthy" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok", uptime: process.uptime() }));

const withDB = async (_req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB connection error:", err.message);
    res.status(503).json({ success: false, message: "Database unavailable" });
  }
};

app.use("/api/auth", withDB, authRoutes);
app.use("/api", withDB, dataRoutes);

app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found" }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.statusCode || 500;
  if (status >= 500) console.error(err.stack || err);
  res.status(status).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

module.exports = app;
