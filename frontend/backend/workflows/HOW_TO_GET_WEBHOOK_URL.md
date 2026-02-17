# How to Get Webhook URL from n8n

## 📍 Step-by-Step: Where to Find Webhook URL

### Step 1: Open n8n
1. Make sure n8n is running: `npm run n8n`
2. Open browser: `http://localhost:5678`
3. Login if needed

### Step 2: Go to Workflows
1. Click **"Workflows"** in the left sidebar (or top menu)
2. You'll see list of all workflows

### Step 3: Open Your Workflow
1. Click on **"North Star Metrics Webhook"** (or any workflow you want)
2. The workflow editor will open

### Step 4: Find the Webhook Node
1. Look for the **"Webhook - North Star Metrics"** node (usually the first node on the left)
2. Click on it to select it

### Step 5: Copy Webhook URL
1. In the **node settings panel** (right side), you'll see:
   - **"Webhook URL"** field
   - It will show something like: `http://localhost:5678/webhook/north-star-metrics`
2. **Click on the URL** - it should be clickable/highlighted
3. **Right-click** → **Copy** OR just **select and copy** (Cmd+C / Ctrl+C)

## 🎯 Quick Visual Guide

```
n8n UI Layout:
┌─────────────────────────────────────────────────┐
│  [Workflows] [Executions] [Settings] ...       │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────┐    ┌──────────────────┐   │
│  │ Webhook Node    │───▶│ Set Data Node    │   │
│  │                 │    │                  │   │
│  │ Webhook URL:    │    │                  │   │
│  │ http://local...│    │                  │   │
│  │ [COPY URL]     │    │                  │   │
│  └─────────────────┘    └──────────────────┘   │
│                                                 │
│  Settings Panel (Right Side)                    │
│  ┌───────────────────────────────────────┐      │
│  │ Webhook - North Star Metrics         │      │
│  │                                       │      │
│  │ Path: north-star-metrics             │      │
│  │ Webhook URL:                          │      │
│  │ http://localhost:5678/webhook/       │      │
│  │        north-star-metrics            │      │
│  │ [Click to copy]                       │      │
│  │                                       │      │
│  │ Method: POST                          │      │
│  │ Response Mode: responseNode           │      │
│  └───────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘
```

## ✅ Alternative: From Executions Tab

1. Go to **"Executions"** tab (top menu)
2. Find a successful execution
3. Click on it
4. Look for the **"Webhook"** node data
5. You'll see the URL there too

## 🔍 What the URL Looks Like

**Format:**
```
http://localhost:5678/webhook/north-star-metrics
http://localhost:5678/webhook/goal-metrics
```

**Important Notes:**
- ✅ URL is **only active** when workflow is **ACTIVATED** (toggle ON)
- ✅ URL includes the path from the webhook node settings
- ✅ URL is unique per workflow

## 💡 Pro Tip

Once you copy the URL, save it somewhere:
- In your testing guide
- In a notes file
- Bookmark it

You'll need this URL every time you want to test!

