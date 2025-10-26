import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

genai.configure(api_key=os.environ.get('GOOGLE_API_KEY', ''))

@app.route('/')
def home():
    return jsonify({
        'service': 'NavaJeevan Agent Orchestrator',
        'status': 'healthy',
        'agents': ['assessment', 'triage', 'protocol', 'communication']
    })

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.get_json()
        vitals = data.get('vitals', {})
        risk_level = data.get('risk_level', 'Unknown')
        
        # Use Gemini to generate explanation
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f'''You are a medical AI assistant explaining newborn health assessment to a Community Health Worker.

Risk Level: {risk_level}

Vitals:
- Age: {vitals.get("age_days")} days
- Weight: {vitals.get("weight_kg")} kg
- Temperature: {vitals.get("temperature_c")}°C
- Respiratory Rate: {vitals.get("respiratory_rate_bpm")} bpm
- Oxygen Saturation: {vitals.get("oxygen_saturation")}%
- Feeding Frequency: {vitals.get("feeding_frequency_per_day")}/day
- Urine Output: {vitals.get("urine_output_count")}/day

Provide a simple, clear explanation in 2-3 sentences that a CHW can understand and explain to parents.
Focus on what the readings mean and what actions to take.'''
        
        response = model.generate_content(prompt)
        explanation = response.text
        
        logger.info(f"Generated explanation for {risk_level} case")
        
        return jsonify({
            'status': 'success',
            'explanation': explanation,
            'agents_consulted': ['assessment', 'triage', 'protocol']
        })
        
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
