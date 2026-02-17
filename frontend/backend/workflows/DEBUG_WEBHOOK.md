# Debug Webhook Issues

## ✅ Test Result: HTTP 200 OK but No Data Created

This means:
- ✅ n8n webhook is receiving requests
- ❌ HTTP Request node might be failing
- ❌ Or workflow execution is erroring

## 🔍 Step-by-Step Debugging

### 1. Check n8n Execution Logs

1. Open n8n: `http://localhost:5678`
2. Go to **"Executions"** tab (top menu)
3. Find the most recent execution (should be highlighted/red if failed)
4. Click on it to see details

### 2. What to Look For in Execution Logs

**In the execution details, check:**

1. **Webhook Node** (should be green ✅)
   - Shows the data received from curl/test

2. **Set Data Node** (should be green ✅)
   - Check if `apiBaseUrl` and `apiToken` are set correctly
   - Should see: `apiBaseUrl: "http://localhost:7400"`

3. **HTTP Request Node** (this is likely red ❌)
   - **Check the error message** - this tells you what's wrong
   - Common errors:
     - "Cannot read properties of undefined" → Missing data
     - "401 Unauthorized" → Wrong token
     - "404 Not Found" → Wrong URL
     - "Network error" → Backend not running

### 3. Common Issues & Fixes

#### Issue: "Cannot read properties of undefined (reading 'status')"
**Fix:** Make sure workflow was **re-imported** after fixes

#### Issue: "401 Unauthorized"
**Fix:** Check if token in workflow matches the one in package.json

#### Issue: "404 Not Found"
**Fix:** 
- Check backend is running on `http://localhost:7400`
- Check URL in HTTP Request node is correct

#### Issue: "Network Error"
**Fix:**
- Make sure backend server is running
- Check backend is accessible: `curl http://localhost:7400/`

### 4. Verify Workflow Was Re-imported

**Important:** After fixing the JSON file, you MUST re-import in n8n:

1. Delete old workflow in n8n
2. Import the **NEW** `north-star-metrics-webhook.json` file
3. Activate it (toggle ON)
4. Test again

### 5. Manual Test in n8n UI

1. Open the workflow in n8n
2. Click **"Execute Workflow"** button (top right)
3. This will run it in test mode
4. Check each node for errors
5. This shows you exactly where it fails

## 🎯 Quick Fix Checklist

- [ ] Re-imported workflow after fixes?
- [ ] Workflow is ACTIVATED (toggle ON)?
- [ ] Backend server is running on port 7400?
- [ ] Checked n8n Executions tab for errors?
- [ ] HTTP Request node has correct URL and token?
- [ ] Set Data node includes apiBaseUrl and apiToken?

## 📝 Test Again After Fixes

Once you've re-imported and fixed any issues:

```bash
cd /Users/dnyaneshwarwantace/Downloads/scalez_new_phase/backend
npm run webhook:test 68de8c2741fb08ec876899a8
```

Then check the backend logs and database to verify metric was created!

