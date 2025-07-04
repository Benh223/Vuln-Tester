import os
import json
from flask import Flask, request, jsonify
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

app = Flask(__name__)

def analyze_survey(data):
    equipment = training = protocol = 0

    for key, value in data.items():
        question = key.replace("_", " ").lower()
        # Your scoring logic here, same as before
        if question == 'question1':
            if value == 'We do not have any trained security team on site at this time.':
                training += 1
            elif value == 'We utilize an outside security company that checks in or patrols, but no team is stationed here full-time.':
                training += 2
            elif value == 'We have a part-time or on-call trained team that can be summoned quickly when needed.':
                training += 3
            elif value == 'There is a dedicated, fully trained security response team present on site whenever our facility is open.':
                training += 4
        elif question == 'question2':
            if value == 'We do not use cameras.':
                equipment += 1
            elif value == 'Some areas have cameras, but no analytics are applied.':
                equipment += 2
            elif value == 'Key areas have cameras with basic analytics (e.g., motion alerts).':
                equipment += 3
            elif value == 'We have comprehensive camera coverage with real-time analytics across the site.':
                equipment += 4
        elif question == 'question3':
            if value == 'We rely on traditional keys only.':
                equipment += 1
            elif value == 'We use a mix of keys and electronic badges.':
                equipment += 2
            elif value == 'Smart locks or badge readers protect main entries.':
                equipment += 3
            elif value == 'An integrated badge / smart-lock system covers all critical entry points campus-wide.':
                equipment += 4
        elif question == 'question4':
            if value == 'Paper sign-in sheet.':
                protocol += 1
            elif value == 'Digital sign-in without ID verification.':
                protocol += 2
            elif value == 'Digital system that captures a photo or scans ID.':
                protocol += 3
            elif value == 'Integrated visitor system linked to access control and watchlists.':
                protocol += 4
        elif question == 'question5':
            if value == 'None.':
                equipment += 1
            elif value == 'Basic PA system serving one building.':
                equipment += 2
            elif value == 'Property-wide PA or text/email alerts.':
                equipment += 3
            elif value == 'Multichannel system (PA, text, email, app) with pre-programmed scripts.':
                equipment += 4
        elif question == 'question6':
            if value == 'We do not have written procedures.':
                protocol += 1
            elif value == 'Procedures exist but have not been shared site-wide.':
                protocol += 2
            elif value == 'Procedures are shared but not practiced.':
                protocol += 3
            elif value == 'Procedures are shared and regularly practiced through drills or table-top exercises.':
                protocol += 4
        elif question == 'question7':
            if value == 'Staff receive no formal security training.':
                training += 1
            elif value == 'Staff get a one-time orientation during onboarding.':
                training += 2
            elif value == 'Staff receive periodic refresher training or e-learning modules.':
                training += 3
            elif value == 'Staff receive annual in-depth training':
                training += 4
        elif question == 'question8':
            if value == 'We do not assess anyone coming onto the property.':
                training += 1
            elif value == 'Inside the building, but within a controlled reception area.':
                training += 2
            elif value == 'Inside the building, with unfettered access':
                training += 3
            elif value == 'After they enter the property, but before they reach building doors.':
                training += 4
            elif value == 'Before they enter the property, at the perimeter.':
                training += 4
        elif question == 'question9':
            if value == 'No system in place.':
                protocol += 1
            elif value == 'Informal methods such as word-of-mouth or ad-hoc emails.':
                protocol += 2
            elif value == 'Some issues are logged but not routinely shared.':
                protocol += 3
            elif value == 'A structured process logs issues and distributes updates to all relevant stakeholders.':
                protocol += 4

    scores = {'equipment': equipment, 'training': training, 'protocol': protocol}
    lowest = min(scores, key=scores.get)
    return f"{lowest.capitalize()} is the lowest"

def send_email(to_email, result_summary):
    msg = MIMEText(f"Survey analysis result:\n\n{result_summary}")
    msg['Subject'] = "Your Security Survey Analysis"
    msg['From'] = EMAIL_USER
    msg['To'] = to_email

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            server.send_message(msg)
            print("Email sent successfully.")
    except Exception as e:
        print(f"Email sending failed: {e}")

@app.route('/email', methods=['POST'])
def handle_email():
    try:
        data = request.get_json()
        if not data or 'email' not in data:
            return jsonify({'error': 'Invalid data or missing email'}), 400

        result = analyze_survey(data)
        send_email(data['email'], result)
        return jsonify({'message': 'Email sent', 'result': result}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)






