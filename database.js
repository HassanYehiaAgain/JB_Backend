const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./users.db');

db.serialize(() => {
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
    if (!row) {
      db.run(`CREATE TABLE users (
               id       INTEGER PRIMARY KEY AUTOINCREMENT,
               nickname TEXT NOT NULL,
               email    TEXT UNIQUE NOT NULL,
               password TEXT,
               score    INTEGER DEFAULT 0
             )`);
    } else {
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