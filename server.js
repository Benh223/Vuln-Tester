
// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve Survey.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Survey.html'));
});

// Handle form submission
app.post('/submit', (req, res) => {
  const {
    email,
    question1, question2, question3,
    question4, question5, question6, question7,
    question8, question9, question10
  } = req.body;

  const submittedAt = new Date().toISOString();

  db.run(`
    INSERT INTO responses (
      email, question1, question2, question3,
      question4, question5, question6, question7,
      question8, question9, question10, submittedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      email, question1, question2, question3,
      question4, question5, question6, question7,
      question8, question9, question10, submittedAt
    ],
    function(err) {
      if (err) {
        console.error('Database Error:', err.message);
        return res.status(500).send('Failed to store response.');
      }
      res.send('Survey submitted successfully!');
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
