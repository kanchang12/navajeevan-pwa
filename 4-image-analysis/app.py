import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import google.generativeai as genai
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configure Gemini
genai.configure(api_key=os.environ.get('GOOGLE_API_KEY', ''))

@app.route('/')
def home():
    return jsonify({
        'service': 'NavaJeevan Image Analysis',
        'status': 'healthy',
        'model': 'Gemini 1.5 Flash'
    })

@app.route('/analyze-image', methods=['POST'])
def analyze_image():
    try:
        data = request.get_json()
        
        if 'image' not in data:
            return jsonify({'error': 'No image provided'}), 400
        
        # Decode base64 image
        image_data = data['image']
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        
        # Use Gemini Vision
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = '''Analyze this newborn baby photo for health concerns.
        
Focus on:
1. Jaundice (yellow skin/eyes) - rate severity 0-10
2. Skin color abnormalities
3. Visible distress signs
4. Any other concerning visual indicators

Provide a structured analysis in JSON format:
{
    "jaundice_severity": <0-10>,
    "skin_concerns": "<description>",
    "distress_signs": "<description>",
    "overall_assessment": "<brief summary>",
    "requires_attention": <true/false>
}'''
        
        response = model.generate_content([
            {'mime_type': 'image/jpeg', 'data': image_bytes},
            prompt
        ])
        
        logger.info("Image analyzed successfully")
        
        return jsonify({
            'status': 'success',
            'analysis': response.text,
            'model': 'gemini-1.5-flash'
        })
        
    except Exception as e:
        logger.error(f"Image analysis error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
