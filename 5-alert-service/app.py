import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return jsonify({
        'service': 'NavaJeevan Alert Service',
        'status': 'healthy'
    })

@app.route('/send-alert', methods=['POST'])
def send_alert():
    try:
        data = request.get_json()
        
        baby_data = data.get('baby_data', {})
        risk_level = data.get('risk_level', 'Unknown')
        
        # Generate Google Meet link (placeholder - requires Calendar API)
        meet_link = f"https://meet.google.com/new?authuser=0"
        
        # Prepare alert message
        alert_message = f'''
CRITICAL ALERT - Newborn Health Assessment

Time: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
Risk Level: {risk_level}

Baby Details:
- Age: {baby_data.get("age_days", "N/A")} days
- Weight: {baby_data.get("weight_kg", "N/A")} kg
- Temperature: {baby_data.get("temperature_c", "N/A")}°C
- Oxygen Saturation: {baby_data.get("oxygen_saturation", "N/A")}%

IMMEDIATE ACTION REQUIRED

Join video consultation: {meet_link}

This is an automated alert from NavaJeevan Triage AI.
'''
        
        # In production, send via Gmail API
        # For hackathon, we log and return the message
        logger.warning(f"CRITICAL ALERT: {risk_level}")
        logger.info(alert_message)
        
        return jsonify({
            'status': 'success',
            'alert_sent': True,
            'meet_link': meet_link,
            'message': 'Alert logged (Gmail API integration pending)'
        })
        
    except Exception as e:
        logger.error(f"Alert error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
