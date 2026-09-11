require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const ordersRouter = require("../routes/orders");
const adminRouter = require("../routes/admin");

const app = express();

// Vercel (and most hosts) sit in front of this app as a reverse proxy, and
// set the X-Forwarded-For header with the real visitor's IP. Without this,
// express-rate-limit can't reliably tell users apart by IP (it would see
// Vercel's internal address for everyone) and logs a warning about it.
app.set("trust proxy", 1);

// Customized calendar photos are sent as base64 in the order payload, which
// can be a few MB — raise the default body size limit accordingly.
app.use(express.json({ limit: "15mb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/api/orders", ordersRouter);
app.use("/api/admin", adminRouter);

// Single-page app: any other GET request gets index.html, and the front-end's
// own router (state-based, plus the #admin hash) takes it from there.
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// On Vercel, this file itself IS the serverless function — Vercel calls
// `app(req, res)` directly for every request, it never calls app.listen().
module.exports = app;