const fs = require("fs").promises;
const path = require("path");
const emailer = require("./email");
const db = require("./db");

const PROOFS_DIR = process.env.PROOFS_DIR || "/Users/jackmasarik/plumfield/plumfield publishing/proofs";

async function proofSync() {
  if (!PROOFS_DIR) {
    console.error("[Sync] PROOFS_DIR not set");
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
        // Skip inaccessible files
      }
    }

    const discoveredIds = new Set();
    const selectStmt = db.prepare("SELECT 1 FROM proofs WHERE id = ?");
    const insertStmt = db.prepare(
      `INSERT INTO proofs (id, book_title, created_at, updated_at)
       VALUES (?, ?, ?, ?)`
    );

    // Process new files individually to avoid long-running transactions
    for (const file of pdfs) {
      const id = file.replace(/\.pdf$/, "");
      discoveredIds.add(id);

      const exists = selectStmt.get(id);
      if (!exists) {
        console.log(`[Sync] New proof discovered: ${id}`);
        insertStmt.run(id, id, Date.now(), Date.now());
        
        // Note: emailer is async and won't block
        emailer("start", id);
      }
    }

    // Clean up stale proofs
    const dbRows = db.prepare("SELECT id FROM proofs").all();
    const deleteStmt = db.prepare("DELETE FROM proofs WHERE id = ?");
    
    for (const row of dbRows) {
      if (!discoveredIds.has(row.id)) {
        console.log(`[Sync] Removing stale proof: ${row.id}`);
        deleteStmt.run(row.id);
      }
    }

    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`[Sync] Warning: Heavy sync took ${duration}ms`);
    }
  } catch (err) {
    console.error("[Sync] Error during sync logic:", err);
  }
}

module.exports = proofSync;
