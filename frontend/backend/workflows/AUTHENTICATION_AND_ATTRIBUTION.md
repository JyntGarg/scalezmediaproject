# 🔐 Authentication & Client Attribution Guide

## 🎯 The Problem

When multiple clients use the same platforms (FB Ads, Shopify, etc.), we need to:
1. **Identify WHO owns the data** (which client/user)
2. **Identify WHICH project** it belongs to
3. **Verify permissions** (only project members can update metrics)

**Example:**
- Client A has FB Ads → Updates should go to Client A's project
- Client B has FB Ads → Updates should go to Client B's project
- How do we know which is which?

---

## ✅ Current Backend Capabilities

Your backend already supports:
- ✅ `userEmail` in webhook payload → Finds user and checks project membership
- ✅ `projectName` or `projectId` → Identifies which project
- ✅ Permission checks → Only project members can update

**But we need:** A way to map external platforms to your clients/projects.

---

## 🔧 Solution: Platform → Client Mapping

### **Option 1: Webhook URL per Client (Recommended)**

Each client gets their own unique webhook URL with their project/user info embedded.

**Example:**
```
Client A's webhook: https://your-n8n.com/webhook/fb-ads?projectId=123&userEmail=clientA@example.com
Client B's webhook: https://your-n8n.com/webhook/fb-ads?projectId=456&userEmail=clientB@example.com
```

**How it works:**
1. Client A sets up FB Ads webhook → Uses their unique URL
2. Client B sets up FB Ads webhook → Uses their unique URL
3. n8n workflow reads query params and adds to payload
4. Backend receives `projectId` + `userEmail` and verifies permissions

---

### **Option 2: Webhook Secret Token per Client**

Each client gets a unique token that maps to their project/user.

**Example:**
```
Client A's token: fb_ads_clientA_abc123xyz
Client B's token: fb_ads_clientB_def456uvw
```

**How it works:**
1. Store token → project mapping in database
2. FB Ads sends token in webhook payload
3. n8n looks up token → finds project/user
4. Adds project/user info to payload

---

### **Option 3: Require Project/User in Every Payload**

Each platform webhook must include project identification.

**Example:**
```json
{
  "projectName": "Client A Project",
  "userEmail": "clientA@example.com",
  "metricName": "Ad Conversions",
  "value": 25
}
```

**How it works:**
1. Client configures FB Ads → Includes their project/user info
2. FB Ads sends data with project/user info
3. n8n forwards to backend
4. Backend verifies permissions

---

## 🏗️ Recommended Implementation

### **Step 1: Create Platform Mapping Table**

Store which platform accounts belong to which projects.

**Example Schema:**
```javascript
PlatformIntegration {
  platform: "facebook_ads", // or "shopify", "google_ads", etc.
  platformAccountId: "fb_ad_account_123", // FB Ads account ID
  projectId: "507f1f77bcf86cd799439011", // Your project ID
  projectName: "Client A Project",
  userId: "507f191e810c19729de860ea", // Project owner
  userEmail: "clientA@example.com",
  webhookSecret: "fb_ads_clientA_abc123", // Unique secret
  isActive: true,
  createdAt: Date
}
```

---

### **Step 2: Generate Unique Webhook URLs**

When client sets up integration:
1. Create `PlatformIntegration` record
2. Generate unique webhook URL: `/webhook/fb-ads/clientA_abc123`
3. Client uses this URL in FB Ads webhook settings
4. n8n workflow identifies client from URL path

---

### **Step 3: n8n Workflow with Client Identification**

**Workflow Structure:**
```
FB Ads Webhook (with client ID in path)
  ↓
Code: Lookup Client/Project from URL
  ↓
Code: Transform FB Data + Add Client Info
  ↓
HTTP Request: Update Metric with projectId + userEmail
```

**Example n8n Code Node:**
```javascript
// Extract client ID from webhook path
// URL: /webhook/fb-ads/clientA_abc123
const webhookPath = $json.path || '';
const clientId = webhookPath.split('/').pop(); // "clientA_abc123"

// Lookup client info (from static data or HTTP request to your backend)
// For now, hardcode mapping (in production, fetch from database)
const clientMapping = {
  "clientA_abc123": {
    projectId: "507f1f77bcf86cd799439011",
    projectName: "Client A Project",
    userEmail: "clientA@example.com"
  },
  "clientB_def456": {
    projectId: "507f1f77bcf86cd799439012",
    projectName: "Client B Project",
    userEmail: "clientB@example.com"
  }
};

const clientInfo = clientMapping[clientId];

// Transform FB Ads data
const fbData = $json.body;
return {
  json: {
    // Client/project identification
    projectId: clientInfo.projectId,
    projectName: clientInfo.projectName,
    userEmail: clientInfo.userEmail,
    
    // FB Ads data
    metricName: "Ad Conversions", // or from config
    value: fbData.conversions || fbData.spend,
    
    // API info
    apiBaseUrl: "http://localhost:7400",
    apiToken: "your-token"
  }
};
```

---

## 📋 Step-by-Step Setup for Each Client

### **When Client A Sets Up FB Ads Integration:**

1. **Client creates project in your platform:**
   - Project Name: "Client A E-Commerce"
   - Project Owner: `clientA@example.com`

2. **You create platform integration record:**
   ```javascript
   {
     platform: "facebook_ads",
     projectId: "clientA_project_id",
     projectName: "Client A E-Commerce",
     userEmail: "clientA@example.com",
     webhookSecret: "fb_ads_clientA_abc123"
   }
   ```

3. **Generate webhook URL:**
   ```
   https://your-n8n.com/webhook/fb-ads/clientA_abc123
   ```

4. **Client configures FB Ads:**
   - Go to FB Ads webhook settings
   - Add webhook URL: `https://your-n8n.com/webhook/fb-ads/clientA_abc123`
   - FB Ads will send data to this URL

5. **n8n workflow:**
   - Receives webhook at `/webhook/fb-ads/clientA_abc123`
   - Extracts client ID from path
   - Looks up project/user info
   - Transforms FB data
   - Calls your backend with `projectId` + `userEmail`
   - Backend verifies user is project member ✅

---

## 🔒 Security & Permissions Flow

### **1. Client Setup (One Time)**
```
Client → Creates Project → Gets Webhook URL → Configures Platform
```

### **2. Platform Sends Data**
```
FB Ads → POST /webhook/fb-ads/clientA_abc123
```

### **3. n8n Processing**
```
n8n → Extracts client ID from URL
     → Looks up: clientA_abc123 → projectId + userEmail
     → Transforms FB data → Adds project/user info
     → Calls backend API
```

### **4. Backend Verification**
```
Backend → Receives: projectId + userEmail + value
        → Finds project by projectId
        → Finds user by userEmail
        → Checks: Is user a member of project? ✅
        → Updates metric
```

---

## 🎯 Multi-Platform Example

### **Client A Has Multiple Platforms:**

1. **FB Ads:**
   - Webhook: `/webhook/fb-ads/clientA_abc123`
   - Maps to: Project "Client A E-Commerce", Metric "Ad Conversions"

2. **Shopify:**
   - Webhook: `/webhook/shopify/clientA_xyz789`
   - Maps to: Same Project "Client A E-Commerce", Metric "Sales Revenue"

3. **Google Ads:**
   - Webhook: `/webhook/google-ads/clientA_def456`
   - Maps to: Same Project "Client A E-Commerce", Metric "Ad Conversions"

**All three platforms update metrics in the SAME project for Client A.**

---

## 🔧 Implementation in n8n

### **Workflow: Platform Integration Router**

Create a workflow that:
1. Receives webhook from any platform
2. Extracts client ID from URL path
3. Routes to platform-specific transformation
4. Adds client/project info
5. Calls backend API

**Example Workflow Structure:**
```
Webhook - FB Ads (/webhook/fb-ads/:clientId)
  ↓
IF: Check Platform Type
  ↓
Code: Transform FB Ads Data + Add Client Info
  ↓
HTTP Request: Update North Star Metric
```

---

## 📝 Required Changes

### **1. Backend: Add Platform Integration Model**

```javascript
// backend/models/PlatformIntegration.model.js
const PlatformIntegrationSchema = new Schema({
  platform: {
    type: String,
    required: true,
    enum: ['facebook_ads', 'shopify', 'google_ads', 'keap', 'gohighlevel', 'clickfunnels']
  },
  platformAccountId: String, // External platform account ID
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  webhookSecret: {
    type: String,
    required: true,
    unique: true
  },
  metricMapping: {
    // Which platform metrics map to which project metrics
    type: Map,
    of: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
});
```

### **2. Backend: API to Create Integration**

```javascript
// POST /api/v1/integrations/platform
// Creates platform integration and returns webhook URL
```

### **3. n8n: Client Lookup Node**

Add a node that:
- Extracts client ID from webhook URL
- Looks up client info (from database or static mapping)
- Adds project/user info to payload

---

## 🚀 Quick Start Example

### **For Client A Setting Up FB Ads:**

**Step 1:** Client creates project in your platform
- Project: "Client A E-Commerce"
- Owner: `clientA@example.com`

**Step 2:** You generate integration
```bash
# Call your API
POST /api/v1/integrations/platform
{
  "platform": "facebook_ads",
  "projectId": "clientA_project_id",
  "userEmail": "clientA@example.com"
}

# Response:
{
  "webhookUrl": "https://your-n8n.com/webhook/fb-ads/clientA_abc123",
  "webhookSecret": "clientA_abc123"
}
```

**Step 3:** Client adds webhook URL to FB Ads

**Step 4:** When FB Ads sends data:
- n8n receives: `/webhook/fb-ads/clientA_abc123`
- Looks up: `clientA_abc123` → `projectId` + `userEmail`
- Transforms: FB data → your format
- Sends to backend: `projectId` + `userEmail` + `value`
- Backend verifies permissions ✅

---

## ✅ Summary

**Current Backend:** ✅ Already supports `projectId` + `userEmail` for attribution

**What's Missing:** 
1. Platform → Client mapping system
2. Unique webhook URLs per client
3. n8n workflow to extract client ID and add project/user info

**Next Steps:**
1. Create `PlatformIntegration` model in backend
2. Create API to generate webhook URLs per client
3. Update n8n workflows to extract client ID from URL
4. Add client lookup logic in n8n workflows

Would you like me to implement the backend `PlatformIntegration` model and API endpoint?

