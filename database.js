
// database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to DB file
const dbPath = path.join(__dirname, 'survey.db');
const db = new sqlite3.Database(dbPath);

// Create table if not exists
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      question1 TEXT,
      question2 TEXT,
      question3 TEXT,
      question4 TEXT,
      question5 TEXT,
      question6 TEXT,
      question7 TEXT,
      question8 TEXT,
      question9 TEXT,
      question10 TEXT,
      submittedAt TEXT
    )
  `);
});

module.exports = db;
