# NavaJeevan Complete System - Setup Guide

## Quick Start (15 minutes)

### Step 1: Upload Model to Cloud Storage (Already Done ✅)
Your model is at: `gs://navajeevan-models/newborn_classifier.pkl`

### Step 2: Get Gemini API Key

1. Go to: https://aistudio.google.com/app/apikey
2. Create API key
3. Copy the key (starts with `AIza...`)

### Step 3: Deploy Services

Open Cloud Shell and run:

```bash
# Clone/upload this project
cd navajeevan-complete

# Set environment variables
export PROJECT_ID="gen-lang-client-0035881252"
export GEMINI_API_KEY="YOUR_API_KEY_HERE"

# Deploy all services
chmod +x deploy-all.sh
./deploy-all.sh
```

### Step 4: Configure Services

After deployment, you need to update environment variables:

```bash
# Get service URLs
TRIAGE_URL=$(gcloud run services describe navajeevan-triage-api --region us-central1 --format 'value(status.url)')
AGENT_URL=$(gcloud run services describe navajeevan-agents --region us-central1 --format 'value(status.url)')
IMAGE_URL=$(gcloud run services describe navajeevan-image-analysis --region us-central1 --format 'value(status.url)')
ALERT_URL=$(gcloud run services describe navajeevan-alerts --region us-central1 --format 'value(status.url)')

# Update Triage API with service URLs
gcloud run services update navajeevan-triage-api \
  --region us-central1 \
  --update-env-vars AGENT_SERVICE_URL=$AGENT_URL,IMAGE_SERVICE_URL=$IMAGE_URL,ALERT_SERVICE_URL=$ALERT_URL

# Update Agent Orchestrator with API key
gcloud run services update navajeevan-agents \
  --region us-central1 \
  --update-env-vars GOOGLE_API_KEY=$GEMINI_API_KEY

# Update Image Analysis with API key
gcloud run services update navajeevan-image-analysis \
  --region us-central1 \
  --update-env-vars GOOGLE_API_KEY=$GEMINI_API_KEY
```

### Step 5: Update Frontend with API URL

1. Get Triage API URL:
```bash
gcloud run services describe navajeevan-triage-api --region us-central1 --format 'value(status.url)'
```

2. Edit `1-frontend-pwa/static/index.html`
3. Update line with `const API_URL = '...'` with your Triage API URL
4. Redeploy frontend:
```bash
cd 1-frontend-pwa
gcloud run deploy navajeevan-pwa --source . --region us-central1 --allow-unauthenticated
```

### Step 6: Test!

Open your PWA URL and test the system!

## Service URLs

After deployment, you'll have 5 services:

1. **Frontend PWA**: `https://navajeevan-pwa-*.run.app`
2. **Triage API**: `https://navajeevan-triage-api-*.run.app`
3. **Agent Orchestrator**: `https://navajeevan-agents-*.run.app`
4. **Image Analysis**: `https://navajeevan-image-analysis-*.run.app`
5. **Alert Service**: `https://navajeevan-alerts-*.run.app`

## Testing Each Service

### Test Triage API
```bash
curl -X POST $TRIAGE_URL/predict \
  -H "Content-Type: application/json" \
  -d '{
    "age_days": 5,
    "weight_kg": 3.2,
    "temperature_c": 37.0,
    "respiratory_rate_bpm": 40,
    "oxygen_saturation": 98,
    "feeding_frequency_per_day": 8,
    "urine_output_count": 6
  }'
```

### Test Agent Orchestrator
```bash
curl -X POST $AGENT_URL/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "vitals": {"age_days": 5, "weight_kg": 3.2},
    "risk_level": "At Risk"
  }'
```

### Test Image Analysis
```bash
# Requires base64 encoded image
curl -X POST $IMAGE_URL/analyze-image \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/jpeg;base64,..."}'
```

## Troubleshooting

### Model Not Loading
- Check bucket name: `gsutil ls gs://navajeevan-models/`
- Check permissions: Service account needs Storage Object Viewer role

### Gemini API Errors
- Verify API key is valid
- Check quota limits
- Ensure AI Platform API is enabled

### CORS Errors
- All services have CORS enabled
- Check network connectivity
- Verify service URLs are correct

## Cost Monitoring

Check your spending:
```bash
gcloud billing accounts list
gcloud billing projects describe $PROJECT_ID
```

## Next Steps

1. Test all features (Form, Voice placeholder, Image)
2. Create demo video
3. Write blog post (dev.to)
4. Post on social media with #CloudRunHackathon
5. Submit to hackathon!

## Support

- Check Cloud Run logs: `gcloud run services logs read SERVICE_NAME --region us-central1`
- View service details: `gcloud run services describe SERVICE_NAME --region us-central1`

## Architecture Diagram

```
┌─────────────────┐
│   Frontend PWA  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐      ┌──────────────────┐
│   Triage API    │─────→│ Agent Orchestrator│
│  (ML Model +    │      │  (Gemini + ADK)  │
│   Gemini)       │      └──────────────────┘
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ↓         ↓
┌────────┐ ┌────────┐
│ Image  │ │ Alert  │
│Analysis│ │Service │
└────────┘ └────────┘
```

Good luck with your hackathon! 🚀
