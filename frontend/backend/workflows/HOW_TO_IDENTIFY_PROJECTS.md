# 🎯 How to Identify Projects for Platform Integrations

## 📋 Current System Structure

Your code has:
- ✅ **Users** (like John Doe, Alice, etc.)
- ✅ **Projects** (like "E-Commerce Growth Platform")
- ❌ **No separate "Client" entity**

**Projects belong to Users:**
- Each Project has an `owner` (User)
- Each Project has `createdBy` (User)
- Each Project has `team` (array of Users)

---

## 🔍 The Problem

**Question:** When FB Ads sends data, how do we know which Project it belongs to?

**Answer:** We need to **link each platform account to a specific Project**.

---

## ✅ Simple Solution

### **Option 1: Include Project Info in Webhook URL**

Each platform webhook URL includes the project ID:

**Example:**
```
Client A (User: john@example.com) has Project: "E-Commerce Growth Platform" (ID: abc123)
  ↓
FB Ads webhook URL: /webhook/fb-ads/project-abc123

Client B (User: alice@example.com) has Project: "Marketing Campaign" (ID: xyz789)
  ↓
FB Ads webhook URL: /webhook/fb-ads/project-xyz789
```

**How it works:**
1. User creates Project in your platform → Gets Project ID
2. User sets up FB Ads → Adds webhook URL with their Project ID
3. When FB Ads sends data → n8n extracts Project ID from URL
4. n8n looks up Project → Finds Project owner/userEmail
5. n8n transforms data → Adds `projectId` + `userEmail` (from Project owner)
6. Backend receives → Updates metric for that Project

---

### **Option 2: Include Project Info in Webhook Payload**

Each platform sends project info in the webhook payload:

**Example:**
```json
{
  "projectId": "abc123",
  "projectName": "E-Commerce Growth Platform",
  "userEmail": "john@example.com",
  "metricName": "Ad Conversions",
  "value": 25
}
```

**How it works:**
1. User configures platform webhook → Includes their projectId/userEmail
2. Platform sends data → Includes project info in payload
3. n8n transforms data → Forwards to backend
4. Backend verifies → Updates metric

---

## 🎯 Recommended Approach

### **Use Project ID in Webhook URL** (Simpler for Users)

**Step 1: User Sets Up Integration**
1. User logs into your platform
2. User goes to project: "E-Commerce Growth Platform" (Project ID: `abc123`)
3. User clicks "Connect FB Ads"
4. Platform generates webhook URL: `https://your-n8n.com/webhook/fb-ads/project-abc123`
5. User copies this URL → Pastes into FB Ads webhook settings

**Step 2: n8n Workflow**

```javascript
// n8n Code Node: Extract Project Info from URL
const webhookPath = $json.path; // "/webhook/fb-ads/project-abc123"
const projectId = webhookPath.split('/').pop().replace('project-', ''); // "abc123"

// Look up project from your backend API (or use static mapping)
// For now, assume we fetch project info:
const project = await fetch(`http://localhost:7400/api/v1/project/${projectId}`);

// Get project owner email
const userEmail = project.owner.email; // or project.createdBy.email

// Transform FB Ads data
const fbData = $json.body; // FB Ads webhook payload
return {
  json: {
    projectId: projectId,
    projectName: project.name,
    userEmail: userEmail,
    metricName: "Ad Conversions", // or from config
    value: fbData.conversions || fbData.spend,
    apiBaseUrl: "http://localhost:7400",
    apiToken: "your-token"
  }
};
```

**Step 3: Backend Updates Metric**

Backend already handles:
- ✅ Receives `projectId` + `userEmail`
- ✅ Verifies user is project member
- ✅ Updates metric

---

## 📋 Implementation Steps

### **1. Add Integration Setup API** (Backend)

Create endpoint to generate webhook URLs for each project:

```javascript
// POST /api/v1/projects/:projectId/integrations/platform
// Generates webhook URL for platform integration

router.post('/projects/:projectId/integrations/platform', async (req, res) => {
  const { projectId } = req.params;
  const { platform } = req.body; // "facebook_ads", "shopify", etc.
  const userId = req.user._id;

  // Verify user owns project
  const project = await Project.findById(projectId);
  if (!project || project.owner.toString() !== userId.toString()) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  // Generate webhook URL
  const webhookUrl = `https://your-n8n.com/webhook/${platform}/project-${projectId}`;

  res.json({
    webhookUrl: webhookUrl,
    projectId: projectId,
    projectName: project.name,
    userEmail: req.user.email,
    platform: platform
  });
});
```

### **2. User Interface** (Frontend)

Add "Connect Integration" button on project page:
- Click "Connect FB Ads"
- Shows webhook URL
- User copies and pastes into FB Ads settings

### **3. n8n Workflow**

Update workflow to:
- Extract `projectId` from URL path
- Fetch project info from backend (optional, or use static mapping)
- Add `projectId` + `userEmail` to payload
- Call backend API

---

## 🔧 Alternative: Static Mapping (For Testing)

For now, you can manually create a mapping in n8n:

```javascript
// n8n Code Node: Static Project Mapping
const projectMapping = {
  "project-abc123": {
    projectId: "abc123",
    projectName: "E-Commerce Growth Platform",
    userEmail: "prembkalwale@gmail.com" // Project owner
  },
  "project-xyz789": {
    projectId: "xyz789",
    projectName: "Marketing Campaign",
    userEmail: "dnyaneshwar@wantace.com" // Project owner
  }
};

const webhookPath = $json.path; // "/webhook/fb-ads/project-abc123"
const projectKey = webhookPath.split('/').pop(); // "project-abc123"
const projectInfo = projectMapping[projectKey];

// Transform platform data + add project info
const fbData = $json.body;
return {
  json: {
    ...projectInfo,
    metricName: "Ad Conversions",
    value: fbData.conversions,
    apiBaseUrl: "http://localhost:7400",
    apiToken: "your-token"
  }
};
```

---

## ✅ Summary

**No "Client" concept needed!**

**Solution:**
1. Each platform account → Links to a specific **Project**
2. Webhook URL includes **Project ID**: `/webhook/fb-ads/project-abc123`
3. n8n extracts **Project ID** from URL
4. n8n adds **Project owner's email** (userEmail) to payload
5. Backend verifies user is project member → Updates metric

**Example Flow:**
```
John Doe (User) creates Project "E-Commerce" (ID: abc123)
  ↓
John sets up FB Ads → Uses webhook: /webhook/fb-ads/project-abc123
  ↓
FB Ads sends data → n8n extracts project-abc123
  ↓
n8n looks up: project-abc123 → Project "E-Commerce", Owner: john@example.com
  ↓
n8n sends: { projectId: "abc123", userEmail: "john@example.com", value: 25 }
  ↓
Backend verifies john@example.com is project owner ✅
  ↓
Backend updates metric for Project "E-Commerce"
```

---

## 🚀 Next Steps

1. **Add Integration API** (generate webhook URLs per project)
2. **Update n8n workflows** (extract project ID from URL)
3. **Add frontend UI** (let users connect integrations)
4. **Test with one platform** (e.g., FB Ads or Shopify)

Want me to create the backend API endpoint and update the n8n workflow?




























