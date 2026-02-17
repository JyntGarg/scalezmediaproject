# Project-Specific Permanent Webhook Tokens Setup

## 🎯 Solution Overview

**Problem Solved:**
- ✅ Permanent tokens per project (1 year expiry, not 12 hours)
- ✅ Each project has its own token
- ✅ All team members in a project can use webhooks
- ✅ Data flows: **External Platform (Slack/Jira) → n8n → Your Database**
- ✅ No client management needed

---

## 🏗️ Architecture

```
External Platform (Slack/Jira/Zapier)
         ↓
    POST to n8n Webhook
         ↓
    n8n Workflow
         ↓
    Your Backend API (with project token)
         ↓
    Supabase Database
```

---

## 🚀 Quick Setup for Each Project

### Step 1: Generate Project Token (One-Time Per Project)

```bash
cd /Users/dnyaneshwarwantace/Downloads/scalez_new_phase/backend
npm run webhook:generate-project <PROJECT_ID>
```

**Example:**
```bash
npm run webhook:generate-project 507f1f77bcf86cd799439011
```

This will:
- ✅ Generate a permanent token (1 year) for that specific project
- ✅ Save it to database (WebhookToken model)
- ✅ Create `.env.webhook.<PROJECT_ID>` file
- ✅ Show you the webhook URLs

### Step 2: Team Members Get Token via API

Team members can get the webhook token **via your API** (no manual setup needed):

```bash
# Get project webhook token
curl -X GET http://localhost:7400/api/v1/projects/<PROJECT_ID>/webhook-token \
  -H "Authorization: Bearer <USER_JWT_TOKEN>"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "projectId": "507f1f77bcf86cd799439011",
    "expiresAt": "2025-12-31T23:59:59.000Z",
    "usageCount": 0,
    "webhookUrls": {
      "northStarMetrics": "http://localhost:5678/webhook/north-star-metrics",
      "goalMetrics": "http://localhost:5678/webhook/goal-metrics"
    }
  }
}
```

---

## 📡 How Team Members Use Webhooks

### From Slack:
```bash
# User sends data from Slack to n8n webhook
curl -X POST http://localhost:5678/webhook/north-star-metrics \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "507f1f77bcf86cd799439011",
    "token": "PROJECT_WEBHOOK_TOKEN",  # Get from API
    "name": "Daily Active Users",
    "shortName": "DAU",
    "description": "From Slack integration",
    "currentValue": 1500,
    "targetValue": 3000,
    "unit": "users"
  }'
```

### From Jira:
```bash
# User sends Jira issue data to webhook
curl -X POST http://localhost:5678/webhook/goal-metrics \
  -H "Content-Type: application/json" \
  -d '{
    "token": "PROJECT_WEBHOOK_TOKEN",
    "project": "507f1f77bcf86cd799439011",
    "name": "Complete Feature X",
    "description": "Jira issue #123",
    "keymetric": []
  }'
```

### From Zapier:
1. User configures Zapier trigger
2. Uses webhook URL: `http://localhost:5678/webhook/north-star-metrics`
3. Includes `token` and `projectId` in payload
4. n8n routes to your database automatically

---

## 🔧 For Frontend Integration

### Get Webhook Info in Frontend:

```javascript
// In your frontend code
const getProjectWebhookInfo = async (projectId) => {
  const response = await axios.get(
    `/api/v1/projects/${projectId}/webhook-token`,
    {
      headers: {
        Authorization: `Bearer ${userToken}`
      }
    }
  );
  
  return response.data.data;
  // Returns: token, webhookUrls, expiresAt, etc.
};
```

### Display to Team Members:

Show in project settings:
- Webhook token (copy-able)
- Webhook URLs for North Star Metrics & Goals
- Token expiration date
- Usage statistics

---

## 📋 API Endpoints

### Get Project Webhook Token
```
GET /api/v1/projects/:projectId/webhook-token
Authorization: Bearer <USER_JWT_TOKEN>
```

**Who can access:**
- ✅ Project owner
- ✅ Project team members
- ✅ Project creator

### Regenerate Project Webhook Token
```
POST /api/v1/projects/:projectId/webhook-token/regenerate
Authorization: Bearer <USER_JWT_TOKEN>
```

**Who can access:**
- ✅ Project owner only

---

## 🔐 Security & Permissions

### Token Security:
- ✅ Each project has unique token
- ✅ Token stored in database (`webhook_tokens` table)
- ✅ Token expires in 1 year (auto-renewable)
- ✅ Project owner can regenerate if needed

### Access Control:
- ✅ Only project team members can get token
- ✅ Only project owner can regenerate
- ✅ Tokens are project-specific (can't access other projects)

---

## 📊 Database Models

### webhook_tokens Table Structure:
```sql
{
  project_id: uuid,         -- Which project
  token: text,              -- JWT token
  created_by: uuid,         -- User who created it
  expires_at: timestamp,    -- 1 year from creation
  is_active: boolean,       -- Active/inactive
  usage_count: integer,     -- How many times used
  last_used_at: timestamp   -- Last usage timestamp
}
```

---

## 🎯 Complete Flow Example

### Scenario: Team member adds metric from Slack

1. **Team member types in Slack:**
   ```
   /add-metric project:Project1 name:Daily Users value:1500 target:3000
   ```

2. **Slack bot calls your API to get webhook token:**
   ```javascript
   GET /api/v1/projects/507f1f77bcf86cd799439011/webhook-token
   // Returns token for that project
   ```

3. **Slack bot posts to n8n webhook:**
   ```javascript
   POST http://localhost:5678/webhook/north-star-metrics
   {
     projectId: "507f1f77bcf86cd799439011",
     token: "PROJECT_TOKEN",
     name: "Daily Users",
     currentValue: 1500,
     targetValue: 3000,
     ...
   }
   ```

4. **n8n workflow:**
   - Receives webhook
   - Uses token from payload (or falls back to API_TOKEN)
   - Calls your backend API

5. **Your backend API:**
   - Authenticates with project token
   - Checks project access
   - Saves to database

6. **Data saved in MongoDB:**
   - North Star Metric created
   - Linked to project
   - Created by team member

---

## 🚀 Setup Checklist

- [ ] Create WebhookToken model
- [ ] Add webhook token routes to app.js
- [ ] Generate token for each project: `npm run webhook:generate-project <PROJECT_ID>`
- [ ] Team members can get token via: `GET /api/v1/projects/:projectId/webhook-token`
- [ ] Frontend displays webhook URLs and token
- [ ] Configure external platforms (Slack/Jira/Zapier) with webhook URLs
- [ ] Test flow: External Platform → n8n → Database

---

## 💡 Benefits

✅ **No Client Management:**
- Team members get token via your API automatically
- No manual token generation needed

✅ **Project-Specific:**
- Each project has its own token
- Team members only see their project's webhook info

✅ **Permanent (1 Year):**
- No 12-hour expiry headaches
- Auto-generates if missing

✅ **Secure:**
- Only project team members can access
- Project owner can regenerate if compromised

✅ **Easy Integration:**
- Works with Slack, Jira, Zapier, any platform
- Standard webhook format

---

## 🐛 Troubleshooting

### Token expired?
```bash
# Regenerate via API (project owner only)
POST /api/v1/projects/:projectId/webhook-token/regenerate

# Or via script
npm run webhook:generate-project <PROJECT_ID>
```

### Team member can't access?
- Check if user is in `project.team` array
- Verify user has valid JWT token
- Check project access permissions

### n8n not receiving data?
- Verify webhook URL is correct
- Check if n8n workflow is "Active"
- Verify token is included in webhook payload

---

## 📝 Summary

**For Each Project:**
1. Generate token once: `npm run webhook:generate-project <PROJECT_ID>`
2. Token stored in database (1 year expiry)
3. Team members get token via API endpoint
4. Use webhook URLs in external platforms
5. Data flows automatically: External → n8n → Supabase

**No client management needed - everything automated!** 🎉

