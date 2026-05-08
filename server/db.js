const Database = require('better-sqlite3');
const path = require('path');

// Open the database
const db = new Database(path.join(__dirname, 'database.sqlite'), {
  verbose: console.log // Enable detailed SQL debugging
});

// CRITICAL: Enable WAL (Write-Ahead Logging) mode.
db.pragma('journal_mode = WAL');

// Set a longer busy timeout (10 seconds) to handle concurrent access better.
db.pragma('busy_timeout = 10000');

db.exec(`
  CREATE TABLE IF NOT EXISTS proofs (
    id TEXT PRIMARY KEY,
    book_title TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

module.exports = db;
