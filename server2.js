require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Survey.html'));
});

// Load service account credentials for Google Sheets
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

app.post('/submit', async (req, res) => {
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
    // Append survey data to Google Sheet
    await appendToSheet(row);

    // Prepare data for Python email service
    const surveyData = {
      timestamp,
      email,
      question1, question2, question3, question4, question5,
      question6, question7, question8, question9,
      question10, question10_extra, question11
    };

    // Send survey data to Python email service
    await axios.post('https://your-python-service-url.onrender.com/email', surveyData);
    console.log('Survey data sent to Python email service successfully.');

    res.send('Thank you! Your survey has been recorded.');
  } catch (error) {
    console.error('Error processing survey:', error);
    res.status(500).send('Failed to process survey.');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
