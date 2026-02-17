# Complete Setup Steps (Simple!)

## ✅ Step-by-Step: What to Do After Importing Workflows

### Step 1: Generate Token (ONE TIME)

```bash
cd /Users/dnyaneshwarwantace/Downloads/scalez_new_phase/backend
npm run webhook:generate-token
```

**Copy the token** that appears at the end!

---

### Step 2: Set Token in package.json (ONE TIME)

1. Open `backend/package.json`
2. Find this line:
   ```json
   "n8n": "N8N_SECURE_COOKIE=false n8n start",
   ```
3. Change it to:
   ```json
   "n8n": "N8N_SECURE_COOKIE=false API_BASE_URL=http://localhost:7400 API_TOKEN=<PASTE_YOUR_TOKEN_HERE> n8n start",
   ```
4. Replace `<PASTE_YOUR_TOKEN_HERE>` with the token from Step 1
5. Save the file

**Example:**
```json
"n8n": "N8N_SECURE_COOKIE=false API_BASE_URL=http://localhost:7400 API_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... n8n start",
```

---

### Step 3: Import Workflows in n8n

1. Start n8n:
   ```bash
   npm run n8n
   ```
2. Open http://localhost:5678
3. Click "Workflows" (left sidebar)
4. Click "Import from File"
5. Import: `backend/workflows/north-star-metrics-webhook.json`
6. Import: `backend/workflows/goal-metrics-webhook.json`

---

### Step 4: Activate Workflows

1. Click on "North Star Metrics Webhook"
2. Toggle "Active" switch ON (top right)
3. Copy the webhook URL shown (e.g., `http://localhost:5678/webhook/north-star-metrics`)
4. Repeat for "Goal Metrics Webhook"

---

### Step 5: Done! ✅

**That's it!** Now:
- ✅ Token is set in package.json (when n8n starts, it uses this token)
- ✅ Workflows are imported and activated
- ✅ Clients can use webhook URLs (NO TOKEN NEEDED)

---

## 📝 Where Environment Variables Are Set

**Answer:** In `package.json` script, NOT in n8n UI!

**Why?** Because "Environments" is Enterprise feature, so we set it in the startup command instead.

**Where exactly:**
```json
// backend/package.json
"n8n": "N8N_SECURE_COOKIE=false API_BASE_URL=http://localhost:7400 API_TOKEN=<YOUR_TOKEN> n8n start"
```

This sets the environment variables **when n8n starts**.

---

## ✅ Summary

1. ✅ Generate token: `npm run webhook:generate-token`
2. ✅ Set in package.json: Update `n8n` script with token
3. ✅ Import workflows in n8n UI
4. ✅ Activate workflows in n8n UI
5. ✅ Done! Start using webhooks

**No need to set environment variables in n8n UI** - it's all in package.json!

