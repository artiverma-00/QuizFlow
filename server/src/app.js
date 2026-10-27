require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const api = require("./routes/api");

const app = express();
app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",").map(x => x.trim()) : "http://localhost:5173" }));
app.use(express.json({ limit: "200kb" }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false }));
app.use("/api", api);

app.use((req, res) => res.status(404).json({ message: "API route not found." }));
app.use((err, _req, res, _next) => {
  if (err && err.code === 11000) return res.status(409).json({ message: "That record already exists." });
  if (err && err.name === "ValidationError") return res.status(400).json({ message: err.message });
  if (err && err.name === "CastError") return res.status(400).json({ message: "Invalid identifier." });
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server. Please try again." });
});
module.exports = app;
