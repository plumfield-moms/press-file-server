const fs = require("fs");
const path = require("path");
const emailer = require("./email");

// Adjust this import if your DB file is elsewhere
const db = require("./db");

const PROOFS_DIR = process.env.PROOFS_DIR;
const ED_EMAIL = process.env.ED_EMAIL;

function getId(file) {
  return file.replace(/\.pdf$/, "");
}

function sendEmailToEd(id) {
  // Replace this with your real email implementation
  emailer("start", id);
}

function proofSync() {
  if (!PROOFS_DIR) {
    console.error("PROOFS_DIR not set");
    return;
  }

  let files;
  let pdfs;
  try {
    files = fs.readdirSync(PROOFS_DIR);
    pdfs = files.filter(
      (f) =>
        f.endsWith(".pdf") &&
        !f.endsWith(".ed.pdf") &&
        !f.endsWith(".ed.draft.pdf") &&
        !f.endsWith(".diane.pdf") &&
        !f.endsWith(".sara.pdf") &&
        !f.endsWith(".done.pdf") &&
        !f.startsWith("temp-work-") &&
        f !== "database.sqlite",
    );
  } catch (err) {
    console.error("Failed to read proofs directory:", err);
    return;
  }

  // --- Discover current proofs from filesystem ---
  const discoveredIds = new Set();

  for (const file of pdfs) {
    const id = getId(file);
    discoveredIds.add(id);

    const exists = db.prepare("SELECT 1 FROM proofs WHERE id = ?").get(id);

    if (!exists) {
      db.prepare(
        `INSERT INTO proofs (id, book_title, created_at, updated_at)
         VALUES (?, ?, ?, ?)`,
      ).run(id, id, Date.now(), Date.now());

      // Notify Ed immediately
      sendEmailToEd(id);
    }
  }

  // --- Cleanup stale DB entries ---
  const dbRows = db.prepare("SELECT id FROM proofs").all();

  for (const row of dbRows) {
    if (!discoveredIds.has(row.id)) {
      db.prepare("DELETE FROM proofs WHERE id = ?").run(row.id);
    }
  }
}

module.exports = proofSync;
