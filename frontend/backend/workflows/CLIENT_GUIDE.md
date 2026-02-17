# Client Guide: Using Webhooks (NO TOKEN NEEDED!)

## ✅ Simple Setup: Token is Already Configured

**Good News:** The token is already set in **your backend/n8n**. Clients don't need to set anything!

---

## 🎯 For Your Clients (Slack/Jira/Zapier Users)

### What They Need to Do:

**Just ONE thing:** Send data to webhook URL - **NO TOKEN NEEDED!**

### Webhook URLs:

```
North Star Metrics: http://localhost:5678/webhook/north-star-metrics
Goal Metrics: http://localhost:5678/webhook/goal-metrics
```

---

## 📡 Example: From Slack

### In Slack (user just needs webhook URL):

```bash
# User sends this from Slack - NO TOKEN!
curl -X POST http://localhost:5678/webhook/north-star-metrics \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "507f1f77bcf86cd799439011",
    "name": "Daily Active Users",
    "shortName": "DAU",
    "description": "From Slack",
    "currentValue": 1500,
    "targetValue": 3000,
    "unit": "users",
    "metricType": "count",
    "timePeriod": "monthly"
  }'
```

**That's it!** No token in the payload. The token is already set in n8n.

---

## 📡 Example: From Jira

### In Jira (user just needs webhook URL):

```bash
# User sends this from Jira - NO TOKEN!
curl -X POST http://localhost:5678/webhook/goal-metrics \
  -H "Content-Type: application/json" \
  -d '{
    "project": "507f1f77bcf86cd799439011",
    "name": "Complete Feature X",
    "description": "Jira issue #123",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-12-31T23:59:59Z",
    "keymetric": [],
    "confidence": "High"
  }'
```

**That's it!** No token needed.

---

## 📡 Example: From Zapier

### In Zapier Configuration:

1. Choose "Webhooks by Zapier"
2. Action: "POST"
3. URL: `http://localhost:5678/webhook/north-star-metrics`
4. Data: Just send your data (projectId, name, etc.)
5. **NO AUTHENTICATION** - leave blank!

**That's it!** No token configuration needed.

---

## 🔧 Where Token is Set (Backend Side - You Do This Once)

### Step 1: Generate Token (Once)

```bash
cd backend
npm run webhook:generate-token
```

### Step 2: Set in package.json (Once)

```json
"n8n": "N8N_SECURE_COOKIE=false API_BASE_URL=http://localhost:7400 API_TOKEN=<YOUR_TOKEN> n8n start"
```

### Step 3: Done!

Token is now set in **your backend/n8n**. Clients never see it!

---

## ✅ Summary

**For You (Backend):**
- ✅ Generate token ONCE
- ✅ Set in package.json ONCE
- ✅ Token is in n8n environment

**For Clients (Slack/Jira/Zapier):**
- ✅ Just need webhook URL
- ✅ Send data (NO TOKEN!)
- ✅ That's it!

**Token is set in backend/n8n - clients don't need to configure anything!** 🎉

