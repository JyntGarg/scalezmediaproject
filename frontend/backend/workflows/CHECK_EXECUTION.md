# How to Check n8n Execution Errors

## 🔍 Quick Steps to Find the Error

### Step 1: Open n8n Executions Tab

1. Go to: `http://localhost:5678`
2. Click **"Executions"** in the top menu
3. You'll see a list of recent executions

### Step 2: Find Failed Execution

Look for:
- **Red badge** = Failed execution
- **Green badge** = Successful execution
- **Gray badge** = Waiting/Running

Click on the **most recent one** (should be red if it failed)

### Step 3: Check Each Node

In the execution details, you'll see a visual flow:

1. **Webhook Node** (left side)
   - Should be **green** ✅
   - Click it to see data received

2. **Set Data Node** (middle)
   - Should be **green** ✅  
   - Click it - check if `apiBaseUrl` and `apiToken` are there
   - Should show: `apiBaseUrl: "http://localhost:7400"`

3. **HTTP Request Node** (right side)
   - This is likely **red** ❌
   - **Click on it** - this shows the error!
   - Look for error message at the bottom

### Step 4: Read the Error

The HTTP Request node will show:
- **Error message** (red text)
- **Request details** (URL, headers sent)
- **Response** (if any)

## 📸 What the Error Might Look Like

**Common errors you might see:**

```
❌ TypeError: Cannot read properties of undefined (reading 'status')
   → Missing apiBaseUrl or apiToken in data

❌ 401 Unauthorized
   → Wrong token or token not set

❌ 404 Not Found
   → Backend not running or wrong URL

❌ Network error: connect ECONNREFUSED
   → Backend server not running on port 7400
```

## ✅ Once You Find the Error

**Take a screenshot or copy the error message** and I can help fix it!

## 💡 Pro Tip

You can also test directly in n8n:
1. Open the workflow
2. Click **"Execute Workflow"** button (top right)
3. This shows live execution with errors highlighted

