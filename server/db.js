const Database = require('better-sqlite3');
const path = require('path');

// Open the database
const db = new Database(path.join(__dirname, 'database.sqlite'), {
  // verbose: console.log // Uncomment for detailed SQL debugging
});

// CRITICAL: Enable WAL (Write-Ahead Logging) mode.
// This allows multiple readers and one writer to work concurrently,
// preventing the DB from locking up the entire server during background syncs.
db.pragma('journal_mode = WAL');

// Set a busy timeout. If the database is locked, it will wait up to 5 seconds
// before throwing a "database is busy" error, rather than blocking immediately.
db.pragma('busy_timeout = 5000');

db.exec(`
  CREATE TABLE IF NOT EXISTS proofs (
    id TEXT PRIMARY KEY,
    book_title TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

module.exports = db;
