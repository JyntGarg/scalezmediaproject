# Simple Webhook Setup - NO TOKEN MANAGEMENT!

## ✅ Simple Solution: ONE Token, Set Once, Works Forever

### Step 1: Generate ONE Permanent Token (1 Year)

```bash
cd /Users/dnyaneshwarwantace/Downloads/scalez_new_phase/backend
npm run webhook:generate-token
```

This creates ONE token that works for ALL projects for 1 YEAR.

### Step 2: Set Token in n8n (Set Once)

When starting n8n:
```bash
export API_BASE_URL=http://localhost:7400
export API_TOKEN=<COPY_TOKEN_FROM_STEP_1>
npm run n8n
```

**OR** update `package.json`:
```json
"n8n": "N8N_SECURE_COOKIE=false API_BASE_URL=http://localhost:7400 API_TOKEN=<YOUR_TOKEN> n8n start"
```

### Step 3: That's It! Done!

- ✅ Token works for ALL projects
- ✅ All team members can use it
- ✅ No token sharing needed
- ✅ Works from Slack, Jira, Zapier, anywhere

---

## 📡 How to Use Webhooks

### From Slack/Jira/Zapier:

Just send data to n8n webhook - **NO TOKEN NEEDED**:

```bash
POST http://localhost:5678/webhook/north-star-metrics
{
  "projectId": "507f1f77bcf86cd799439011",
  "name": "Daily Active Users",
  "currentValue": 1500,
  "targetValue": 3000,
  ...
}
```

**n8n automatically uses the token you set in Step 2!**

---

## 🎯 That's It!

- **One token** → Set once
- **Works everywhere** → All projects, all team members
- **No sharing** → Token is in n8n environment
- **Simple!** → No complicated setup

---

## 🔄 Token Expiry? (After 1 Year)

Just regenerate:
```bash
npm run webhook:generate-token
```

Copy new token, update n8n environment. Done!

---

**No project-specific tokens. No sharing. No complexity. Just works!** ✅

