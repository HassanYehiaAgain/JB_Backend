// database.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./users.db');

db.serialize(() => {
  // First check if the table exists
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
    if (!row) {
      // Create the table if it doesn't exist
      db.run(`CREATE TABLE users (
               id       INTEGER PRIMARY KEY AUTOINCREMENT,
               nickname TEXT NOT NULL,
               email    TEXT UNIQUE NOT NULL,
               password TEXT,
               score    INTEGER DEFAULT 0
             )`);
    } else {
      // Check if password column exists
      db.all("PRAGMA table_info(users)", (err, rows) => {
        if (err) {
          console.error("Error checking table structure:", err);
          return;
        }
        
        let hasPasswordColumn = false;
        if (rows) {
          hasPasswordColumn = rows.some(row => row.name === 'password');
        }
        
        if (!hasPasswordColumn) {
          // Add the password column if it doesn't exist
          db.run("ALTER TABLE users ADD COLUMN password TEXT", (err) => {
            if (err) {
              console.error("Error adding password column:", err);
            } else {
              console.log("Added password column to users table");
            }
          });
        }
      });
    }
  });
});

module.exports = db;