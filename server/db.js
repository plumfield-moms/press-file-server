const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../proofs/database.sqlite'));

db.exec(`
  CREATE TABLE IF NOT EXISTS proofs (
    id TEXT PRIMARY KEY,
    book_title TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

module.exports = db;
