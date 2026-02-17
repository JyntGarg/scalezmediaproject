# n8n Webhook Workflows for Scalez

This directory contains n8n workflows for webhook integrations with Scalez's North Star Metrics and Goal Metrics.

## 📋 Prerequisites

1. n8n installed and running (see `package.json`)
2. Backend API running on `http://localhost:5000`
3. API authentication token configured

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd /Users/dnyaneshwarwantace/Downloads/scalez_new_phase/backend
npm install
```

### 2. Start n8n

```bash
cd /Users/dnyaneshwarwantace/Downloads/scalez_new_phase/backend
npm run n8n
```

Then open http://localhost:5678 in your browser.

### 3. Set Environment Variables

In n8n, go to **Settings → Environment Variables** and add:

```
API_BASE_URL=http://localhost:5000
API_TOKEN=your_jwt_token_here
```

**Note**: 
- `API_BASE_URL` - Your backend API URL (e.g., `http://localhost:5000` or `https://api.scalez.in`)
- `API_TOKEN` - Your JWT authentication token

### 3. Import Workflows

#### Option A: Import via n8n UI
1. Open n8n at http://localhost:5678
2. Click **"Workflows"** → **"Import from File"**
3. Import `north-star-metrics-webhook.json`
4. Import `goal-metrics-webhook.json`

#### Option B: Copy to n8n workflows directory
1. Find your n8n workflows directory (usually `~/.n8n/workflows/`)
2. Copy the JSON files there
3. Restart n8n

### 4. Activate Workflows

After importing, activate each workflow:
1. Open the workflow
2. Click **"Active"** toggle at the top
3. Copy the webhook URL displayed

## 📡 Webhook Endpoints

Once activated, you'll get webhook URLs like:

- **North Star Metrics**: `http://localhost:5678/webhook/north-star-metrics`
- **Goal Metrics**: `http://localhost:5678/webhook/goal-metrics`

## 🔧 Configuration

### Update API URL

If your backend runs on a different port/domain, update the `API_BASE_URL` environment variable:
- Go to **Settings → Environment Variables**
- Update `API_BASE_URL` to your backend URL (e.g., `https://api.scalez.in`)
- The workflows will automatically use this environment variable

## 📦 Webhook Payload Examples

### North Star Metrics Webhook

```json
{
  "projectId": "507f1f77bcf86cd799439011",
  "name": "Monthly Active Users",
  "shortName": "MAU",
  "description": "Total number of active users per month",
  "currentValue": 1000,
  "targetValue": 5000,
  "unit": "users",
  "metricType": "count",
  "timePeriod": "monthly",
  "isActive": true,
  "deadline": "2024-12-31T23:59:59Z"
}
```

### Goal Metrics Webhook

#### Create Goal:
```json
{
  "name": "Increase User Engagement",
  "description": "Improve user engagement metrics",
  "project": "507f1f77bcf86cd799439011",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z",
  "members": ["507f1f77bcf86cd799439012"],
  "keymetric": [
    {
      "name": "Daily Active Users",
      "startValue": 100,
      "targetValue": 500
    }
  ],
  "confidence": "High"
}
```

#### Update Goal Metric:
```json
{
  "action": "updateMetric",
  "goalId": "507f1f77bcf86cd799439013",
  "keymetricId": "507f1f77bcf86cd799439014",
  "value": 250,
  "date": "2024-01-15T00:00:00Z"
}
```

## 🔐 Authentication & Configuration

The workflows use environment variables for configuration:
- **`API_BASE_URL`** - Backend API base URL (e.g., `http://localhost:5000` or `https://api.scalez.in`)
- **`API_TOKEN`** - JWT authentication token
- Make sure to set both in **Settings → Environment Variables** before activating workflows

## 📝 Workflow Structure

### North Star Metrics Workflow:
1. **Webhook** - Receives POST request
2. **Set Data** - Maps incoming data to API format
3. **HTTP Request** - Sends to backend API
4. **Respond** - Returns success/error response

### Goal Metrics Workflow:
1. **Webhook** - Receives POST request
2. **Set Data** - Maps incoming data
3. **HTTP Request** - Creates goal OR updates metric (based on action)
4. **Respond** - Returns response

## 🧪 Testing

Test webhooks using curl:

```bash
# Test North Star Metrics
curl -X POST http://localhost:5678/webhook/north-star-metrics \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your-project-id",
    "name": "Test Metric",
    "shortName": "TM",
    "description": "Test description",
    "currentValue": 100,
    "targetValue": 200,
    "unit": "count",
    "metricType": "count",
    "timePeriod": "monthly"
  }'

# Test Goal Metrics
curl -X POST http://localhost:5678/webhook/goal-metrics \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Goal",
    "description": "Test goal description",
    "project": "your-project-id",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-12-31T23:59:59Z",
    "keymetric": [],
    "confidence": "Medium"
  }'
```

## 🐛 Troubleshooting

1. **Webhook not receiving requests**
   - Check if workflow is activated
   - Verify webhook URL is correct
   - Check n8n execution logs

2. **Authentication errors**
   - Verify `API_TOKEN` environment variable is set
   - Check token hasn't expired
   - Verify backend API is running

3. **API connection errors**
   - Verify backend URL is correct
   - Check if backend API is accessible
   - Verify project/user IDs are valid

## 📚 Next Steps

1. Test workflows with sample data
2. Configure Zapier to use these webhooks
3. Set up Slack/Jira integrations via n8n
4. Add error handling and notifications

