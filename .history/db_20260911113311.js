const { MongoClient } = require("mongodb");

// Serverless-friendly pattern: connect lazily on first use, then reuse the
// same connection for the lifetime of the running process (on Vercel, that
// means it's reused across requests handled by the same warm function
// instance — this avoids opening a brand new MongoDB connection on every
// single request, which would otherwise be slow and could exhaust your
// MongoDB Atlas connection limit).
let clientPromise = null;
let indexesEnsured = false;

function getClientPromise() {
  if (!clientPromise) {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI manquant — configurez vos variables d'environnement (voir le README).");
    }
    const client = new MongoClient(process.env.MONGODB_URI, {
      // Forces IPv4 for the underlying socket connections. Vercel functions
      // run on AWS Lambda, where IPv6 resolution to MongoDB Atlas shard
      // hosts is sometimes broken and manifests as a confusing generic TLS
      // handshake error ("tlsv1 alert internal error") rather than a clear
      // network error — forcing IPv4 is the standard, well-documented fix.
      family: 4,
      serverSelectionTimeoutMS: 8000, // fail fast instead of hanging for ~30s
      retryWrites: true,
    });
    clientPromise = client.connect();
  }
  return clientPromise;
}

async function getDB() {
  let client;
  try {
    client = await getClientPromise();
  } catch (e) {
    // Don't leave a broken connection attempt cached — let the next request
    // try fresh instead of repeating the same failure forever.
    clientPromise = null;
    throw e;
  }
  const db = client.db(process.env.MONGODB_DB_NAME || "blesslev");

  if (!indexesEnsured) {
    indexesEnsured = true;
    // Helpful indexes for the admin dashboard (sorting/filtering by date,
    // status, country). Fire-and-forget: if these fail for any reason
    // (e.g. insufficient permissions), the site still works fine, just
    // slightly less optimized on large order volumes.
    db.collection("orders").createIndex({ createdAt: -1 }).catch(() => {});
    db.collection("orders").createIndex({ status: 1 }).catch(() => {});
    db.collection("orders").createIndex({ "customer.country": 1 }).catch(() => {});
  }

  return db;
}

module.exports = { getDB };