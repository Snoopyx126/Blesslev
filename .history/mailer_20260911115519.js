const { Resend } = require("resend");

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function esc(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Builds the HTML body — inline styles only, since email clients (Gmail,
// Outlook...) ignore <style> blocks and external stylesheets.
function buildHTML(order, countryLabel) {
  const itemsRows = order.items
    .map((i) => {
      const customBits = [];
      if (i.customization) {
        if (i.customization.text) customBits.push(`Texte : "${esc(i.customization.text)}"`);
        if (i.customization.frame && i.customization.frame !== "none") customBits.push(`Cadre : ${esc(i.customization.frame)}`);
        if (i.customization.hasPhoto) customBits.push("Photo jointe ci-dessous 📎");
      }
      return `
        <tr>
          <td style="padding:14px 0; border-bottom:1px solid #e8ddd0;">
            <div style="font-size:15px; color:#2b2622; font-weight:600;">${esc(i.name)} × ${i.qty}</div>
            ${customBits.length ? `<div style="font-size:13px; color:#6b6259; margin-top:4px;">${customBits.join(" · ")}</div>` : ""}
          </td>
          <td style="padding:14px 0; border-bottom:1px solid #e8ddd0; text-align:right; font-size:15px; color:#2b2622; white-space:nowrap;">
            ${(i.price * i.qty).toFixed(2)}€
          </td>
        </tr>`;
    })
    .join("");

  const row = (label, value) =>
    value ? `<tr><td style="padding:4px 0; font-size:13px; color:#6b6259; width:110px; vertical-align:top;">${label}</td><td style="padding:4px 0; font-size:14px; color:#2b2622;">${esc(value)}</td></tr>` : "";

  return `
  <div style="background:#faf6f0; padding:32px 16px; font-family:Georgia,'Times New Roman',serif;">
    <div style="max-width:560px; margin:0 auto; background:#fffdfa; border-radius:16px; overflow:hidden; border:1px solid #e8ddd0;">

      <div style="background:linear-gradient(135deg,#fbeef5,#ffffff); padding:28px 32px; text-align:center; border-bottom:1px solid #e8ddd0;">
        <div style="font-size:22px; letter-spacing:3px; color:#b85a92; font-weight:bold;">BLESSLEV</div>
        <div style="font-size:12px; letter-spacing:2px; text-transform:uppercase; color:#b08d57; margin-top:6px;">Nouvelle commande</div>
      </div>

      <div style="padding:28px 32px;">
        <table style="width:100%; border-collapse:collapse; margin-bottom:22px;">
          ${row("Commande", "#" + order.id)}
          ${row("Date", new Date(order.createdAt).toLocaleString("fr-FR"))}
          ${row("Pays", countryLabel)}
        </table>

        <div style="background:#faf6f0; border:1px solid #e8ddd0; border-radius:10px; padding:16px 18px; margin-bottom:24px;">
          <div style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#b08d57; font-weight:bold; margin-bottom:10px;">Client</div>
          <table style="width:100%; border-collapse:collapse;">
            ${row("Nom", `${order.customer.firstName} ${order.customer.lastName}`)}
            ${row("Email", order.customer.email)}
            ${row("Téléphone", order.customer.phone)}
            ${row("Adresse", [order.customer.address, order.customer.zip, order.customer.city].filter(Boolean).join(", ") || "-")}
            ${row("Remarques", order.customer.notes)}
          </table>
        </div>

        <div style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#b08d57; font-weight:bold; margin-bottom:8px;">Articles</div>
        <table style="width:100%; border-collapse:collapse; margin-bottom:8px;">
          ${itemsRows}
        </table>
        <table style="width:100%; border-collapse:collapse;">
          <tr>
            <td style="padding-top:12px; font-size:16px; font-weight:bold; color:#2b2622;">Total</td>
            <td style="padding-top:12px; font-size:16px; font-weight:bold; color:#b85a92; text-align:right;">${order.total.toFixed(2)}€</td>
          </tr>
        </table>
      </div>

      <div style="background:#fbeef5; padding:18px 32px; text-align:center;">
        <span style="font-size:13px; color:#b85a92;">Ouvrez votre espace commerçant pour voir le détail complet et les visuels personnalisés.</span>
      </div>

    </div>
  </div>`;
}

// Turns any uploaded customization photos into email attachments (the raw
// photo the client uploaded — not the composited preview with frame/text,
// which only exists client-side today).
function buildAttachments(order) {
  const attachments = [];
  order.items.forEach((item, i) => {
    const photo = item.customization && item.customization.photo;
    if (!photo || typeof photo !== "string" || !photo.startsWith("data:")) return;
    const match = photo.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) return;
    const [, ext, base64] = match;
    attachments.push({
      filename: `photo-commande-${order.id}-${i + 1}.${ext === "jpeg" ? "jpg" : ext}`,
      content: base64,
    });
  });
  return attachments;
}

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

  const html = buildHTML(order, countryLabel);
  const attachments = buildAttachments(order);

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: process.env.MERCHANT_EMAIL,
      subject: `🔔 Nouvelle commande BLESSLEV #${order.id} (${countryLabel})`,
      text,
      html,
      attachments: attachments.length ? attachments : undefined,
    });
    if (result && result.error) {
      // The Resend SDK sometimes returns an error object instead of throwing.
      console.error("Resend a refusé l'envoi :", JSON.stringify(result.error));
    } else {
      console.log(`Email de notification envoyé à ${process.env.MERCHANT_EMAIL} pour la commande #${order.id} (${attachments.length} pièce(s) jointe(s), id Resend: ${result && result.data ? result.data.id : "?"})`);
    }
  } catch (e) {
    console.error("Erreur envoi email Resend :", e.message || e);
  }
}

module.exports = { sendMerchantNotification };