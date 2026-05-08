const fs = require("fs").promises;
const path = require("path");
const emailer = require("./email");
const db = require("./db");

const PROOFS_DIR = process.env.PROOFS_DIR || "/Users/jackmasarik/plumfield/plumfield publishing/proofs";

async function proofSync() {
  if (!PROOFS_DIR) {
    console.error("PROOFS_DIR not set");
    return;
  }

  const start = Date.now();
  try {
    const files = await fs.readdir(PROOFS_DIR);
    const pdfs = [];

    for (const f of files) {
      const fullPath = path.join(PROOFS_DIR, f);
      try {
        const stats = await fs.stat(fullPath);
        if (
          stats.isFile() &&
          f.endsWith(".pdf") &&
          !f.endsWith(".ed.pdf") &&
          !f.endsWith(".ed.draft.pdf") &&
          !f.endsWith(".diane.pdf") &&
          !f.endsWith(".sara.pdf") &&
          !f.endsWith(".kristi.pdf") &&
          !f.endsWith(".done.pdf") &&
          !f.startsWith("temp-work-")
        ) {
          pdfs.push(f);
        }
      } catch (e) {
        // Skip files that can't be stat'd
      }
    }

    const discoveredIds = new Set();
    for (const file of pdfs) {
      const id = file.replace(/\.pdf$/, "");
      discoveredIds.add(id);

      const exists = db.prepare("SELECT 1 FROM proofs WHERE id = ?").get(id);
      if (!exists) {
        console.log(`[Sync] New proof discovered: ${id}`);
        db.prepare(
          `INSERT INTO proofs (id, book_title, created_at, updated_at)
           VALUES (?, ?, ?, ?)`,
        ).run(id, id, Date.now(), Date.now());
        emailer("start", id);
      }
    }

    const dbRows = db.prepare("SELECT id FROM proofs").all();
    for (const row of dbRows) {
      if (!discoveredIds.has(row.id)) {
        console.log(`[Sync] Removing stale proof: ${row.id}`);
        db.prepare("DELETE FROM proofs WHERE id = ?").run(row.id);
      }
    }

    const duration = Date.now() - start;
    if (duration > 500) {
      console.warn(`[Sync] Warning: Sync took ${duration}ms`);
    }
  } catch (err) {
    console.error("[Sync] Error during sync:", err);
  }
}

module.exports = proofSync;
