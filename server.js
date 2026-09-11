// Local development entry point — NOT used by Vercel (Vercel calls api/index.js
// directly as a serverless function). This file exists so you can still run
// the site on your own computer with a plain, familiar `npm start`.
const app = require("./api/index.js");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ BLESSLEV server running on http://localhost:${PORT}`);
});
