# n8n Setup Guide for Scalez

This guide will help you set up n8n and import the webhook workflows for **North Star Metrics** and **Goal Metrics**.

## 📋 Step-by-Step Setup

### Step 1: Install n8n (if not already installed)

```bash
cd /Users/dnyaneshwarwantace/Downloads/scalez_new_phase/backend
npm install
```

This will install n8n as a dev dependency along with other packages.

### Step 2: Start n8n

```bash
cd /Users/dnyaneshwarwantace/Downloads/scalez_new_phase/backend
npm run n8n
```

**What happens:**
- n8n will start on `http://localhost:5678`
- Open your browser and go to `http://localhost:5678`
- You'll see the n8n **"Set up owner account"** page

### Step 2.5: Create n8n Owner Account

**Use the same credentials as your main platform** (for consistency):

- **Email**: `john.doe@example.com` (same as main platform)
- **First Name**: `John`
- **Last Name**: `Doe`
- **Password**: `Password123` (meets requirements: 8+ chars, 1 number, 1 capital)

**Note**: This uses the same email as your main platform (`john.doe@example.com`) to keep credentials consistent across the platform.

After creating the account, you'll be logged into the n8n dashboard.

**License Key (Optional)**:
- If n8n asks for a license key email, you can either:
  - **Skip it** (click "Skip" or "Continue without license") - Recommended for local development
  - **Enter the same fake email**: `john.doe@example.com` - It won't be verified
- License keys are only needed for n8n Cloud/Enterprise features
- For local development, you don't need a license key

### Step 3: Generate Permanent Token (ONE TIME - Works for 1 Year!)

```bash
cd /Users/dnyaneshwarwantace/Downloads/scalez_new_phase/backend
npm run webhook:generate-token
```

This will:
- ✅ Generate a token valid for **1 YEAR** (not 12 hours!)
- ✅ Show you the token to copy
- ✅ Save it to `.env.webhook` file

### Step 4: Set Token in package.json (ONE TIME - NOT in n8n UI!)

**Important:** Since "Environments" is Enterprise feature, set token in `package.json` instead!

1. **Copy the token** from Step 3
2. **Edit** `backend/package.json`
3. **Find this line:**
   ```json
   "n8n": "N8N_SECURE_COOKIE=false n8n start",
   ```
4. **Replace with:**
   ```json
   "n8n": "N8N_SECURE_COOKIE=false API_BASE_URL=http://localhost:7400 API_TOKEN=PASTE_YOUR_TOKEN_HERE n8n start",
   ```
5. **Replace** `PASTE_YOUR_TOKEN_HERE` with the token from Step 3
6. **Save** the file

**Example:**
```json
"n8n": "N8N_SECURE_COOKIE=false API_BASE_URL=http://localhost:7400 API_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... n8n start",
```

**That's it! Token is set in package.json - works for ALL projects for 1 YEAR!**

### Step 5: Import Workflows

You have **two options** to import the workflows:

#### Option A: Import via n8n UI (Recommended)

1. In n8n dashboard, click **"Workflows"** (left sidebar)
2. Click **"Import from File"** button (top right)
3. Select this file: `backend/workflows/north-star-metrics-webhook.json`
4. Click **"Import"**
5. Repeat for: `backend/workflows/goal-metrics-webhook.json`

#### Option B: Copy to n8n workflows directory

1. Find your n8n workflows directory (usually `~/.n8n/workflows/`)
2. Copy the JSON files from `backend/workflows/` to that directory
3. Restart n8n (stop with Ctrl+C, then `npm run n8n` again)

### Step 6: Activate Workflows

1. Click on **"Workflows"** in the left sidebar
2. You should see:
   - **"North Star Metrics Webhook"**
   - **"Goal Metrics Webhook"**

3. Click on **"North Star Metrics Webhook"**
4. Click the **"Active"** toggle at the top (switch it ON)
5. You'll see a webhook URL like: `http://localhost:5678/webhook/north-star-metrics`
6. **Copy this URL** - you'll need it for integrations
7. Repeat for **"Goal Metrics Webhook"**

### Step 7: Test Your Webhooks

**Important:** Clients (Slack/Jira users) just need the webhook URL - **NO TOKEN!** The token is already set in your backend/n8n.

#### Test North Star Metrics Webhook:

```bash
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
```

#### Test Goal Metrics Webhook:

```bash
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

## ✅ Verification Checklist

- [ ] n8n installed (`npm install` completed)
- [ ] n8n started (`npm run n8n` running)
- [ ] n8n UI accessible at `http://localhost:5678`
- [ ] Environment variables set (`API_BASE_URL` and `API_TOKEN`)
- [ ] Both workflows imported
- [ ] Both workflows activated
- [ ] Webhook URLs copied

## 🎯 What's Next?

Once workflows are active, you can:

1. **Use with Zapier**: 
   - Add the webhook URLs to Zapier triggers/actions
   - Connect to Slack, Jira, Asana, etc.

2. **Use with External Tools**:
   - Any tool that can send HTTP POST requests can use these webhooks
   - The workflows will automatically forward data to your backend API

3. **Customize Workflows**:
   - Edit workflows in n8n UI to add more logic
   - Add error handling, notifications, etc.

## 🐛 Troubleshooting

### n8n won't start
- Make sure port 5678 is not already in use
- Check if `npm install` completed successfully
- Try: `npm run n8n` again

### Webhooks not working
- Verify workflows are **Active** (toggle should be ON)
- Check environment variables are set correctly
- Check backend API is running on the correct port
- Look at n8n execution logs (click on a workflow execution to see errors)

### Authentication errors
- Verify `API_TOKEN` is set and valid
- Make sure your JWT token hasn't expired
- Check backend API logs for authentication errors

## 📚 Files Location

All workflow files are in: `backend/workflows/`

- `north-star-metrics-webhook.json` - North Star Metrics workflow
- `goal-metrics-webhook.json` - Goal Metrics workflow
- `n8n-README.md` - Detailed documentation
- `SETUP.md` - This setup guide

