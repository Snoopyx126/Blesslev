// =================================================================
// BLESSLEV — boutique en ligne (prototype fonctionnel)
// =================================================================

const state = {
  route: { name: "home" },
  cart: [], // {lineId, productId, name, price, qty, thumb, customization}
  cz: null, // customizer working state
  country: (function () { try { return localStorage.getItem("blesslev_country") || null; } catch (e) { return null; } })(),
};
function setCountry(c) {
  state.country = c;
  try { localStorage.setItem("blesslev_country", c); } catch (e) {}
  render();
}

// Admin authentication now happens entirely on the server (username +
// bcrypt-hashed password, JWT session in an httpOnly cookie, rate-limited
// login attempts) — see server.js / auth.js / routes/admin.js. The front
// end just tracks whether we currently have a valid session.
let adminUnlocked = false;
let adminLoginError = "";

const root = document.getElementById("app");

// ---------------- Storage helpers (talk to the backend API) ----------------
// Orders now live in MongoDB, via the small Express server (see server.js).
// The public "create order" call needs no auth; admin calls send the
// httpOnly session cookie automatically (credentials: "include").

async function saveOrder(order) {
  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error("Erreur sauvegarde commande", data.error || res.status);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Erreur réseau sauvegarde commande", e);
    return false;
  }
}

async function listOrders() {
  try {
    const res = await fetch("/api/admin/orders", { credentials: "include" });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error("Erreur lecture commandes", e);
    return [];
  }
}

async function updateOrderStatus(id, status) {
  try {
    await fetch(`/api/admin/orders/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
  } catch (e) {
    console.error(e);
  }
}

// ---------------- Utils ----------------
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function money(n) {
  return n.toFixed(2).replace(".", ",") + " €";
}
function cartTotal() {
  return state.cart.reduce((s, i) => s + i.price * i.qty, 0);
}
function cartCount() {
  return state.cart.reduce((s, i) => s + i.qty, 0);
}
function navigate(route) {
  state.route = route;
  window.scrollTo(0, 0);
  render();
}
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}
function esc(s) {
  const d = document.createElement("div");
  d.textContent = s || "";
  return d.innerHTML;
}

// ---------------- Header ----------------
function renderHeader() {
  return `
  <header class="site-header">
    <div class="header-inner">
      <div class="brand" onclick="navigate({name:'home'})">
        <img src="img/logo.jpg" alt="BLESSLEV logo" />
        <span class="brand-name">BLESSLEV</span>
      </div>
      <nav class="nav-links">
        <button class="linklike" onclick="navigate({name:'home'})">Boutique</button>
        <button class="cart-btn" onclick="navigate({name:'cart'})">
          🛒 Panier ${cartCount() > 0 ? `<span class="cart-badge">${cartCount()}</span>` : ""}
        </button>
      </nav>
    </div>
  </header>`;
}

function renderFooter() {
  return `
  <footer class="site-footer">
    <div class="footer-divider"></div>
    <div class="footer-inner">
      <span class="footer-brand serif">BLESSLEV</span>
      <span class="footer-tagline">Des bénédictions à emporter</span>
      <span class="footer-contact">@bless.lev · 058-6004418</span>
    </div>
  </footer>`;
}

// ---------------- Home / Vitrine ----------------
function renderHome() {
  return `
    <div class="page page-home">
      <div class="hero">
        <div class="hero-motif">✧</div>
        <span class="hero-kicker">Créations personnalisées</span>
        <h1 class="serif">BLESSLEV</h1>
        <p class="hero-slogan">Des bénédictions à emporter</p>
        <div class="hero-divider"><span></span><span class="hero-divider-star">✦</span><span></span></div>
        <p>Votre calendrier personnalisé, avec votre photo et votre texte, pour célébrer chaque moment qui compte.</p>
        <div class="country-toggle">
          <span class="country-toggle-label">Vous commandez depuis :</span>
          <div class="country-pills">
            <button class="country-pill ${state.country === "france" ? "active" : ""}" onclick="setCountry('france')">🇫🇷 France</button>
            <button class="country-pill ${state.country === "israel" ? "active" : ""}" onclick="setCountry('israel')">🇮🇱 Israël</button>
          </div>
        </div>
        <button class="btn hero-cta" onclick="navigate({name:'customize', id:'calendrier-5787'})">🎨 Commencer à personnaliser votre calendrier</button>
        <p class="hero-soon">✨ Plein de nouveautés arrivent très bientôt chez BLESSLEV — restez à l'écoute !</p>
      </div>
    </div>`;
}

// ---------------- Product detail ----------------
function renderProduct(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return `<div class="page"><p>Produit introuvable.</p></div>`;

  const gallery = p.images
    .map((src) => `<img src="${src}" alt="${esc(p.name)}"/>`)
    .join("");

  const actionBtn = p.custom
    ? `<button class="btn full" onclick="navigate({name:'customize', id:'${p.id}'})">🎨 Personnaliser mon calendrier</button>`
    : `<button class="btn full" onclick="addSimpleToCart('${p.id}')">Ajouter au panier</button>`;

  return `
    <div class="page">
      <div class="back-link" onclick="navigate({name:'home'})">← Retour à la boutique</div>
      <div class="product-detail">
        <div class="pd-main-img"><img src="${p.images[0]}" alt="${esc(p.name)}"/></div>
        <div>
          <h1 class="pd-title serif">${esc(p.name)}</h1>
          <div class="pd-price">${money(p.price)}</div>
          <p class="pd-desc">${esc(p.desc)}</p>
          ${actionBtn}
          <div class="examples-title">Exemples de réalisations déjà effectuées</div>
          <div class="examples-row">${gallery}</div>
        </div>
      </div>
    </div>`;
}

function addSimpleToCart(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return;
  state.cart.push({
    lineId: uid(),
    productId: p.id,
    name: p.name,
    price: p.price,
    qty: 1,
    thumb: p.images[0],
    customization: null,
  });
  toast("Ajouté au panier ✓");
  render();
}

// ---------------- Calendar customizer ----------------
// Composition (bottom -> top):
//   1. cz-photo-zone   : client's photo, full page, draggable + resizable
//   2. cz-frame-layer  : decorative frame chosen by the client (optional)
//   3. cz-text-layer   : client's own text, freely draggable, color editable
//   4. cz-ink-layer    : the fixed blessing text / border / logo (transparent
//                        background — "se fond" with the photo underneath).
//                        NOT editable by the client.
//   5. cz-black-mask   : the black square. Fully opaque in the real result —
//                        anything positioned behind it (photo, text, frame)
//                        will NOT be visible on the finished product.
//                        Shown semi-transparent in edit mode as a warning.

// The visible area above the black square (client's photo goes here by
// default) stops at this % of the page height — below it is the black
// square + fixed footer, which the photo doesn't need to fill by default.
const CZ_TOP_ZONE_H = 52.4;

function freshCzState(productId) {
  return {
    productId,
    photo: null,
    // Photo box position & size, all in % of the preview container (responsive)
    photoX: 0, photoY: 0, photoW: 100, photoH: 100,
    keepRatio: true, // checkbox: lock width/height ratio while resizing (on by default; user can uncheck to stretch freely)
    bgColor: "#efe9e0", // fills any space left visible when the photo doesn't cover the whole page
    pickingColor: false, // true while the eyedropper is armed, waiting for a click on the photo
    text: "", textColor: "#3a332c", fontSize: 26, fontFamily: FONTS_FLAT[0].css,
    textX: 20, textY: 14, textW: 60, // % box: top-left position + width (page reflows within it)
    fontDropdownOpen: false,
    frame: "none",
    editMode: true, // true = show warning tint on the locked zone; false = true final preview
    draggingPhoto: false, dragStartPhoto: null,
    photoSelected: false, // true while the photo box is actively selected — shows its outline/handles
    draggingText: false, dragStartText: null,
    resizingCorner: null, resizeStart: null,
  };
}

function openCustomizer(id) {
  state.cz = freshCzState(id);
  navigate({ name: "customize", id });
}

function renderCustomize(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return `<div class="page"><p>Produit introuvable.</p></div>`;
  if (!state.cz || state.cz.productId !== id) state.cz = freshCzState(id);
  const cz = state.cz;

  const frameButtons = FRAMES.map(
    (f) => `
    <button class="frame-opt ${cz.frame === f.id ? "active" : ""}" title="${f.label}"
      onclick="setCzFrame('${f.id}')">
      ${f.id === "none" ? "✕" : frameSVG(f.id)}
    </button>`
  ).join("");

  const corners = ["nw", "ne", "sw", "se"];
  const photoCoversPage = cz.photo && cz.photoX <= 0.5 && cz.photoY <= 0.5 && (cz.photoX + cz.photoW) >= 99.5 && (cz.photoY + cz.photoH) >= 99.5;
  const showBgColorPicker = cz.photo && !photoCoversPage;

  return `
    <div class="page">
      <div class="back-link" onclick="navigate({name:'product', id:'${id}'})">← Retour au produit</div>
      <h1 class="pd-title serif" style="margin-bottom:4px;">Personnalisez votre calendrier</h1>
      <p class="hint" style="margin-bottom:20px;">Votre photo peut couvrir toute la page, y compris derrière le carré noir — mais tout ce qui se retrouve derrière ce carré ne sera pas visible sur le calendrier imprimé. La bénédiction en bas n'est pas modifiable.</p>

      <div class="customizer-wrap">
        <div class="cz-controls">

          <div class="cz-block">
            <div class="cz-step-header"><span class="step-num">1</span>Votre photo</div>
            <input type="file" accept="image/*" onchange="onCzPhotoChange(event)"/>
            ${cz.photo ? `
              <label class="toggle-row" style="margin-top:12px;">
                <input type="checkbox" ${cz.keepRatio ? "checked" : ""} onchange="setCzKeepRatio(this.checked)"/>
                Conserver les proportions largeur / hauteur
              </label>
              <div class="hint">Glissez la photo pour la déplacer. Tirez sur un des 4 coins de l'aperçu pour changer sa largeur et sa hauteur exactement comme vous voulez.</div>
              <button class="btn secondary small" style="margin-top:10px;" onclick="removeCzPhoto()">Retirer la photo</button>
            ` : `<div class="hint">Format conseillé : bonne résolution. Elle s'adapte d'abord à la zone visible du haut — vous pourrez l'agrandir ensuite si vous voulez.</div>`}
          </div>

          ${showBgColorPicker ? `
          <div class="cz-block" id="czBgColorBlock">
            <div class="cz-step-header">Couleur de fond</div>
            <div class="hint" style="margin-bottom:8px;">Un peu de fond reste visible autour du carré central : choisissez une couleur, ou cliquez sur la pipette puis sur votre photo pour prélever une couleur directement dessus.</div>
            <div style="display:flex; gap:10px; align-items:center;">
              <input type="color" value="${cz.bgColor}" oninput="setCzBgColor(this.value)" style="width:44px; height:38px; padding:2px; cursor:pointer;"/>
              <button type="button" class="btn secondary small pipette-btn ${cz.pickingColor ? "active" : ""}" onclick="toggleCzColorPicking()">💧 ${cz.pickingColor ? "Cliquez sur la photo…" : "Pipette"}</button>
            </div>
          </div>` : ""}

          <div class="cz-block">
            <div class="cz-step-header"><span class="step-num">2</span>Votre texte</div>
            <input type="text" placeholder="Ex : Joan &amp; Charles" value="${esc(cz.text)}" oninput="setCzText(this.value)" maxlength="60"/>
            <label>Couleur du texte</label>
            <input type="color" value="${cz.textColor}" oninput="setCzTextColor(this.value)"/>
            <label style="margin-top:10px;">Police d'écriture</label>
            <div class="font-dropdown" id="czFontDropdown">
              <button type="button" class="font-dropdown-btn" style="font-family:${cz.fontFamily};" onclick="toggleFontDropdown(event)">
                ${esc((FONTS_FLAT.find(f => f.css === cz.fontFamily) || FONTS_FLAT[0]).label)} <span class="fd-arrow">▾</span>
              </button>
              ${cz.fontDropdownOpen ? `
              <div class="font-dropdown-panel">
                ${FONTS.map(g => `
                  <div class="font-group-label">${esc(g.group)}</div>
                  ${g.items.map(f => `
                    <div class="font-option ${cz.fontFamily === f.css ? "active" : ""}" style="font-family:${f.css};"
                         onmouseenter="previewCzFont('${f.css.replace(/'/g, "\\'")}')" onmouseleave="revertCzFontPreview()"
                         onclick="setCzFontFamily('${f.css.replace(/'/g, "\\'")}')">${f.label}</div>
                  `).join("")}
                `).join("")}
              </div>` : ""}
            </div>
            <label>Taille du texte</label>
            <input type="range" id="czFontSizeSlider" min="8" max="160" step="1" value="${cz.fontSize}" oninput="setCzFontSize(this.value)"/>
            <div class="hint">Glissez le texte dans l'aperçu pour le déplacer. Tirez les poignées à gauche/droite du texte pour l'étirer (mots côte à côte) ou le resserrer (mots les uns sous les autres).</div>
          </div>

          <div class="cz-block">
            <div class="cz-step-header"><span class="step-num">3</span>Cadre décoratif</div>
            <div class="frame-options">${frameButtons}</div>
          </div>

          <label class="toggle-row">
            <input type="checkbox" ${!cz.editMode ? "checked" : ""} onchange="toggleCzPreview(this.checked)"/>
            Aperçu du rendu final (masque le carré à 100%)
          </label>

          <div class="lock-note">
            🔒 Le carré noir et la bénédiction imprimée en dessous font partie du modèle déposé BLESSLEV et ne sont jamais modifiables. Tout élément (photo, texte, cadre) placé derrière le carré ne sera pas visible sur le calendrier fini — la zone grisée dans l'aperçu vous montre où.
          </div>

          <button class="btn full" style="margin-top:6px;" onclick="addCustomCalendarToCart()">Ajouter au panier — ${money(p.price)}</button>
        </div>

        <div class="cz-preview-outer">
          <div class="cz-preview ${cz.pickingColor ? "picking-color" : ""}" id="czPreview" style="background:${cz.bgColor};" onclick="czPreviewClickForColorPick(event)">
            ${cz.photo ? `
              <div class="cz-photo-box ${cz.photoSelected ? "selected" : ""}" id="czPhotoBox"
                   style="left:${cz.photoX}%; top:${cz.photoY}%; width:${cz.photoW}%; height:${cz.photoH}%;"
                   onmousedown="czPhotoDragStart(event)" ontouchstart="czPhotoDragStart(event)">
                <img id="czPhotoImg" src="${cz.photo}" draggable="false"/>
                ${cz.photoSelected ? corners.map(c => `<div class="cz-corner-handle corner-${c}" data-corner="${c}"
                     onmousedown="czCornerDragStart(event,'${c}')" ontouchstart="czCornerDragStart(event,'${c}')"></div>`).join("") : ""}
              </div>
            ` : `<div class="cz-empty-msg">Votre photo apparaîtra ici<br/>(elle peut couvrir toute la page)</div>`}

            <div class="cz-frame-layer">${cz.frame !== "none" ? frameSVG(cz.frame) : ""}</div>

            ${cz.text ? `
            <div class="cz-text-box" id="czTextBox" style="left:${cz.textX}%; top:${cz.textY}%; width:${cz.textW}%;">
              <div class="cz-text-layer" id="czTextLayer"
                   style="color:${cz.textColor}; font-size:${cz.fontSize}px; font-family:${cz.fontFamily};"
                   onmousedown="czTextDragStart(event)" ontouchstart="czTextDragStart(event)">${esc(cz.text)}</div>
              <div class="cz-text-handle handle-w" onmousedown="czTextHandleDragStart(event,'w')" ontouchstart="czTextHandleDragStart(event,'w')"></div>
              <div class="cz-text-handle handle-e" onmousedown="czTextHandleDragStart(event,'e')" ontouchstart="czTextHandleDragStart(event,'e')"></div>
            </div>` : ""}

            <div class="cz-ink-layer"><img src="img/ink_overlay.png" alt=""/></div>

            <div class="cz-black-mask ${cz.editMode ? "edit-mode" : ""}"><img src="img/black_mask.png" alt=""/></div>
            ${cz.editMode ? `<div class="cz-not-visible-label">Zone non visible<br/>sur le résultat final</div>` : ""}
          </div>
        </div>
      </div>
    </div>`;
}

function setCzFrame(id) { state.cz.frame = id; render(); }
function setCzText(v) { state.cz.text = v; renderKeepFocus(); }
function setCzTextColor(v) {
  state.cz.textColor = v;
  const el = document.getElementById("czTextLayer");
  if (el) el.style.color = v; else render();
}
function setCzFontSize(v) {
  state.cz.fontSize = parseInt(v, 10);
  const el = document.getElementById("czTextLayer");
  if (el) el.style.fontSize = state.cz.fontSize + "px"; else render();
}

// ---- Custom font dropdown (native <select> can't preview on hover) ----
function toggleFontDropdown(evt) {
  if (evt) evt.stopPropagation();
  state.cz.fontDropdownOpen = !state.cz.fontDropdownOpen;
  render();
}
function previewCzFont(css) {
  const el = document.getElementById("czTextLayer");
  if (el) el.style.fontFamily = css;
  const btn = document.querySelector(".font-dropdown-btn");
  if (btn) btn.style.fontFamily = css;
}
function revertCzFontPreview() {
  const el = document.getElementById("czTextLayer");
  if (el) el.style.fontFamily = state.cz.fontFamily;
  const btn = document.querySelector(".font-dropdown-btn");
  if (btn) btn.style.fontFamily = state.cz.fontFamily;
}
function setCzFontFamily(css) {
  state.cz.fontFamily = css;
  state.cz.fontDropdownOpen = false;
  render();
}
document.addEventListener("click", (e) => {
  if (state.cz && state.cz.fontDropdownOpen && !e.target.closest("#czFontDropdown")) {
    state.cz.fontDropdownOpen = false;
    render();
  }
  if (state.cz && state.cz.photoSelected && !e.target.closest("#czPhotoBox")) {
    state.cz.photoSelected = false;
    render();
  }
});
function setCzKeepRatio(v) { state.cz.keepRatio = v; }
function toggleCzPreview(checked) { state.cz.editMode = !checked; render(); }

function setCzBgColor(v) {
  state.cz.bgColor = v;
  const el = document.getElementById("czPreview");
  if (el) el.style.background = v; else render();
}

// ---- Eyedropper: arm it with the button, then click anywhere on the photo
// in the preview to sample that pixel's color as the background fill.
// Built with a canvas (works in every browser, incl. Safari — unlike the
// native EyeDropper API, which is Chrome/Edge-only). ----
function toggleCzColorPicking() {
  state.cz.pickingColor = !state.cz.pickingColor;
  render();
}
function czPreviewClickForColorPick(evt) {
  if (!state.cz.pickingColor) return;
  const img = document.getElementById("czPhotoImg");
  if (!img) {
    toast("Ajoutez une photo pour pouvoir y prélever une couleur.");
    state.cz.pickingColor = false;
    render();
    return;
  }
  const rect = img.getBoundingClientRect();
  const point = evt.touches ? evt.touches[0] : evt;
  const xRatio = (point.clientX - rect.left) / rect.width;
  const yRatio = (point.clientY - rect.top) / rect.height;
  if (xRatio < 0 || xRatio > 1 || yRatio < 0 || yRatio > 1) {
    toast("Cliquez directement sur la photo pour prélever une couleur.");
    return;
  }
  try {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const px = ctx.getImageData(
      Math.min(canvas.width - 1, Math.floor(xRatio * canvas.width)),
      Math.min(canvas.height - 1, Math.floor(yRatio * canvas.height)),
      1, 1
    ).data;
    const hex = "#" + [px[0], px[1], px[2]].map((v) => v.toString(16).padStart(2, "0")).join("");
    setCzBgColor(hex);
    toast("Couleur prélevée ✓");
  } catch (e) {
    toast("Impossible de prélever cette couleur.");
  }
  state.cz.pickingColor = false;
  render();
}

function removeCzPhoto() {
  state.cz.photo = null;
  state.cz.photoX = 0; state.cz.photoY = 0; state.cz.photoW = 100; state.cz.photoH = 100;
  render();
}
function onCzPhotoChange(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    state.cz.photo = e.target.result;
    // Start by filling the visible top zone only (above the black square) —
    // not the whole page, since the bottom half is mostly hidden anyway.
    // The client can still drag/resize freely afterwards.
    state.cz.photoX = 0; state.cz.photoY = 0; state.cz.photoW = 100; state.cz.photoH = CZ_TOP_ZONE_H;
    state.cz.photoSelected = true; // show handles right away so the client knows they can resize
    render();
  };
  reader.readAsDataURL(file);
}

// Re-render while preserving focus in the text input (so typing isn't interrupted)
function renderKeepFocus() {
  render();
  const input = document.querySelector('.cz-block input[type=text]');
  if (input) {
    input.focus();
    const v = input.value;
    input.value = "";
    input.value = v;
  }
}

function applyPhotoBoxStyle() {
  const box = document.getElementById("czPhotoBox");
  if (!box) return;
  box.style.left = state.cz.photoX + "%";
  box.style.top = state.cz.photoY + "%";
  box.style.width = state.cz.photoW + "%";
  box.style.height = state.cz.photoH + "%";
}

// ---- Dragging: move the photo box around (position only, no resize) ----
function czPhotoDragStart(evt) {
  if (evt.target.classList.contains("cz-corner-handle")) return; // handles manage their own drag
  if (state.cz.pickingColor) return; // eyedropper armed — clicking the photo picks a color instead of dragging
  const point = evt.touches ? evt.touches[0] : evt;
  state.cz.draggingPhoto = true;
  state.cz.dragStartPhoto = { x: point.clientX, y: point.clientY, photoX: state.cz.photoX, photoY: state.cz.photoY };
  if (!state.cz.photoSelected) {
    state.cz.photoSelected = true;
    render();
  }
  const box = document.getElementById("czPhotoBox");
  if (box) box.classList.add("dragging");
}

// ---- Resizing: drag any of the 4 corners to set width & height independently ----
function czCornerDragStart(evt, corner) {
  evt.stopPropagation();
  evt.preventDefault();
  const point = evt.touches ? evt.touches[0] : evt;
  const preview = document.getElementById("czPreview");
  const rect = preview.getBoundingClientRect();
  state.cz.resizingCorner = corner;
  state.cz.resizeStart = {
    x: point.clientX, y: point.clientY,
    rectW: rect.width, rectH: rect.height,
    // current box, converted to px
    leftPx: (state.cz.photoX / 100) * rect.width,
    topPx: (state.cz.photoY / 100) * rect.height,
    wPx: (state.cz.photoW / 100) * rect.width,
    hPx: (state.cz.photoH / 100) * rect.height,
  };
}
function czCornerDragMove(evt) {
  const corner = state.cz.resizingCorner;
  if (!corner) return;
  const point = evt.touches ? evt.touches[0] : evt;
  const d = state.cz.resizeStart;
  const dx = point.clientX - d.x;
  const dy = point.clientY - d.y;

  // Fixed corner = opposite of the one being dragged
  const fixedX = corner.includes("w") ? d.leftPx + d.wPx : d.leftPx; // dragging a "w" (west) corner -> fixed point is on the right
  const fixedY = corner.includes("n") ? d.topPx + d.hPx : d.topPx;   // dragging a "n" (north) corner -> fixed point is on the bottom

  // Free corner moves with the mouse
  const freeX = (corner.includes("w") ? d.leftPx : d.leftPx + d.wPx) + dx;
  const freeY = (corner.includes("n") ? d.topPx : d.topPx + d.hPx) + dy;

  let rawW = Math.abs(freeX - fixedX);
  let rawH = Math.abs(freeY - fixedY);

  let finalW = rawW, finalH = rawH;
  if (state.cz.keepRatio && d.wPx > 0 && d.hPx > 0) {
    const scale = Math.max(rawW / d.wPx, rawH / d.hPx);
    finalW = d.wPx * scale;
    finalH = d.hPx * scale;
  }
  finalW = Math.max(20, finalW);
  finalH = Math.max(20, finalH);

  const newLeft = corner.includes("w") ? fixedX - finalW : fixedX;
  const newTop = corner.includes("n") ? fixedY - finalH : fixedY;

  state.cz.photoX = (newLeft / d.rectW) * 100;
  state.cz.photoY = (newTop / d.rectH) * 100;
  state.cz.photoW = (finalW / d.rectW) * 100;
  state.cz.photoH = (finalH / d.rectH) * 100;

  applyPhotoBoxStyle();
}
function czCornerDragEnd() {
  state.cz.resizingCorner = null;
  state.cz.resizeStart = null;
}

// ---- Dragging: client's text box (moves position, keeps its width) ----
function czTextDragStart(evt) {
  evt.stopPropagation();
  const point = evt.touches ? evt.touches[0] : evt;
  const preview = document.getElementById("czPreview");
  const rect = preview.getBoundingClientRect();
  state.cz.draggingText = true;
  state.cz.dragStartText = {
    x: point.clientX, y: point.clientY,
    textX: state.cz.textX, textY: state.cz.textY,
    rectW: rect.width, rectH: rect.height,
  };
  const box = document.getElementById("czTextBox");
  if (box) box.classList.add("dragging");
}
function czTextDragMove(evt) {
  if (!state.cz.draggingText) return;
  const point = evt.touches ? evt.touches[0] : evt;
  const d = state.cz.dragStartText;
  const dxPct = ((point.clientX - d.x) / d.rectW) * 100;
  const dyPct = ((point.clientY - d.y) / d.rectH) * 100;
  let nx = d.textX + dxPct;
  let ny = d.textY + dyPct;
  nx = Math.max(-10, Math.min(95, nx));
  ny = Math.max(0, Math.min(97, ny));
  state.cz.textX = nx; state.cz.textY = ny;
  const box = document.getElementById("czTextBox");
  if (box) { box.style.left = nx + "%"; box.style.top = ny + "%"; }
}

// ---- Resizing: side handles stretch/shrink the text box width.
// Wider box -> words spread out on one line. Narrower box -> words wrap
// and stack on top of each other. ----
function czTextHandleDragStart(evt, side) {
  evt.stopPropagation();
  evt.preventDefault();
  const point = evt.touches ? evt.touches[0] : evt;
  const preview = document.getElementById("czPreview");
  const rect = preview.getBoundingClientRect();
  state.cz.resizingTextSide = side;
  state.cz.textResizeStart = {
    x: point.clientX, rectW: rect.width,
    leftPx: (state.cz.textX / 100) * rect.width,
    wPx: (state.cz.textW / 100) * rect.width,
  };
}
function czTextHandleDragMove(evt) {
  const side = state.cz.resizingTextSide;
  if (!side) return;
  const point = evt.touches ? evt.touches[0] : evt;
  const d = state.cz.textResizeStart;
  const dx = point.clientX - d.x;
  let newLeftPx = d.leftPx;
  let newWPx = d.wPx;
  if (side === "e") {
    newWPx = Math.max(30, d.wPx + dx);
  } else {
    newWPx = Math.max(30, d.wPx - dx);
    newLeftPx = d.leftPx + (d.wPx - newWPx);
  }
  state.cz.textX = (newLeftPx / d.rectW) * 100;
  state.cz.textW = (newWPx / d.rectW) * 100;
  const box = document.getElementById("czTextBox");
  if (box) { box.style.left = state.cz.textX + "%"; box.style.width = state.cz.textW + "%"; }
}
function czTextHandleDragEnd() {
  state.cz.resizingTextSide = null;
  state.cz.textResizeStart = null;
}

function czGlobalMove(evt) {
  if (state.cz.draggingPhoto) {
    evt.preventDefault();
    const point = evt.touches ? evt.touches[0] : evt;
    const preview = document.getElementById("czPreview");
    const rect = preview.getBoundingClientRect();
    const dxPct = ((point.clientX - state.cz.dragStartPhoto.x) / rect.width) * 100;
    const dyPct = ((point.clientY - state.cz.dragStartPhoto.y) / rect.height) * 100;
    state.cz.photoX = state.cz.dragStartPhoto.photoX + dxPct;
    state.cz.photoY = state.cz.dragStartPhoto.photoY + dyPct;
    applyPhotoBoxStyle();
  } else if (state.cz.draggingText) {
    evt.preventDefault();
    czTextDragMove(evt);
  } else if (state.cz.resizingCorner) {
    evt.preventDefault();
    czCornerDragMove(evt);
  } else if (state.cz.resizingTextSide) {
    evt.preventDefault();
    czTextHandleDragMove(evt);
  }
}
function czGlobalEnd() {
  if (state.cz.draggingPhoto) {
    state.cz.draggingPhoto = false;
    const box = document.getElementById("czPhotoBox");
    if (box) box.classList.remove("dragging");
  }
  if (state.cz.draggingText) {
    state.cz.draggingText = false;
    const box = document.getElementById("czTextBox");
    if (box) box.classList.remove("dragging");
  }
  if (state.cz.resizingCorner) czCornerDragEnd();
  if (state.cz.resizingTextSide) czTextHandleDragEnd();
}
// document-level listeners so a fast drag that leaves the element still tracks
document.addEventListener("mousemove", (e) => { if (state.cz && (state.cz.draggingPhoto || state.cz.draggingText || state.cz.resizingCorner || state.cz.resizingTextSide)) czGlobalMove(e); });
document.addEventListener("mouseup", (e) => { if (state.cz) czGlobalEnd(e); });
document.addEventListener("touchmove", (e) => { if (state.cz && (state.cz.draggingPhoto || state.cz.draggingText || state.cz.resizingCorner || state.cz.resizingTextSide)) czGlobalMove(e); }, { passive: false });
document.addEventListener("touchend", (e) => { if (state.cz) czGlobalEnd(e); });

function addCustomCalendarToCart() {
  const p = PRODUCTS.find((x) => x.id === state.cz.productId);
  if (!p) return;
  if (!state.cz.photo && !state.cz.text) {
    toast("Ajoutez au moins une photo ou un texte avant de valider.");
    return;
  }
  state.cart.push({
    lineId: uid(),
    productId: p.id,
    name: p.name,
    price: p.price,
    qty: 1,
    thumb: state.cz.photo || p.images[0],
    customization: {
      photo: state.cz.photo,
      photoX: state.cz.photoX, photoY: state.cz.photoY,
      photoW: state.cz.photoW, photoH: state.cz.photoH,
      bgColor: state.cz.bgColor,
      text: state.cz.text,
      textColor: state.cz.textColor,
      fontFamily: state.cz.fontFamily,
      fontSize: state.cz.fontSize,
      textX: state.cz.textX,
      textY: state.cz.textY,
      textW: state.cz.textW,
      frame: state.cz.frame,
    },
  });
  toast("Calendrier personnalisé ajouté au panier ✓");
  state.cz = null;
  navigate({ name: "cart" });
}

// ---------------- Cart ----------------
function renderCart() {
  if (state.cart.length === 0) {
    return `
    <div class="page">
      <h1 class="pd-title serif">Votre panier</h1>
      <div class="empty-state">
        <p>Votre panier est vide.</p>
        <button class="btn" onclick="navigate({name:'home'})">Découvrir la boutique</button>
      </div>
    </div>`;
  }

  const items = state.cart
    .map((item) => {
      const custom = item.customization
        ? `<p>${item.customization.text ? "Texte : " + esc(item.customization.text) : "Personnalisation photo"}${item.customization.frame !== "none" ? " · Cadre : " + item.customization.frame : ""}</p>`
        : "";
      return `
      <div class="cart-item">
        <img src="${item.thumb}" alt=""/>
        <div class="ci-info">
          <h4>${esc(item.name)}</h4>
          ${custom}
          <p>${money(item.price)} / unité</p>
        </div>
        <div class="qty-control">
          <button onclick="changeQty('${item.lineId}', -1)">−</button>
          <span>${item.qty}</span>
          <button onclick="changeQty('${item.lineId}', 1)">+</button>
        </div>
        <button class="btn secondary small" onclick="removeFromCart('${item.lineId}')">Retirer</button>
      </div>`;
    })
    .join("");

  return `
    <div class="page">
      <h1 class="pd-title serif">Votre panier</h1>
      ${items}
      <div class="cart-summary"><span>Total</span><span>${money(cartTotal())}</span></div>
      <button class="btn full" style="margin-top:24px;" onclick="navigate({name:'checkout'})">Passer commande</button>
      <p class="hint" style="text-align:center; margin-top:10px;">Aucun compte requis pour commander.</p>
    </div>`;
}

function changeQty(lineId, delta) {
  const item = state.cart.find((i) => i.lineId === lineId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) state.cart = state.cart.filter((i) => i.lineId !== lineId);
  render();
}
function removeFromCart(lineId) {
  state.cart = state.cart.filter((i) => i.lineId !== lineId);
  render();
}

// ---------------- Checkout (no account) ----------------
function renderCheckout() {
  if (state.cart.length === 0) {
    navigate({ name: "cart" });
    return "";
  }
  return `
    <div class="page-narrow">
      <h1 class="pd-title serif">Finaliser ma commande</h1>
      <p class="hint" style="margin-bottom:20px;">Pas besoin de créer de compte — remplissez simplement vos coordonnées.</p>
      <form id="checkoutForm" onsubmit="submitOrder(event)">
        <div class="form-field full">
          <label>Pays de livraison *</label>
          <div class="country-pills country-pills-checkout">
            <button type="button" class="country-pill ${state.country === "france" ? "active" : ""}" onclick="setCheckoutCountry('france', this)">🇫🇷 France</button>
            <button type="button" class="country-pill ${state.country === "israel" ? "active" : ""}" onclick="setCheckoutCountry('israel', this)">🇮🇱 Israël</button>
          </div>
          <input type="hidden" name="country" id="checkoutCountryInput" value="${state.country || ""}"/>
        </div>
        <div class="form-grid">
          <div class="form-field"><label>Prénom *</label><input type="text" name="firstName" required/></div>
          <div class="form-field"><label>Nom *</label><input type="text" name="lastName" required/></div>
          <div class="form-field"><label>Email *</label><input type="email" name="email" required/></div>
          <div class="form-field"><label>Téléphone *</label><input type="tel" name="phone" required/></div>
          <div class="form-field full"><label>Adresse</label><input type="text" name="address"/></div>
          <div class="form-field"><label>Ville</label><input type="text" name="city"/></div>
          <div class="form-field"><label>Code postal</label><input type="text" name="zip"/></div>
          <div class="form-field full"><label>Remarques / demandes spécifiques</label><textarea name="notes" placeholder="Ex : couleur souhaitée, date limite..."></textarea></div>
        </div>
        <div class="cart-summary" style="margin-top:6px;"><span>Total</span><span>${money(cartTotal())}</span></div>
        <button type="submit" class="btn full" style="margin-top:20px;">Valider ma commande</button>
      </form>
    </div>`;
}

function setCheckoutCountry(c, btnEl) {
  state.country = c;
  try { localStorage.setItem("blesslev_country", c); } catch (e) {}
  document.querySelectorAll(".country-pills-checkout .country-pill").forEach((btn) => btn.classList.remove("active"));
  if (btnEl) btnEl.classList.add("active");
  const hidden = document.getElementById("checkoutCountryInput");
  if (hidden) hidden.value = c;
}

async function submitOrder(evt) {
  evt.preventDefault();
  const form = evt.target;
  const fd = new FormData(form);

  const country = fd.get("country");
  if (!country) {
    toast("Merci d'indiquer votre pays de livraison (France ou Israël).");
    return;
  }

  const customer = {
    firstName: fd.get("firstName").trim(),
    lastName: fd.get("lastName").trim(),
    email: fd.get("email").trim(),
    phone: fd.get("phone").trim(),
    address: fd.get("address").trim(),
    city: fd.get("city").trim(),
    zip: fd.get("zip").trim(),
    notes: fd.get("notes").trim(),
    country, // "france" | "israel"
  };

  const order = {
    id: uid(),
    createdAt: Date.now(),
    status: "attente", // attente | impression | fini
    customer,
    items: state.cart.map((i) => ({
      name: i.name,
      qty: i.qty,
      price: i.price,
      customization: i.customization
        ? { ...i.customization, hasPhoto: !!i.customization.photo }
        : null,
    })),
    total: cartTotal(),
  };

  const submitBtn = form.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  submitBtn.textContent = "Envoi en cours...";

  const ok = await saveOrder(order);

  if (!ok) {
    toast("Une erreur est survenue, réessayez.");
    submitBtn.disabled = false;
    submitBtn.textContent = "Valider ma commande";
    return;
  }

  // The server sends the merchant notification email automatically as part
  // of saving the order (see routes/orders.js) — nothing to trigger here.

  state.cart = [];
  navigate({ name: "confirmation", order });
}

function renderConfirmation(order) {
  const itemsRows = order.items
    .map((i) => `<div class="recap-row"><span>${esc(i.name)} × ${i.qty}</span><span>${money(i.price * i.qty)}</span></div>`)
    .join("");

  return `
    <div class="page-narrow">
      <div class="confirm-box">
        <div class="confirm-icon">✅</div>
        <h1 class="pd-title serif">Merci ${esc(order.customer.firstName)} !</h1>
        <p class="hint">Votre commande a bien été enregistrée.</p>
      </div>

      <div class="order-recap">
        <h4>Récapitulatif de commande</h4>
        ${itemsRows}
        <div class="recap-row" style="border-bottom:none; font-weight:bold; padding-top:10px;"><span>Total</span><span>${money(order.total)}</span></div>
      </div>

      <div class="info-banner">
        📩 Un récapitulatif vient de vous être présenté ci-dessus. Notre équipe va traiter votre commande et <strong>vous recontactera sous 48h</strong> pour la confirmer et organiser le règlement / la livraison.
      </div>

      <button class="btn full secondary" style="margin-top:24px;" onclick="navigate({name:'home'})">Retour à la boutique</button>
    </div>`;
}

// ---------------- Admin ----------------
const STATUS_LABELS = { attente: "En attente de contact", impression: "En impression", fini: "Finis" };
const COUNTRY_LABELS = { france: "🇫🇷 France", israel: "🇮🇱 Israël" };
let adminOrders = [];
let adminOrdersLoaded = false;
let adminSessionChecked = false;
let adminFilter = "all";
let adminCountryFilter = "all"; // all | france | israel
let adminSelected = new Set();
let adminModalOrderId = null;
let adminVisualCache = {}; // key: `${orderId}:${itemIndex}` -> PNG data URL

function getFilteredOrders() {
  return adminOrders.filter((o) => {
    const statusOk = adminFilter === "all" || o.status === adminFilter;
    const countryOk = adminCountryFilter === "all" || o.customer.country === adminCountryFilter;
    return statusOk && countryOk;
  });
}

function renderAdmin() {
  if (!adminUnlocked) {
    return `
    <div class="page">
      <div class="admin-login">
        <h2 class="serif">Espace commerçant</h2>
        <p class="hint" style="margin-bottom:16px;">Connexion sécurisée.</p>
        ${adminLoginError ? `<p class="hint" style="color:var(--danger); margin-bottom:10px;">${esc(adminLoginError)}</p>` : ""}
        <input type="text" id="adminUsernameInput" placeholder="Identifiant" autocomplete="username"
          onkeydown="if(event.key==='Enter') document.getElementById('adminPasswordInput').focus()"
          style="padding:11px 12px;border:1px solid var(--border);border-radius:8px;width:100%;margin-bottom:10px;font-family:inherit;"/>
        <input type="password" id="adminPasswordInput" placeholder="Mot de passe" autocomplete="current-password"
          onkeydown="if(event.key==='Enter') tryAdminLogin()"
          style="padding:11px 12px;border:1px solid var(--border);border-radius:8px;width:100%;margin-bottom:12px;font-family:inherit;"/>
        <button class="btn full" id="adminLoginBtn" onclick="tryAdminLogin()">Entrer</button>
      </div>
    </div>`;
  }

  const filtered = getFilteredOrders();

  const cards = filtered
    .map((o) => {
      const itemsHtml = o.items
        .map((i) => {
          const custom = i.customization
            ? ` ${i.customization.hasPhoto ? '<img class="mini-thumb" src="' + i.customization.photo + '"/>' : ""} ${i.customization.text ? "— texte : " + esc(i.customization.text) : ""} ${i.customization.frame && i.customization.frame !== "none" ? "— cadre : " + i.customization.frame : ""}`
            : "";
          return `<div>• ${esc(i.name)} × ${i.qty} — ${money(i.price * i.qty)}${custom}</div>`;
        })
        .join("");

      const mailBody = encodeURIComponent(
        `Bon de commande BLESSLEV\n\nCommande n°${o.id}\nDate : ${new Date(o.createdAt).toLocaleString("fr-FR")}\nPays : ${COUNTRY_LABELS[o.customer.country] || "-"}\n\nClient : ${o.customer.firstName} ${o.customer.lastName}\nEmail : ${o.customer.email}\nTéléphone : ${o.customer.phone}\nAdresse : ${o.customer.address}, ${o.customer.zip} ${o.customer.city}\nRemarques : ${o.customer.notes || "-"}\n\nArticles :\n${o.items.map((i) => `- ${i.name} x${i.qty} (${i.price.toFixed(2)}€)${i.customization && i.customization.text ? " | texte: " + i.customization.text : ""}`).join("\n")}\n\nTotal : ${o.total.toFixed(2)}€`
      );
      const clientMailBody = encodeURIComponent(
        `Bonjour ${o.customer.firstName},\n\nMerci pour votre commande chez BLESSLEV (n°${o.id}).\nNous revenons vers vous très prochainement.\n\nBLESSLEV`
      );

      return `
      <div class="order-card">
        <div class="order-card-top">
          <div style="display:flex; align-items:center; gap:10px;">
            <label class="order-select" onclick="event.stopPropagation()">
              <input type="checkbox" ${adminSelected.has(o.id) ? "checked" : ""} onchange="toggleOrderSelect('${o.id}', this.checked)"/>
            </label>
            <div class="order-card-clickzone" onclick="openOrderModal('${o.id}')">
              <div class="order-id">#${o.id}</div>
              <div class="order-date">${new Date(o.createdAt).toLocaleString("fr-FR")}</div>
            </div>
          </div>
          <div>
            <span class="country-badge">${COUNTRY_LABELS[o.customer.country] || "—"}</span>
            <span class="status-pill ${o.status}">${STATUS_LABELS[o.status]}</span>
          </div>
        </div>
        <div class="order-customer" onclick="openOrderModal('${o.id}')" style="cursor:pointer;">
          <strong>${esc(o.customer.firstName)} ${esc(o.customer.lastName)}</strong><br/>
          ${esc(o.customer.email)} · ${esc(o.customer.phone)}<br/>
          ${o.customer.address ? esc(o.customer.address) + ", " : ""}${esc(o.customer.zip)} ${esc(o.customer.city)}
          ${o.customer.notes ? `<br/><em>Note : ${esc(o.customer.notes)}</em>` : ""}
        </div>
        <div class="order-items">${itemsHtml}</div>
        <div style="font-weight:bold; margin-top:6px;">Total : ${money(o.total)}</div>

        <div class="mailto-actions">
          <button class="btn secondary small" onclick="openOrderModal('${o.id}')">🖼️ Voir l'aperçu</button>
          <select class="status-select" onchange="changeOrderStatus('${o.id}', this.value)">
            ${Object.entries(STATUS_LABELS).map(([k, v]) => `<option value="${k}" ${o.status === k ? "selected" : ""}>${v}</option>`).join("")}
          </select>
          <a class="btn secondary small" href="mailto:${esc(o.customer.email)}?subject=${encodeURIComponent("Votre commande BLESSLEV #" + o.id)}&body=${clientMailBody}">✉️ Écrire au client</a>
          <a class="btn secondary small" href="mailto:?subject=${encodeURIComponent("Bon de commande #" + o.id)}&body=${mailBody}">📋 Bon de commande (email)</a>
        </div>
      </div>`;
    })
    .join("");

  const tabs = [
    { id: "all", label: "Toutes" },
    { id: "attente", label: STATUS_LABELS.attente },
    { id: "impression", label: STATUS_LABELS.impression },
    { id: "fini", label: STATUS_LABELS.fini },
  ]
    .map((t) => `<button class="status-tab ${adminFilter === t.id ? "active" : ""}" onclick="setAdminFilter('${t.id}')">${t.label}</button>`)
    .join("");

  const countryTabs = [
    { id: "all", label: "Tous pays" },
    { id: "france", label: COUNTRY_LABELS.france },
    { id: "israel", label: COUNTRY_LABELS.israel },
  ]
    .map((t) => `<button class="status-tab country-tab ${adminCountryFilter === t.id ? "active" : ""}" onclick="setAdminCountryFilter('${t.id}')">${t.label}</button>`)
    .join("");

  const selectedCount = adminSelected.size;

  return `
    <div class="page">
      <div class="admin-header">
        <h1 class="pd-title serif" style="margin:0;">Commandes</h1>
        <div style="display:flex; gap:10px;">
          <button class="btn secondary small" onclick="adminLogout()">Se déconnecter</button>
          <button class="btn secondary small" onclick="navigate({name:'home'})">← Retour boutique</button>
        </div>
      </div>
      <div class="status-tabs">${tabs}</div>
      <div class="status-tabs">${countryTabs}</div>

      ${filtered.length > 0 ? `
      <div class="bulk-bar">
        <label class="order-select-all">
          <input type="checkbox" ${selectedCount > 0 && selectedCount === filtered.length ? "checked" : ""} onchange="toggleSelectAll(this.checked)"/>
          Tout sélectionner
        </label>
        ${selectedCount > 0 ? `
          <span class="hint" style="margin:0;">${selectedCount} commande${selectedCount > 1 ? "s" : ""} sélectionnée${selectedCount > 1 ? "s" : ""}</span>
          <button class="btn small" onclick="downloadSelectedOrders()">⬇️ Télécharger la sélection</button>
        ` : ""}
      </div>` : ""}

      ${filtered.length === 0 ? '<div class="empty-state">Aucune commande dans cette catégorie.</div>' : cards}
    </div>
    ${adminModalOrderId ? renderOrderModal() : ""}`;
}

function renderOrderModal() {
  const o = adminOrders.find((x) => x.id === adminModalOrderId);
  if (!o) return "";

  const itemsHtml = o.items
    .map((it, i) => {
      const hasVisual = it.customization && (it.customization.hasPhoto || it.customization.text);
      if (!hasVisual) {
        return `<div class="modal-item"><div class="modal-item-name">${esc(it.name)} × ${it.qty} — ${money(it.price * it.qty)}</div></div>`;
      }
      const key = `${o.id}:${i}`;
      const url = adminVisualCache[key];
      return `
      <div class="modal-item">
        <div class="modal-item-name">${esc(it.name)} × ${it.qty} — ${money(it.price * it.qty)}</div>
        ${url
          ? `<img class="modal-visual" src="${url}" alt="Aperçu personnalisation"/>
             <a class="btn small" href="${url}" download="blesslev-commande-${o.id}-${i + 1}.png">⬇️ Télécharger cette image</a>`
          : `<div class="modal-visual-loading">Génération de l'aperçu…</div>`}
      </div>`;
    })
    .join("");

  return `
  <div class="modal-overlay" onclick="closeOrderModal()">
    <div class="modal-box" onclick="event.stopPropagation()">
      <button class="modal-close" onclick="closeOrderModal()">✕</button>
      <h2 class="serif" style="margin:0 0 4px;">Commande #${o.id}</h2>
      <div class="order-date" style="margin-bottom:14px;">${new Date(o.createdAt).toLocaleString("fr-FR")} · <span class="country-badge">${COUNTRY_LABELS[o.customer.country] || "—"}</span> <span class="status-pill ${o.status}">${STATUS_LABELS[o.status]}</span></div>
      <div class="order-customer" style="margin-bottom:6px;">
        <strong>${esc(o.customer.firstName)} ${esc(o.customer.lastName)}</strong><br/>
        ${esc(o.customer.email)} · ${esc(o.customer.phone)}<br/>
        ${o.customer.address ? esc(o.customer.address) + ", " : ""}${esc(o.customer.zip)} ${esc(o.customer.city)}
        ${o.customer.notes ? `<br/><em>Note : ${esc(o.customer.notes)}</em>` : ""}
      </div>
      <div class="modal-items">${itemsHtml}</div>
      <div style="font-weight:bold; margin-top:10px;">Total : ${money(o.total)}</div>
    </div>
  </div>`;
}

async function tryAdminLogin() {
  const usernameInput = document.getElementById("adminUsernameInput");
  const passwordInput = document.getElementById("adminPasswordInput");
  const btn = document.getElementById("adminLoginBtn");
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    adminLoginError = "Merci de renseigner l'identifiant et le mot de passe.";
    render();
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = "Connexion..."; }

  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      adminLoginError = "";
      adminUnlocked = true;
      loadAdminOrders();
    } else {
      adminLoginError = data.error || "Identifiant ou mot de passe incorrect.";
      if (btn) { btn.disabled = false; btn.textContent = "Entrer"; }
      render();
    }
  } catch (e) {
    adminLoginError = "Erreur de connexion au serveur. Vérifiez que le serveur tourne bien.";
    if (btn) { btn.disabled = false; btn.textContent = "Entrer"; }
    render();
  }
}

// On landing on the admin page, check whether we already have a valid
// session (the httpOnly cookie survives page reloads within its 12h window)
// so the merchant isn't asked to log in again on every visit.
async function checkAdminSession() {
  try {
    const res = await fetch("/api/admin/me", { credentials: "include" });
    if (res.ok) {
      adminUnlocked = true;
      loadAdminOrders();
    } else {
      adminUnlocked = false;
      render();
    }
  } catch (e) {
    adminUnlocked = false;
    render();
  }
}

async function adminLogout() {
  try {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
  } catch (e) {}
  adminUnlocked = false;
  adminOrdersLoaded = false;
  adminOrders = [];
  navigate({ name: "home" });
}

async function loadAdminOrders() {
  adminOrders = await listOrders();
  adminOrdersLoaded = true;
  render();
}
function setAdminFilter(id) {
  adminFilter = id;
  render();
}
function setAdminCountryFilter(id) {
  adminCountryFilter = id;
  render();
}
async function changeOrderStatus(id, status) {
  await updateOrderStatus(id, status);
  const o = adminOrders.find((x) => x.id === id);
  if (o) o.status = status;
  render();
  toast("Statut mis à jour ✓");
}

function toggleOrderSelect(id, checked) {
  if (checked) adminSelected.add(id);
  else adminSelected.delete(id);
  render();
}
function toggleSelectAll(checked) {
  const filtered = getFilteredOrders();
  if (checked) filtered.forEach((o) => adminSelected.add(o.id));
  else filtered.forEach((o) => adminSelected.delete(o.id));
  render();
}

function openOrderModal(id) {
  adminModalOrderId = id;
  render();
  loadOrderVisuals(id);
}
function closeOrderModal() {
  adminModalOrderId = null;
  render();
}

// ---- Reconstruct the exact customized-calendar visual (photo + frame + text
// + fixed ink/black-square layers) off-screen, then rasterize it to a PNG so
// the merchant can preview and download it. ----
function buildCalendarVisualNode(customization) {
  const c = customization;
  const wrap = document.createElement("div");
  wrap.className = "cz-preview cz-preview-offscreen";
  wrap.style.position = "fixed";
  wrap.style.left = "-99999px";
  wrap.style.top = "0";
  wrap.style.width = "900px";
  wrap.style.maxWidth = "none";
  wrap.style.background = c.bgColor || "#efe9e0";

  let html = "";
  if (c.photo) {
    html += `<div class="cz-photo-box" style="left:${c.photoX}%; top:${c.photoY}%; width:${c.photoW}%; height:${c.photoH}%;">
      <img src="${c.photo}"/>
    </div>`;
  }
  html += `<div class="cz-frame-layer">${c.frame && c.frame !== "none" ? frameSVG(c.frame) : ""}</div>`;
  if (c.text) {
    html += `<div class="cz-text-box" style="left:${c.textX}%; top:${c.textY}%; width:${c.textW}%;">
      <div class="cz-text-layer" style="color:${c.textColor}; font-size:${c.fontSize}px; font-family:${c.fontFamily}; padding:0;">${esc(c.text)}</div>
    </div>`;
  }
  html += `<div class="cz-ink-layer"><img src="img/ink_overlay.png"/></div>`;
  html += `<div class="cz-black-mask"><img src="img/black_mask.png"/></div>`; // no edit-mode class -> fully opaque, true final result

  wrap.innerHTML = html;
  document.body.appendChild(wrap);
  return wrap;
}
function waitForImages(container) {
  const imgs = Array.from(container.querySelectorAll("img"));
  return Promise.all(
    imgs.map((img) => (img.complete ? Promise.resolve() : new Promise((res) => { img.onload = res; img.onerror = res; })))
  );
}
async function renderCalendarVisualDataURL(customization) {
  const node = buildCalendarVisualNode(customization);
  await waitForImages(node);
  const canvas = await html2canvas(node, { backgroundColor: "#efe9e0", scale: 2 });
  node.remove();
  return canvas.toDataURL("image/png");
}

async function loadOrderVisuals(id) {
  const order = adminOrders.find((o) => o.id === id);
  if (!order) return;
  for (let i = 0; i < order.items.length; i++) {
    const it = order.items[i];
    if (it.customization && (it.customization.hasPhoto || it.customization.text)) {
      const key = `${id}:${i}`;
      if (!adminVisualCache[key]) {
        try {
          adminVisualCache[key] = await renderCalendarVisualDataURL(it.customization);
          if (adminModalOrderId === id) render();
        } catch (e) {
          console.error("Erreur génération aperçu", e);
        }
      }
    }
  }
}

async function downloadSelectedOrders() {
  if (adminSelected.size === 0) return;
  toast("Préparation du téléchargement…");
  const zip = new JSZip();

  for (const id of adminSelected) {
    const order = adminOrders.find((o) => o.id === id);
    if (!order) continue;
    const folder = zip.folder(`commande-${order.id}`);

    let summary =
      `Commande BLESSLEV #${order.id}\n` +
      `Date : ${new Date(order.createdAt).toLocaleString("fr-FR")}\n` +
      `Statut : ${STATUS_LABELS[order.status]}\n\n` +
      `Client : ${order.customer.firstName} ${order.customer.lastName}\n` +
      `Email : ${order.customer.email}\n` +
      `Téléphone : ${order.customer.phone}\n` +
      `Adresse : ${order.customer.address || "-"}, ${order.customer.zip || ""} ${order.customer.city || ""}\n` +
      `Remarques : ${order.customer.notes || "-"}\n\n` +
      `Articles :\n`;

    for (let i = 0; i < order.items.length; i++) {
      const it = order.items[i];
      summary += `- ${it.name} x${it.qty} (${it.price.toFixed(2)}€)${it.customization && it.customization.text ? " | texte : " + it.customization.text : ""}\n`;

      if (it.customization && (it.customization.hasPhoto || it.customization.text)) {
        const key = `${order.id}:${i}`;
        if (!adminVisualCache[key]) {
          try {
            adminVisualCache[key] = await renderCalendarVisualDataURL(it.customization);
          } catch (e) {
            console.error(e);
          }
        }
        const dataUrl = adminVisualCache[key];
        if (dataUrl) {
          const base64 = dataUrl.split(",")[1];
          folder.file(`visuel-${i + 1}.png`, base64, { base64: true });
        }
      }
    }
    summary += `\nTotal : ${order.total.toFixed(2)}€\n`;
    folder.file("commande.txt", summary);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `blesslev-commandes-${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast("Téléchargement prêt ✓");
}

// ---------------- Router / render ----------------
function render() {
  const r = state.route;
  let body = "";
  if (r.name === "home") body = renderHome();
  else if (r.name === "product") body = renderProduct(r.id);
  else if (r.name === "customize") body = renderCustomize(r.id);
  else if (r.name === "cart") body = renderCart();
  else if (r.name === "checkout") body = renderCheckout();
  else if (r.name === "confirmation") body = renderConfirmation(r.order);
  else if (r.name === "admin") {
    body = renderAdmin();
    if (!adminSessionChecked) {
      adminSessionChecked = true;
      checkAdminSession();
    }
  } else body = renderHome();

  root.innerHTML = renderHeader() + body + renderFooter();
}

// intercept product "customize" entry point (button in product page calls navigate directly with name 'customize',
// so make sure state.cz gets initialized the first time we land there)
const _origNavigate = navigate;
navigate = function (route) {
  if (route.name === "customize" && (!state.cz || state.cz.productId !== route.id)) {
    state.cz = freshCzState(route.id);
  }
  if (route.name === "admin") {
    adminSessionChecked = false; // re-verify the session each time we freshly enter this page
  }
  // The admin page has no visible link anywhere on the site — it's only reachable
  // by knowing this address. Keep the URL in sync so it's bookmarkable privately.
  if (route.name === "admin") {
    history.replaceState(null, "", "#admin");
  } else if (location.hash === "#admin") {
    history.replaceState(null, "", location.pathname + location.search);
  }
  _origNavigate(route);
};

// Secret entry point: visiting the site with #admin in the address bar opens
// the merchant page directly. Nothing on the visible site links to it.
if (window.location.hash === "#admin") {
  state.route = { name: "admin" };
}
window.addEventListener("hashchange", () => {
  if (window.location.hash === "#admin") navigate({ name: "admin" });
});

render();
