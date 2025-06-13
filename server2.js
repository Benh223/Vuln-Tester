require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { google } = require('googleapis');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Email transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'VAP', 'public')));

// Route for homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'VAP', 'public', 'Survey.html'));
});

// Google Sheets setup
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
    range: 'Sheet1!A1',
    valueInputOption: 'RAW',
    resource: {
      values: [data],
    },
  });
}

// Handle form submission
app.post('/submit', async (req, res) => {
  const {
    email, question1, question2, question3, question4, question5,
    question6, question7, question8, question9, question10
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
    question4, question5, question6, question7, question8, question9, question10
  ];

  try {
    await appendToSheet(row);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Survey Assessment Confirmation',
      text: `Thanks for completing our survey on ${timestamp}. A Draco member will contact you shortly.`,
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent');
    res.send('Thank you! Your survey has been recorded.');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Failed to store data or send email.');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
