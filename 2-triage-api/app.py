import os
import pickle
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from google.cloud import storage
import logging
import requests

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

model_data = None

def load_model_from_gcs():
    try:
        bucket_name = os.environ.get('GCS_BUCKET_NAME', 'navajeevan-models')
        model_filename = os.environ.get('MODEL_FILENAME', 'newborn_classifier.pkl')
        
        logger.info(f"Loading model from gs://{bucket_name}/{model_filename}")
        
        client = storage.Client()
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(model_filename)
        blob.download_to_filename('/tmp/model.pkl')
        
        with open('/tmp/model.pkl', 'rb') as f:
            model_data = pickle.load(f)
        
        logger.info("✓ Model loaded successfully")
        return model_data
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        raise

try:
    model_data = load_model_from_gcs()
except Exception as e:
    logger.warning(f"Could not load model on startup: {str(e)}")
    model_data = None

@app.route('/')
def home():
    return jsonify({
        'service': 'NavaJeevan Triage API',
        'status': 'healthy',
        'version': '2.0.0',
        'model_loaded': model_data is not None,
        'disclaimer': '⚠️ HACKATHON PROTOTYPE ONLY'
    })

@app.route('/predict', methods=['POST'])
def predict():
    if model_data is None:
        return jsonify({'error': 'Model not loaded'}), 503
    
    try:
        data = request.get_json()
        
        feature_columns = model_data['feature_columns']
        missing_fields = [field for field in feature_columns if field not in data]
        if missing_fields:
            return jsonify({'error': 'Missing fields', 'missing_fields': missing_fields}), 400
        
        features = np.array([[data[col] for col in feature_columns]])
        model = model_data['model']
        label_encoder = model_data['label_encoder']
        
        prediction = model.predict(features)
        probabilities = model.predict_proba(features)
        risk_level = label_encoder.inverse_transform(prediction)[0]
        
        risk_probabilities = {
            label: float(prob) 
            for label, prob in zip(label_encoder.classes_, probabilities[0])
        }
        
        # Get Gemini explanation (if agent service available)
        explanation = get_gemini_explanation(data, risk_level)
        
        response = {
            'status': 'success',
            'prediction': {
                'risk_level': risk_level,
                'confidence': float(max(probabilities[0])),
                'probabilities': risk_probabilities
            },
            'input': data,
            'recommendation': get_recommendation(risk_level),
            'explanation': explanation
        }
        
        # If critical, trigger alert
        if risk_level == 'Critical':
            trigger_alert(data, risk_level)
        
        logger.info(f"Prediction: {risk_level}")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({'error': str(e)}), 500

def get_gemini_explanation(data, risk_level):
    agent_url = os.environ.get('AGENT_SERVICE_URL')
    if not agent_url:
        return "No detailed explanation available"
    
    try:
        response = requests.post(
            f"{agent_url}/analyze",
            json={'vitals': data, 'risk_level': risk_level},
            timeout=10
        )
        if response.ok:
            return response.json().get('explanation', '')
    except:
        pass
    return "Explanation service unavailable"

def trigger_alert(data, risk_level):
    alert_url = os.environ.get('ALERT_SERVICE_URL')
    if alert_url:
        try:
            requests.post(
                f"{alert_url}/send-alert",
                json={'baby_data': data, 'risk_level': risk_level},
                timeout=5
            )
        except:
            logger.warning("Alert service unavailable")

def get_recommendation(risk_level):
    recommendations = {
        'Healthy': 'Continue routine monitoring. Next checkup as scheduled.',
        'At Risk': '⚠️ Enhanced monitoring required. Consider evaluation within 24 hours.',
        'Critical': '🚨 URGENT: Immediate medical attention required. Refer now.'
    }
    return recommendations.get(risk_level, 'Consult healthcare provider')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
