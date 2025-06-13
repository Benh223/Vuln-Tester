require('dotenv').config({ path: '.env' });

const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Email setup
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

// Route for root access
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'VAP', 'public', 'Survey.html'));
});

// Google Sheets Auth
const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Function to append data
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
    email, question1, question2, question3, question4,
    question5, question6, question7, question8, question9, question10
  } = req.body;

  // Format timestamp for EST
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
    timestamp, email, question1, question2, question3, question4,
    question5, question6, question7, question8, question9, question10
  ];

  try {
    await appendToSheet(row);

    // Send confirmation email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Survey Assessment Confirmation',
      text: `Thanks for completing our survey on ${timestamp}. A Draco member will contact you shortly.`,
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');

    res.send('Thank you! Your survey has been recorded and an email has been sent.');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred. Please try again later.');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
