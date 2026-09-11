const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const COOKIE_NAME = "blesslev_admin_session";
const SESSION_HOURS = 12;

function signToken() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET manquant dans le fichier .env — voir le README.");
  }
  return jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: `${SESSION_HOURS}h` });
}

function cookieOptions() {
  return {
    httpOnly: true, // never readable from JavaScript in the browser — protects against XSS token theft
    secure: process.env.NODE_ENV === "production" || !!process.env.VERCEL, // requires https — true in production and automatically on Vercel
    sameSite: "lax",
    maxAge: SESSION_HOURS * 60 * 60 * 1000,
  };
}

// Express middleware: blocks any route it's attached to unless a valid,
// unexpired admin session cookie is present.
function requireAdmin(req, res, next) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "Non authentifié." });
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: "Session expirée, reconnectez-vous." });
  }
}

// Compares submitted credentials against the configured admin identifier and
// the bcrypt hash of the password (the real password is never stored as
// plain text anywhere in this project, only its hash in .env).
async function checkCredentials(username, password) {
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD_HASH) {
    throw new Error("ADMIN_USERNAME ou ADMIN_PASSWORD_HASH manquant dans le fichier .env — voir le README.");
  }
  if (username !== process.env.ADMIN_USERNAME) return false;
  return bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
}

module.exports = { COOKIE_NAME, signToken, cookieOptions, requireAdmin, checkCredentials };
