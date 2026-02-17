# Webhook Not Working? Here's How to Fix It

## ❌ Error: "The requested webhook is not registered"

This means the workflow is not active or needs to be executed first.

## ✅ Solution: Activate the Workflow

### Step 1: Open n8n
1. Go to `http://localhost:5678`
2. Login if needed

### Step 2: Go to Workflows
1. Click **"Workflows"** in left sidebar
2. Find **"North Star Metrics Webhook"**

### Step 3: Activate the Workflow
1. Click on the workflow to open it
2. Look for the **"Active"** toggle switch at the **top right**
3. **Toggle it ON** (it should turn green/blue)
4. This activates the webhook permanently

### Step 4: Verify Webhook URL
1. Click on the **Webhook node** (first node)
2. In the settings panel, you should see:
   - **Production URL**: `http://localhost:5678/webhook/north-star-metrics`
   - **Test URL**: `http://localhost:5678/webhook-test/north-star-metrics`

**Important:**
- Use `/webhook/` for production (when workflow is ACTIVE)
- Use `/webhook-test/` only for testing (temporary, one-time use)

### Step 5: Test Again
Once workflow is **ACTIVATED**, use the production URL:
```
http://localhost:5678/webhook/north-star-metrics
```

## 🔍 Quick Checklist

- [ ] Workflow is imported
- [ ] Workflow is **ACTIVATED** (toggle ON)
- [ ] Using `/webhook/` URL (not `/webhook-test/`)
- [ ] n8n is running
- [ ] Backend is running

## 📝 Difference Between Test and Production URLs

### Test URL (`/webhook-test/`)
- Only works **once** after clicking "Execute workflow"
- Temporary, for testing workflow logic
- Not persistent

### Production URL (`/webhook/`)
- Works **all the time** when workflow is ACTIVE
- Persistent webhook endpoint
- Use this for actual integration

## ✅ Correct Setup

1. **Activate workflow** → Toggle ON
2. **Use production URL** → `/webhook/north-star-metrics`
3. **Test** → Send POST request to production URL

