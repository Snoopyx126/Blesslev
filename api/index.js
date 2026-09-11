require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const ordersRouter = require("../routes/orders");
const adminRouter = require("../routes/admin");

const app = express();

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
