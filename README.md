# NavaJeevan Triage AI - Complete System

**⚠️ HACKATHON PROTOTYPE ONLY**  
Government and Legal approval required before real-world implementation.

## System Architecture

5 Cloud Run Services working together:

```
Frontend PWA → Triage API → Agent Orchestrator
                    ↓              ↓
              Image Analysis   Alert Service
```

## Services

### 1. Frontend PWA (`1-frontend-pwa/`)
- Mobile-first Progressive Web App
- Voice input (Gemini Speech-to-Text)
- Image upload for jaundice detection
- Form-based data entry
- Baby tracking with LocalStorage
- Offline-first design

### 2. Triage API (`2-triage-api/`)
- ML model (Random Forest) for risk classification
- Gemini integration for explanations
- Orchestrates other services
- Loads model from Cloud Storage

### 3. Agent Orchestrator (`3-agent-orchestrator/`)
- Google ADK multi-agent system
- Assessment Agent: Analyzes vitals
- Triage Agent: Makes risk decisions
- Protocol Agent: Generates care plans
- Communication Agent: Handles alerts

### 4. Image Analysis (`4-image-analysis/`)
- Gemini Vision API integration
- Jaundice severity detection
- Visual health assessment
- Returns structured analysis

### 5. Alert Service (`5-alert-service/`)
- Gmail API integration
- Auto-generates Google Meet links
- Sends alerts for critical cases
- Email notifications to healthcare providers

## Quick Start

### Prerequisites
```bash
# Set your project ID
export PROJECT_ID="gen-lang-client-0035881252"
export REGION="us-central1"

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable gmail.googleapis.com
```

### Deploy All Services
```bash
chmod +x deploy-all.sh
./deploy-all.sh
```

### Deploy Individual Services
```bash
# Frontend
cd 1-frontend-pwa
gcloud run deploy navajeevan-pwa --source . --region $REGION --allow-unauthenticated

# Triage API
cd ../2-triage-api
gcloud run deploy navajeevan-triage-api --source . --region $REGION --allow-unauthenticated \
  --set-env-vars GCS_BUCKET_NAME=navajeevan-models,MODEL_FILENAME=newborn_classifier.pkl

# Agent Orchestrator
cd ../3-agent-orchestrator
gcloud run deploy navajeevan-agents --source . --region $REGION --allow-unauthenticated

# Image Analysis
cd ../4-image-analysis
gcloud run deploy navajeevan-image-analysis --source . --region $REGION --allow-unauthenticated

# Alert Service
cd ../5-alert-service
gcloud run deploy navajeevan-alerts --source . --region $REGION --allow-unauthenticated
```

## Configuration

### Environment Variables

**Triage API:**
- `GCS_BUCKET_NAME`: Cloud Storage bucket for ML model
- `MODEL_FILENAME`: Model file name
- `AGENT_SERVICE_URL`: URL of agent orchestrator
- `IMAGE_SERVICE_URL`: URL of image analysis service

**Agent Orchestrator:**
- `GOOGLE_API_KEY`: Gemini API key (get from AI Studio)
- `ALERT_SERVICE_URL`: URL of alert service

**Image Analysis:**
- `GOOGLE_API_KEY`: Gemini API key

**Alert Service:**
- `GMAIL_USER`: Email address for sending alerts
- `ALERT_RECIPIENTS`: Comma-separated email addresses

## Features

✅ **Multi-Modal Input**: Form, Voice, Image  
✅ **AI Agents**: 4 specialized agents using Google ADK  
✅ **Real-time Risk Assessment**: ML model + Gemini explanations  
✅ **Image Analysis**: Jaundice detection via Gemini Vision  
✅ **Critical Alerts**: Auto-email with Google Meet links  
✅ **Baby Tracking**: 30-day monitoring with LocalStorage  
✅ **Offline-First**: Works without internet  
✅ **Multi-Language Ready**: Easy to add translations

## Cost Estimate

- Cloud Run: Free tier (2M requests/month)
- Gemini API: Free tier (60 requests/min)
- Gmail API: Free
- Cloud Storage: <$1/month
- **Total**: <$5/month for demo

## Hackathon Categories

✅ **AI Studio Category**: Gemini integration throughout  
✅ **AI Agents Category**: Google ADK multi-agent system

## Bonus Points

✅ Multiple Google AI models (Gemini Flash + Vision)  
✅ 5 Cloud Run services  
✅ Social media post with #CloudRunHackathon  
✅ Blog post (dev.to)

## Development

### Local Testing

Each service can run locally:

```bash
# Frontend
cd 1-frontend-pwa
pip install -r requirements.txt
python app.py

# Triage API
cd 2-triage-api
pip install -r requirements.txt
export GCS_BUCKET_NAME=navajeevan-models
python app.py

# etc...
```

## Security Notes

- All services use CORS for cross-origin requests
- Gmail API requires OAuth2 credentials
- Gemini API keys should be kept secure
- Consider using Secret Manager for production

## Future Enhancements

- WhatsApp integration
- SMS via Google Cloud Messaging
- Real-time database (Firestore)
- Advanced analytics dashboard
- Mobile native apps (Flutter)

## Author

**Kanchan** (@kanchang12)  
AI Developer & Healthcare Innovation Specialist  
Leeds, UK

## License

MIT License - Built for Google Cloud Run Hackathon 2025

---

**For detailed service documentation, see README files in each service directory.**
