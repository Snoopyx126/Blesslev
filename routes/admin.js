const express = require("express");
const rateLimit = require("express-rate-limit");
const { COOKIE_NAME, signToken, cookieOptions, requireAdmin, checkCredentials } = require("../auth");
const { getDB } = require("../db");

const router = express.Router();

// Server-side brute-force protection: 5 attempts per 10 minutes per IP.
// This can't be bypassed by editing client-side JavaScript, unlike a purely
// front-end check — the limit lives on the server.
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives. Réessayez dans 10 minutes." },
});

router.post("/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Identifiant et mot de passe requis." });
  }
  let ok;
  try {
    ok = await checkCredentials(username, password);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Configuration serveur incomplète — voir le README (ADMIN_USERNAME / ADMIN_PASSWORD_HASH)." });
  }
  if (!ok) {
    return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
  }
  const token = signToken();
  res.cookie(COOKIE_NAME, token, cookieOptions());
  res.json({ ok: true });
});

router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

// Lets the front end check on page load whether the existing session cookie
// (if any) is still valid, so the merchant doesn't have to log in every time
// they open the admin page within the same 12h window.
router.get("/me", requireAdmin, (req, res) => res.json({ ok: true }));

router.get("/orders", requireAdmin, async (req, res) => {
  try {
    const db = await getDB();
    const orders = await db.collection("orders").find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
    res.json(orders);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur lecture des commandes." });
  }
});

router.patch("/orders/:id/status", requireAdmin, async (req, res) => {
  const { status } = req.body || {};
  if (!["attente", "impression", "fini"].includes(status)) {
    return res.status(400).json({ error: "Statut invalide." });
  }
  try {
    const db = await getDB();
    await db.collection("orders").updateOne({ id: req.params.id }, { $set: { status } });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur mise à jour du statut." });
  }
});

router.delete("/orders/:id", requireAdmin, async (req, res) => {
  try {
    const db = await getDB();
    const result = await db.collection("orders").deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Commande introuvable." });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur suppression de la commande." });
  }
});

module.exports = router;
