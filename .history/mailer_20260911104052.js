const { Resend } = require("resend");

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Sends the merchant a notification email when a new order comes in.
// Best-effort: if Resend isn't configured yet, or the send fails, the order
// stays saved in MongoDB regardless — nothing is lost, only the email is skipped.
async function sendMerchantNotification(order) {
  if (!resend) {
    console.log("Resend non configuré (RESEND_API_KEY manquant) — email non envoyé.");
    return;
  }
  if (!process.env.RESEND_FROM_EMAIL || !process.env.MERCHANT_EMAIL) {
    console.log("RESEND_FROM_EMAIL ou MERCHANT_EMAIL manquant dans .env — email non envoyé.");
    return;
  }

  const countryLabel = order.customer.country === "israel" ? "Israël" : "France";
  const itemsSummary = order.items
    .map((i) => `- ${i.name} x${i.qty} (${i.price.toFixed(2)}€)${i.customization && i.customization.text ? " | texte: " + i.customization.text : ""}`)
    .join("\n");

  const text =
    `Nouvelle commande BLESSLEV\n\n` +
    `Commande n°${order.id}\n` +
    `Date : ${new Date(order.createdAt).toLocaleString("fr-FR")}\n` +
    `Pays : ${countryLabel}\n\n` +
    `Client : ${order.customer.firstName} ${order.customer.lastName}\n` +
    `Email : ${order.customer.email}\n` +
    `Téléphone : ${order.customer.phone}\n` +
    `Adresse : ${order.customer.address || "-"}, ${order.customer.zip || ""} ${order.customer.city || ""}\n` +
    `Remarques : ${order.customer.notes || "-"}\n\n` +
    `Articles :\n${itemsSummary}\n\n` +
    `Total : ${order.total.toFixed(2)}€\n\n` +
    `Ouvrez votre espace commerçant pour voir le détail et les visuels personnalisés.`;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: process.env.MERCHANT_EMAIL,
      subject: `🔔 Nouvelle commande BLESSLEV #${order.id} (${countryLabel})`,
      text,
    });
  } catch (e) {
    console.error("Erreur envoi email Resend :", e.message || e);
  }
}

module.exports = { sendMerchantNotification };
