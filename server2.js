
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { google } = require('googleapis');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'VAP', 'public', 'Survey.html'));
});

// Load service account credentials
const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function appendToSheet(data) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Sheet1!A1', // Change sheet name if different
    valueInputOption: 'RAW',
    resource: {
      values: [data],
    },
  });
}

app.post('https://domain-tester.onrender.com/submit', async (req, res) => {
  const {
    email, question1, question2, question3, question4, question5,
    question6, question7, question8, question9, question10,
    question10_extra, question11
  } = req.body;

  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const row = [
    timestamp, email, question1, question2, question3,
    question4, question5, question6, question7, question8,
    question9, question10, question10_extra || '', question11 || ''
  ];

  try {
    await appendToSheet(row);

    // Send to Python
    const { spawn } = require('child_process');
    const surveyData = {
      timestamp,
      email,
      question1, question2, question3, question4, question5,
      question6, question7, question8, question9,
      question10, question10_extra, question11
    };

    const python = spawn('python3', ['email_handler.py', JSON.stringify(surveyData)]);

    python.stdout.on('data', (data) => {
      console.log(`PYTHON OUT: ${data}`);
    });

    python.stderr.on('data', (data) => {
      console.error(`PYTHON ERR: ${data}`);
    });

    res.send('Thank you! Your survey has been recorded.');
  } catch (error) {
    console.error('Google Sheets Error:', error);
    res.status(500).send('Failed to process survey.');
  }
});



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
