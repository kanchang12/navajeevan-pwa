#!/bin/bash

# ============================================================================
# NavaJeevan Complete System - Master Deployment Script
# ============================================================================

set -e

echo "=========================================="
echo "NavaJeevan Complete System Deployment"
echo "=========================================="

# Configuration
PROJECT_ID="${PROJECT_ID:-gen-lang-client-0035881252}"
REGION="${REGION:-us-central1}"

echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Set project
gcloud config set project $PROJECT_ID

# Function to deploy a service
deploy_service() {
    local dir=$1
    local name=$2
    local env_vars=$3
    
    echo "----------------------------------------"
    echo "Deploying: $name"
    echo "----------------------------------------"
    
    cd $dir
    
    if [ -z "$env_vars" ]; then
        gcloud run deploy $name \
            --source . \
            --region $REGION \
            --allow-unauthenticated \
            --quiet
    else
        gcloud run deploy $name \
            --source . \
            --region $REGION \
            --allow-unauthenticated \
            --set-env-vars $env_vars \
            --quiet
    fi
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe $name --region $REGION --format 'value(status.url)')
    echo "✅ $name deployed: $SERVICE_URL"
    echo ""
    
    cd ..
}

# Deploy services in order
echo "Starting deployment of 5 services..."
echo ""

# 1. Frontend PWA
deploy_service "1-frontend-pwa" "navajeevan-pwa" ""

# 2. Image Analysis (no dependencies)
deploy_service "4-image-analysis" "navajeevan-image-analysis" ""

# 3. Alert Service (no dependencies)
deploy_service "5-alert-service" "navajeevan-alerts" ""

# 4. Agent Orchestrator
ALERT_URL=$(gcloud run services describe navajeevan-alerts --region $REGION --format 'value(status.url)')
deploy_service "3-agent-orchestrator" "navajeevan-agents" "ALERT_SERVICE_URL=$ALERT_URL"

# 5. Triage API (needs all service URLs)
AGENT_URL=$(gcloud run services describe navajeevan-agents --region $REGION --format 'value(status.url)')
IMAGE_URL=$(gcloud run services describe navajeevan-image-analysis --region $REGION --format 'value(status.url)')
deploy_service "2-triage-api" "navajeevan-triage-api" "GCS_BUCKET_NAME=navajeevan-models,MODEL_FILENAME=newborn_classifier.pkl,AGENT_SERVICE_URL=$AGENT_URL,IMAGE_SERVICE_URL=$IMAGE_URL"

echo "=========================================="
echo "✅ ALL SERVICES DEPLOYED SUCCESSFULLY!"
echo "=========================================="
echo ""
echo "Service URLs:"
echo "  Frontend PWA: $(gcloud run services describe navajeevan-pwa --region $REGION --format 'value(status.url)')"
echo "  Triage API: $(gcloud run services describe navajeevan-triage-api --region $REGION --format 'value(status.url)')"
echo "  Agent Orchestrator: $(gcloud run services describe navajeevan-agents --region $REGION --format 'value(status.url)')"
echo "  Image Analysis: $(gcloud run services describe navajeevan-image-analysis --region $REGION --format 'value(status.url)')"
echo "  Alert Service: $(gcloud run services describe navajeevan-alerts --region $REGION --format 'value(status.url)')"
echo ""
echo "Next steps:"
echo "1. Update frontend PWA with Triage API URL"
echo "2. Test the complete flow"
echo "3. Configure Gmail API credentials for alerts"
echo ""
