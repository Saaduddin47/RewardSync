require("dotenv").config();
require("express-async-errors");

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./utils/db");
const errorHandler = require("./middleware/error");

const authRoutes = require("./routes/authRoutes");
const joinerRoutes = require("./routes/joinerRoutes");
const claimRoutes = require("./routes/claimRoutes");
const adminRoutes = require("./routes/adminRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const exportRoutes = require("./routes/exportRoutes");
const reportRoutes = require("./routes/reportRoutes");
const bgvRoutes = require("./routes/bgvRoutes");

const app = express();

const extraOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Render health checks)
      if (!origin) return callback(null, true);
      // Always allow localhost dev
      if (origin.startsWith("http://localhost")) return callback(null, true);
      // Always allow any Vercel deployment (preview + production)
      if (origin.endsWith(".vercel.app")) return callback(null, true);
      // Allow any explicitly configured origins
      if (extraOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/joiners", joinerRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/export-report", exportRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/bgv", bgvRoutes);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5001;

connectDB()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Stop the existing server process before starting a new one.`);
        process.exit(1);
      }

      console.error("Server start error:", error.message);
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
