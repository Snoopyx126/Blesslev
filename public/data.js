// ---------------------------------------------------------------
// PRODUITS — à adapter/compléter facilement (prix, textes, photos)
// Pour changer une photo : remplace le fichier dans /img (même nom)
// ---------------------------------------------------------------
const PRODUCTS = [
  {
    id: "calendrier-5787",
    name: "Calendrier personnalisé 5787",
    price: 29,
    custom: true,
    shortDesc: "Votre calendrier juif personnalisé avec votre photo et votre texte.",
    desc: "Le calendrier BLESSLEV, personnalisable avec votre photo, votre texte et un cadre décoratif au choix. Idéal pour Roch Hachana, un mariage, une naissance ou tout événement à célébrer toute l'année.",
    images: ["img/p_calendrier_1.jpg", "img/p_calendrier_2.jpg"],
  },
  {
    id: "birkat-hamazon",
    name: "Livret Birkat Hamazon",
    price: 18,
    custom: false,
    shortDesc: "Livret de grâces après repas, personnalisable sur demande.",
    desc: "Un livret élégant de Birkat Hamazon, parfait pour vos tables de Shabbat ou vos événements. Personnalisation des couleurs et du texte de dédicace disponible sur demande en commentaire de commande.",
    images: ["img/p_birkathamazon_2.jpg", "img/p_birkathamazon_1.jpg"],
  },
  {
    id: "chants-shabbat",
    name: "Livret Chants de Shabbat",
    price: 18,
    custom: false,
    shortDesc: "Recueil des chants et prières du Shabbat, en édition soignée.",
    desc: "Recueil complet des Zemirot et chants de Shabbat, mis en page avec soin. Une pièce idéale à offrir ou à utiliser chaque semaine en famille.",
    images: ["img/p_chants_1.jpg", "img/p_chants_2.jpg"],
  },
  {
    id: "prieres-femme",
    name: "Livret Prières de la Femme",
    price: 18,
    custom: false,
    shortDesc: "Recueil de prières dédié, couverture illustrée.",
    desc: "Un recueil de prières pensé spécialement, avec une couverture illustrée délicate. Un joli cadeau pour toute occasion.",
    images: ["img/p_femmes_1.jpg"],
  },
  {
    id: "haggadah-pessah",
    name: "Haggadah de Pessah",
    price: 22,
    custom: false,
    shortDesc: "Haggadah illustrée pour votre Seder de Pessah.",
    desc: "Une Haggadah de Pessah à la mise en page soignée et illustrée, pour accompagner votre Seder en famille.",
    images: ["img/p_pessah_1.jpg"],
  },
  {
    id: "creations-sur-mesure",
    name: "Créations sur-mesure",
    price: 15,
    custom: false,
    shortDesc: "Sets de Havdala, marque-pages, cartons Pourim... sur demande.",
    desc: "Petites créations personnalisées : sets de Havdala, cartons pour Pourim, marque-pages et plus. Contactez-nous avec votre idée, nous l'imaginons ensemble.",
    images: ["img/p_havdala_1.jpg", "img/p_esther_1.jpg"],
  },
];

// -----------------------------------------------------------------
// CADRES DÉCORATIFS — pour le configurateur de calendrier.
// Chacun est un SVG dessiné en code (léger, net à toutes les tailles).
// Pour ajouter un cadre : copie un bloc "case" ci-dessous et adapte-le.
// -----------------------------------------------------------------
// -----------------------------------------------------------------
// POLICES D'ÉCRITURE — catalogue pour le texte personnalisé.
// "css" utilise le nom réel de la police (polices système : aucun
// chargement requis ; polices Google : importées dans index.html).
// Pour ajouter une police système : ajoute juste une ligne ici.
// Pour ajouter une police Google Fonts : ajoute la ligne ici ET
// ajoute son nom dans l'import Google Fonts au <head> de index.html.
// -----------------------------------------------------------------
const FONTS = [
  { group: "Classiques (système)", items: [
    { id: "times", label: "Times New Roman", css: "'Times New Roman', Times, serif" },
    { id: "georgia", label: "Georgia", css: "Georgia, serif" },
    { id: "garamond", label: "Garamond", css: "Garamond, 'EB Garamond', serif" },
    { id: "cambria", label: "Cambria", css: "Cambria, serif" },
    { id: "palatino", label: "Palatino", css: "'Palatino Linotype', Palatino, serif" },
    { id: "bookman", label: "Bookman", css: "'Bookman Old Style', serif" },
  ]},
  { group: "Modernes (système)", items: [
    { id: "arial", label: "Arial", css: "Arial, Helvetica, sans-serif" },
    { id: "helvetica", label: "Helvetica", css: "Helvetica, Arial, sans-serif" },
    { id: "verdana", label: "Verdana", css: "Verdana, sans-serif" },
    { id: "tahoma", label: "Tahoma", css: "Tahoma, sans-serif" },
    { id: "trebuchet", label: "Trebuchet MS", css: "'Trebuchet MS', sans-serif" },
    { id: "century-gothic", label: "Century Gothic", css: "'Century Gothic', sans-serif" },
    { id: "segoe", label: "Segoe UI", css: "'Segoe UI', sans-serif" },
    { id: "courier", label: "Courier New", css: "'Courier New', Courier, monospace" },
    { id: "impact", label: "Impact", css: "Impact, sans-serif" },
  ]},
  { group: "Manuscrites / calligraphie", items: [
    { id: "brush", label: "Brush Script MT", css: "'Brush Script MT', cursive" },
    { id: "lucida-hand", label: "Lucida Handwriting", css: "'Lucida Handwriting', cursive" },
    { id: "segoe-print", label: "Segoe Print", css: "'Segoe Print', cursive" },
    { id: "dancing", label: "Dancing Script", css: "'Dancing Script', cursive" },
    { id: "vibes", label: "Great Vibes", css: "'Great Vibes', cursive" },
    { id: "pacifico", label: "Pacifico", css: "'Pacifico', cursive" },
    { id: "sacramento", label: "Sacramento", css: "'Sacramento', cursive" },
    { id: "satisfy", label: "Satisfy", css: "'Satisfy', cursive" },
    { id: "parisienne", label: "Parisienne", css: "'Parisienne', cursive" },
    { id: "tangerine", label: "Tangerine", css: "'Tangerine', cursive" },
    { id: "caveat", label: "Caveat", css: "'Caveat', cursive" },
    { id: "indie-flower", label: "Indie Flower", css: "'Indie Flower', cursive" },
    { id: "shadows", label: "Shadows Into Light", css: "'Shadows Into Light', cursive" },
  ]},
  { group: "Élégantes", items: [
    { id: "playfair", label: "Playfair Display", css: "'Playfair Display', serif" },
    { id: "cormorant", label: "Cormorant Garamond", css: "'Cormorant Garamond', serif" },
    { id: "abril", label: "Abril Fatface", css: "'Abril Fatface', serif" },
    { id: "crimson", label: "Crimson Text", css: "'Crimson Text', serif" },
    { id: "merriweather", label: "Merriweather", css: "'Merriweather', serif" },
    { id: "alegreya", label: "Alegreya", css: "'Alegreya', serif" },
    { id: "eb-garamond", label: "EB Garamond", css: "'EB Garamond', serif" },
  ]},
  { group: "Amusantes / originales", items: [
    { id: "comic-sans", label: "Comic Sans MS", css: "'Comic Sans MS', 'Comic Sans', cursive" },
    { id: "papyrus", label: "Papyrus", css: "Papyrus, fantasy" },
    { id: "lobster", label: "Lobster", css: "'Lobster', cursive" },
    { id: "bebas", label: "Bebas Neue", css: "'Bebas Neue', sans-serif" },
    { id: "amatic", label: "Amatic SC", css: "'Amatic SC', sans-serif" },
    { id: "quicksand", label: "Quicksand", css: "'Quicksand', sans-serif" },
    { id: "josefin", label: "Josefin Sans", css: "'Josefin Sans', sans-serif" },
    { id: "raleway", label: "Raleway", css: "'Raleway', sans-serif" },
  ]},
  { group: "Hébraïques / thématiques", items: [
    { id: "david", label: "David Libre", css: "'David Libre', serif" },
    { id: "frank-ruhl", label: "Frank Ruhl Libre", css: "'Frank Ruhl Libre', serif" },
    { id: "suez", label: "Suez One", css: "'Suez One', serif" },
    { id: "assistant", label: "Assistant", css: "'Assistant', sans-serif" },
    { id: "rubik", label: "Rubik", css: "'Rubik', sans-serif" },
  ]},
];
// Version à plat, pratique pour retrouver une police par sa valeur css
const FONTS_FLAT = FONTS.flatMap(g => g.items);

const FRAMES = [
  { id: "none", label: "Aucun" },
  { id: "floral", label: "Floral" },
  { id: "gold-double", label: "Double liseré doré" },
  { id: "dots", label: "Pointillé rose" },
  { id: "star-corners", label: "Étoiles de David" },
  { id: "laurel", label: "Laurier" },
  { id: "scallop", label: "Festonné" },
  { id: "ribbon", label: "Rubans" },
  { id: "hearts", label: "Cœurs" },
  { id: "thin-classic", label: "Filet classique" },
];

function frameSVG(id) {
  const W = 300, H = 424; // ref viewbox ~ proportion of the page
  switch (id) {
    case "floral":
      return `<svg viewBox="0 0 300 424" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="284" height="408" fill="none" stroke="#c9a86a" stroke-width="2"/>
        <g fill="#d977b0" opacity="0.9">
          <circle cx="18" cy="18" r="7"/><circle cx="282" cy="18" r="7"/>
          <circle cx="18" cy="406" r="7"/><circle cx="282" cy="406" r="7"/>
        </g>
        <g stroke="#8fae7a" stroke-width="2" fill="none" opacity="0.85">
          <path d="M18 18 q16 12 0 26 M18 18 q-16 12 0 26"/>
          <path d="M282 18 q-16 12 0 26 M282 18 q16 12 0 26"/>
          <path d="M18 406 q16 -12 0 -26 M18 406 q-16 -12 0 -26"/>
          <path d="M282 406 q-16 -12 0 -26 M282 406 q16 -12 0 -26"/>
        </g>
      </svg>`;
    case "gold-double":
      return `<svg viewBox="0 0 300 424" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="280" height="404" fill="none" stroke="#b08d57" stroke-width="4"/>
        <rect x="18" y="18" width="264" height="388" fill="none" stroke="#b08d57" stroke-width="1"/>
      </svg>`;
    case "dots":
      return `<svg viewBox="0 0 300 424" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="280" height="404" fill="none" stroke="#d977b0" stroke-width="2.5" stroke-dasharray="7 7"/>
      </svg>`;
    case "star-corners": {
      const star = (cx, cy) => {
        const pts = [];
        for (let i = 0; i < 6; i++) {
          const a1 = (Math.PI / 3) * i - Math.PI / 2;
          const a2 = a1 + Math.PI / 3;
          pts.push(`M${cx + 11 * Math.cos(a1)} ${cy + 11 * Math.sin(a1)} L${cx + 11 * Math.cos(a2)} ${cy + 11 * Math.sin(a2)}`);
        }
        return pts.join(" ");
      };
      return `<svg viewBox="0 0 300 424" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="9" y="9" width="282" height="406" fill="none" stroke="#8fa4c9" stroke-width="1.5"/>
        <g stroke="#3a5a9c" stroke-width="2" fill="none">
          <path d="${star(20, 20)}"/><path d="${star(280, 20)}"/>
          <path d="${star(20, 404)}"/><path d="${star(280, 404)}"/>
        </g>
      </svg>`;
    }
    case "laurel":
      return `<svg viewBox="0 0 300 424" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#7c9a6a" stroke-width="1.8" fill="#7c9a6a" opacity="0.85">
          ${[0, 1, 2, 3, 4, 5].map(i => `<ellipse cx="${15 + i * 3}" cy="${20 + i * 22}" rx="6" ry="3" transform="rotate(-30 ${15 + i * 3} ${20 + i * 22})"/>`).join("")}
          ${[0, 1, 2, 3, 4, 5].map(i => `<ellipse cx="${285 - i * 3}" cy="${20 + i * 22}" rx="6" ry="3" transform="rotate(30 ${285 - i * 3} ${20 + i * 22})"/>`).join("")}
          ${[0, 1, 2, 3, 4, 5].map(i => `<ellipse cx="${15 + i * 3}" cy="${404 - i * 22}" rx="6" ry="3" transform="rotate(30 ${15 + i * 3} ${404 - i * 22})"/>`).join("")}
          ${[0, 1, 2, 3, 4, 5].map(i => `<ellipse cx="${285 - i * 3}" cy="${404 - i * 22}" rx="6" ry="3" transform="rotate(-30 ${285 - i * 3} ${404 - i * 22})"/>`).join("")}
        </g>
      </svg>`;
    case "scallop":
      return `<svg viewBox="0 0 300 424" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="280" height="404" fill="none" stroke="#c9a86a" stroke-width="1.5"/>
        <g fill="none" stroke="#c9a86a" stroke-width="1.5">
          ${Array.from({length: 14}, (_, i) => `<path d="M${10 + i*20} 10 q10 8 20 0"/>`).join("")}
          ${Array.from({length: 14}, (_, i) => `<path d="M${10 + i*20} 414 q10 -8 20 0"/>`).join("")}
        </g>
      </svg>`;
    case "ribbon":
      return `<svg viewBox="0 0 300 424" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="9" y="9" width="282" height="406" fill="none" stroke="#d977b0" stroke-width="1.5"/>
        <g fill="#d977b0">
          <path d="M14 14 l16 0 l-8 12 z"/><path d="M286 14 l-16 0 l8 12 z"/>
          <path d="M14 410 l16 0 l-8 -12 z"/><path d="M286 410 l-16 0 l8 -12 z"/>
        </g>
      </svg>`;
    case "hearts":
      return `<svg viewBox="0 0 300 424" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="280" height="404" fill="none" stroke="#e39ab8" stroke-width="1.5" stroke-dasharray="2 5"/>
        <g fill="#e39ab8">
          <path d="M20 16 c-3-5-11-4-11 2 c0 5 11 11 11 11 s11-6 11-11 c0-6-8-7-11-2 z"/>
          <path d="M280 16 c-3-5-11-4-11 2 c0 5 11 11 11 11 s11-6 11-11 c0-6-8-7-11-2 z"/>
          <path d="M20 408 c-3-5-11-4-11 2 c0 5 11 11 11 11 s11-6 11-11 c0-6-8-7-11-2 z"/>
          <path d="M280 408 c-3-5-11-4-11 2 c0 5 11 11 11 11 s11-6 11-11 c0-6-8-7-11-2 z"/>
        </g>
      </svg>`;
    case "thin-classic":
      return `<svg viewBox="0 0 300 424" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="12" y="12" width="276" height="400" fill="none" stroke="#4b453d" stroke-width="1"/>
      </svg>`;
    default:
      return "";
  }
}
