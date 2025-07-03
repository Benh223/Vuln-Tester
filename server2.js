require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));

// Serve Survey.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'VAP', 'public', 'index.html'));
});

app.get('/survey', (req, res) => {
  res.sendFile(path.join(__dirname, 'VAP', 'public', 'Survey.html'));
});

// Google Sheets auth setup
const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Append data to Google Sheet
async function appendToSheet(data) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Sheet1!A1',
    valueInputOption: 'RAW',
    resource: { values: [data] },
  });
}

// Survey analysis function (converted from Python)
function analyzeSurvey(data) {
  let equipment = 0, training = 0, protocol = 0;

  if(data.question1 === 'We do not have any trained security team on site at this time.') training += 1;
  else if(data.question1 === 'We utilize an outside security company that checks in or patrols, but no team is stationed here full-time.') training += 2;
  else if(data.question1 === 'We have a part-time or on-call trained team that can be summoned quickly when needed.') training += 3;
  else if(data.question1 === 'There is a dedicated, fully trained security response team present on site whenever our facility is open.') training += 4;

  if(data.question2 === 'We do not use cameras.') equipment += 1;
  else if(data.question2 === 'Some areas have cameras, but no analytics are applied.') equipment += 2;
  else if(data.question2 === 'Key areas have cameras with basic analytics (e.g., motion alerts).') equipment += 3;
  else if(data.question2 === 'We have comprehensive camera coverage with real-time analytics across the site.') equipment += 4;

  if(data.question3 === 'We rely on traditional keys only.') equipment += 1;
  else if(data.question3 === 'We use a mix of keys and electronic badges.') equipment += 2;
  else if(data.question3 === 'Smart locks or badge readers protect main entries.') equipment += 3;
  else if(data.question3 === 'An integrated badge / smart-lock system covers all critical entry points campus-wide.') equipment += 4;

  if(data.question4 === 'Paper sign-in sheet.') protocol += 1;
  else if(data.question4 === 'Digital sign-in without ID verification.') protocol += 2;
  else if(data.question4 === 'Digital system that captures a photo or scans ID.') protocol += 3;
  else if(data.question4 === 'Integrated visitor system linked to access control and watchlists.') protocol += 4;

  if(data.question5 === 'None.') equipment += 1;
  else if(data.question5 === 'Basic PA system serving one building.') equipment += 2;
  else if(data.question5 === 'Property-wide PA or text/email alerts.') equipment += 3;
  else if(data.question5 === 'Multichannel system (PA, text, email, app) with pre-programmed scripts.') equipment += 4;

  if(data.question6 === 'We do not have written procedures.') protocol += 1;
  else if(data.question6 === 'Procedures exist but have not been shared site-wide.') protocol += 2;
  else if(data.question6 === 'Procedures are shared but not practiced.') protocol += 3;
  else if(data.question6 === 'Procedures are shared and regularly practiced through drills or table-top exercises.') protocol += 4;

  if(data.question7 === 'Staff receive no formal security training.') training += 1;
  else if(data.question7 === 'Staff get a one-time orientation during onboarding.') training += 2;
  else if(data.question7 === 'Staff receive periodic refresher training or e-learning modules.') training += 3;
  else if(data.question7 === 'Staff receive annual in-depth training') training += 4;

  if(data.question8 === 'We do not assess anyone coming onto the property.') training += 1;
  else if(data.question8 === 'Inside the building, but within a controlled reception area.') training += 2;
  else if(data.question8 === 'Inside the building, with unfettered access') training += 3;
  else if(data.question8 === 'After they enter the property, but before they reach building doors.') training += 4;
  else if(data.question8 === 'Before they enter the property, at the perimeter.') training += 4;

  if(data.question9 === 'No system in place.') protocol += 1;
  else if(data.question9 === 'Informal methods such as word-of-mouth or ad-hoc emails.') protocol += 2;
  else if(data.question9 === 'Some issues are logged but not routinely shared.') protocol += 3;
  else if(data.question9 === 'A structured process logs issues and distributes updates to all relevant stakeholders.') protocol += 4;

  const scores = { equipment, training, protocol };
  let lowest = Object.keys(scores).reduce((a,b) => scores[a] < scores[b] ? a : b);

  return `${lowest.charAt(0).toUpperCase() + lowest.slice(1)} is the lowest`;
}

// Send email with nodemailer
async function sendSurveyEmail(toEmail, surveyData) {
  const resultSummary = analyzeSurvey(surveyData);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Your Security Survey Analysis',
    text: `Survey analysis result:\n\n${resultSummary}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully.');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// Handle survey POST
app.post('https://vuln-tester.onrender.com//submit', async (req, res) => {
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

    await sendSurveyEmail(email, {
      question1, question2, question3, question4, question5,
      question6, question7, question8, question9,
    });

    res.send('Thank you! Your survey has been recorded.');
  } catch (error) {
    console.error('Error processing survey:', error);
    res.status(500).send('Failed to process survey.');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
