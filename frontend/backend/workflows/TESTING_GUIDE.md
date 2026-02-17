# n8n Testing Guide

This guide will help you test your n8n webhook workflows to ensure they're working correctly with the backend API.

## 🚀 Step 1: Start the Backend Server

First, make sure your backend server is running:

```bash
cd /Users/dnyaneshwarwantace/Downloads/scalez_new_phase/backend
npm run dev
```

The backend should be running on `http://localhost:7400` (or the port configured in your `.env`).

## 🔧 Step 2: Start n8n

Open a new terminal and start n8n:

```bash
cd /Users/dnyaneshwarwantace/Downloads/scalez_new_phase/backend
npm run n8n
```

n8n will start on `http://localhost:5678`

## 📋 Step 3: Import and Activate Workflows

1. Open n8n in your browser: `http://localhost:5678`
2. Import the workflow files:
   - Go to **Workflows** → **Import from File**
   - Select `backend/workflows/north-star-metrics-webhook.json`
   - Select `backend/workflows/goal-metrics-webhook.json`
3. **Activate each workflow** by toggling the switch at the top right

## ✅ Step 4: Get Webhook URLs

Once workflows are activated, you'll see webhook URLs like:
- `http://localhost:5678/webhook/north-star-metrics`
- `http://localhost:5678/webhook/goal-metrics`

**Copy these URLs** - you'll need them for testing!

## 🧪 Step 5: Test the Webhooks

### Option A: Test Using cURL (Terminal)

#### Test North Star Metrics Webhook:

```bash
curl -X POST http://localhost:5678/webhook/north-star-metrics \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "YOUR_PROJECT_ID_HERE",
    "name": "Test Metric",
    "shortName": "TM",
    "description": "This is a test metric",
    "currentValue": 100,
    "targetValue": 500,
    "unit": "users",
    "metricType": "count",
    "timePeriod": "monthly",
    "isActive": true
  }'
```

#### Test Goal Metrics Webhook:

```bash
curl -X POST http://localhost:5678/webhook/goal-metrics \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Goal",
    "description": "This is a test goal",
    "project": "YOUR_PROJECT_ID_HERE",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "members": [],
    "keymetric": [],
    "confidence": "high"
  }'
```

### Option B: Test Using Postman or Insomnia

1. Create a new POST request
2. URL: `http://localhost:5678/webhook/north-star-metrics` (or goal-metrics)
3. Headers: `Content-Type: application/json`
4. Body (JSON):
```json
{
  "projectId": "YOUR_PROJECT_ID_HERE",
  "name": "Test Metric",
  "shortName": "TM",
  "description": "This is a test metric",
  "currentValue": 100,
  "targetValue": 500,
  "unit": "users",
  "metricType": "count",
  "timePeriod": "monthly",
  "isActive": true
}
```

### Option C: Test Using n8n's Built-in Test Feature

1. In n8n, open your workflow
2. Click on the **Webhook** node
3. Click **"Listen for test event"** or **"Test workflow"**
4. This will generate a test URL automatically
5. Use that URL to send test data

## 📊 Step 6: Monitor the Results

### Check n8n Execution Logs:
1. In n8n, go to **Executions** tab
2. You'll see all webhook executions
3. Click on an execution to see:
   - Data received by webhook
   - Data sent to your API
   - Response from your API
   - Any errors

### Check Backend Logs:
Look at your backend terminal for:
- API request logs
- Success/error messages
- Database operations

### Verify in Database:
1. Check Supabase Dashboard to see if the data was created
2. Or use your frontend to see if the metric/goal appears

## 🔍 Step 7: Common Issues & Debugging

### Issue: "401 Unauthorized"
- **Solution**: Make sure `API_TOKEN` is set correctly in `package.json` n8n script
- The token should be the JWT token generated for John Doe

### Issue: "404 Not Found" 
- **Solution**: Check that the backend is running and `API_BASE_URL` is correct
- Default should be `http://localhost:7400`

### Issue: "Webhook not responding"
- **Solution**: Make sure the workflow is **ACTIVATED** (toggle switch ON)
- Check n8n is running on `http://localhost:5678`

### Issue: "Missing required fields"
- **Solution**: Make sure all required fields are in the JSON payload
- Check the controller validation requirements

## 🎯 Quick Test Script

Save this as `test-webhook.sh`:

```bash
#!/bin/bash

# Configuration
WEBHOOK_URL="http://localhost:5678/webhook/north-star-metrics"
PROJECT_ID="YOUR_PROJECT_ID_HERE"  # Replace with actual project ID

echo "Testing n8n Webhook..."
echo "Webhook URL: $WEBHOOK_URL"
echo ""

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"projectId\": \"$PROJECT_ID\",
    \"name\": \"Test Metric $(date +%s)\",
    \"shortName\": \"TEST\",
    \"description\": \"Test metric created via webhook\",
    \"currentValue\": 100,
    \"targetValue\": 500,
    \"unit\": \"users\",
    \"metricType\": \"count\",
    \"timePeriod\": \"monthly\",
    \"isActive\": true
  }"

echo ""
echo "Check n8n Executions tab to see the result!"
```

Make it executable and run:
```bash
chmod +x test-webhook.sh
./test-webhook.sh
```

## 📝 Testing Checklist

- [ ] Backend server is running
- [ ] n8n is running and accessible
- [ ] Workflows are imported
- [ ] Workflows are ACTIVATED
- [ ] Webhook URLs are noted
- [ ] Test data sent successfully
- [ ] Checked n8n execution logs
- [ ] Checked backend logs
- [ ] Verified data in database/frontend
- [ ] Tested with actual project ID

## 🔗 Next Steps

Once testing works locally:
1. Update `API_BASE_URL` to your production server
2. Deploy n8n to your server
3. Update webhook URLs for production
4. Test again with production URLs

