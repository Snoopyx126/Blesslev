const express = require("express");
const rateLimit = require("express-rate-limit");
const { getDB } = require("../db");
const { sendMerchantNotification } = require("../mailer");

const router = express.Router();

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

// Basic abuse protection on the public order form (generous limit — this is
// not meant to block real customers, just scripted spam).
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de commandes envoyées depuis cette connexion. Réessayez plus tard." },
});

router.post("/", orderLimiter, async (req, res) => {
  const body = req.body || {};
  const c = body.customer || {};

  if (!c.firstName || !c.lastName || !c.email || !c.phone || !["france", "israel"].includes(c.country)) {
    return res.status(400).json({ error: "Coordonnées client incomplètes ou pays invalide." });
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return res.status(400).json({ error: "Le panier est vide." });
  }

  const order = {
    id: uid(),
    createdAt: Date.now(),
    status: "attente",
    customer: c,
    items: body.items,
    total: typeof body.total === "number" ? body.total : 0,
  };

  try {
    const db = await getDB();
    await db.collection("orders").insertOne(order);
  } catch (e) {
    console.error("Erreur sauvegarde commande MongoDB :", e);
    return res.status(500).json({ error: "Impossible d'enregistrer la commande. Réessayez." });
  }

  // Fire-and-forget: the order is already safely saved above, so an email
  // hiccup here never loses the order itself.
  sendMerchantNotification(order).catch(() => {});

  res.json({ ok: true, id: order.id });
});

module.exports = router;
