# 📱 Slack to n8n Integration Guide

## Step-by-Step: Connect Slack to Your Metrics

### Prerequisites
- ✅ Slack workspace created
- ✅ Two members added: `prembkalwale@gmail.com` and `dnyaneshwar@wantace.com`
- ✅ n8n running on `http://localhost:5678`
- ✅ Backend API running on `http://localhost:7400`

---

## Option 1: Using Slack Trigger (Real-time Messages)

### Step 1: Create Slack App in Slack API

1. Go to https://api.slack.com/apps
2. Click **"Create New App"** → **"From scratch"**
3. Fill in:
   - **App Name**: `Scalez Metrics Bot`
   - **Pick a Workspace**: Your workspace
4. Click **"Create App"**

### Step 2: Configure Slack App Permissions

1. In your app, go to **"OAuth & Permissions"** (left sidebar)
2. Scroll to **"Scopes"** → **"Bot Token Scopes"**
3. Add these permissions:
   - `channels:history` (View messages in public channels)
   - `chat:write` (Send messages)
   - `users:read` (View users' email addresses)
4. Scroll up and click **"Install to Workspace"**
5. Click **"Allow"** to authorize
6. Copy the **"Bot User OAuth Token"** (starts with `xoxb-`)

### Step 3: Subscribe to Events

1. Go to **"Event Subscriptions"** (left sidebar)
2. Toggle **"Enable Events"** to ON
3. Under **"Subscribe to bot events"**, add:
   - `message.channels` (Messages in public channels)
4. Click **"Save Changes"**

### Step 4: Set Request URL (Need ngrok first!)

**Important**: You need ngrok to expose your localhost n8n to the internet.

#### Install ngrok:
```bash
# On Mac
brew install ngrok

# Or download from https://ngrok.com/download
```

#### Start ngrok:
```bash
ngrok http 5678
```

You'll see:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:5678
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

### Step 5: Create n8n Workflow for Slack

1. Open n8n: `http://localhost:5678`
2. Create **New Workflow**
3. Add **"Slack Trigger"** node:
   - Click **"+ Add node"**
   - Search **"Slack Trigger"**
   - In node settings:
     - Click **"Create New Credential"**
     - Name: `Slack Workspace`
     - **Bot Token**: Paste your `xoxb-` token from Step 2
     - Click **"Save"**
   - **Channel**: Select channel (e.g., `#general`)
   - **Trigger On**: `Message Posted`

4. Add **"Code"** node to parse message:
   ```javascript
   // Parse Slack message format
   // Example: "update north star: E-Commerce Growth Platform, Conversion Rate, 15.5"
   const item = $input.first().json;
   const text = item.text || '';
   const userEmail = item.user?.email || 'prembkalwale@gmail.com'; // Default
   
   // Simple parsing (you can improve this)
   const lowerText = text.toLowerCase();
   
   let projectName = null;
   let metricName = null;
   let value = null;
   
   // Try to extract project name, metric name, value
   // Format: "update north star: Project Name, Metric Name, Value"
   if (lowerText.includes('update north star:')) {
     const parts = text.split('update north star:')[1].split(',');
     if (parts.length >= 3) {
       projectName = parts[0].trim();
       metricName = parts[1].trim();
       value = parseFloat(parts[2].trim());
     }
   }
   
   return {
     json: {
       projectName: projectName,
       metricName: metricName,
       value: value,
       userEmail: userEmail,
       apiBaseUrl: 'http://localhost:7400',
       apiToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjE5MDExNzAsImV4cCI6MTc5MzQzNzE3MCwiYXVkIjoiNjhkZTEyMGQ0MWZiMDhlYzg3Njg5NDdjIiwiaXNzIjoic2NhbGV6LmluIn0.xbV2kkdy9_bmD88mD7UXb-mDPH4FO3EM3k3SXWypBUs'
     }
   };
   ```

5. Add **"HTTP Request"** node to call your backend:
   - **Method**: `PATCH`
   - **URL**: `={{ $json.apiBaseUrl }}/api/v1/projects/webhook/north-star-metrics/value/by-name`
   - **Authentication**: None
   - **Headers**:
     - `Authorization`: `Bearer {{ $json.apiToken }}`
     - `Content-Type`: `application/json`
   - **Body** (JSON):
     ```json
     {
       "projectName": "{{ $json.projectName }}",
       "metricName": "{{ $json.metricName }}",
       "currentValue": "{{ $json.value }}",
       "userEmail": "{{ $json.userEmail }}"
     }
     ```

6. Add **"Respond to Webhook"** node (if using webhook)

7. **Activate** the workflow

### Step 6: Test It!

In Slack, type:
```
update north star: E-Commerce Growth Platform, Conversion Rate, 15.5
```

The workflow should:
1. ✅ Receive message from Slack
2. ✅ Parse project name, metric name, value
3. ✅ Update metric in your backend
4. ✅ Return success response

---

## Option 2: Slack Slash Commands (Easier for Users)

### Step 1: Create Slack Slash Command

1. Go to https://api.slack.com/apps
2. Select your app
3. Go to **"Slash Commands"** (left sidebar)
4. Click **"Create New Command"**
5. Fill in:
   - **Command**: `/update-metric`
   - **Request URL**: `https://abc123.ngrok.io/webhook/slack-command` (ngrok URL + /webhook/slack-command)
   - **Short Description**: Update North Star or Goal Metric
   - **Usage Hint**: `project:"Project Name" metric:"Metric Name" value:15.5`
6. Click **"Save"**

### Step 2: Create n8n Workflow for Slash Command

1. In n8n, create **New Workflow**
2. Add **"Webhook"** node:
   - **HTTP Method**: `POST`
   - **Path**: `slack-command`
   - **Response Mode**: `Last Node`

3. Add **"Code"** node to parse slash command:
   ```javascript
   const item = $input.first().json;
   
   // Slack slash command format
   const text = item.text || '';
   const userEmail = item.user_id || 'prembkalwale@gmail.com';
   
   // Parse: project:"E-Commerce" metric:"Conversion Rate" value:15.5
   const projectMatch = text.match(/project:"([^"]+)"/i);
   const metricMatch = text.match(/metric:"([^"]+)"/i);
   const valueMatch = text.match(/value:([\d.]+)/i);
   
   return {
     json: {
       projectName: projectMatch ? projectMatch[1] : null,
       metricName: metricMatch ? metricMatch[1] : null,
       value: valueMatch ? parseFloat(valueMatch[1]) : null,
       userEmail: userEmail,
       apiBaseUrl: 'http://localhost:7400',
       apiToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjE5MDExNzAsImV4cCI6MTc5MzQzNzE3MCwiYXVkIjoiNjhkZTEyMGQ0MWZiMDhlYzg3Njg5NDdjIiwiaXNzIjoic2NhbGV6LmluIn0.xbV2kkdy9_bmD88mD7UXb-mDPH4FO3EM3k3SXWypBUs'
     }
   };
   ```

4. Add **"HTTP Request"** node (same as Option 1, Step 5)

5. Add **"Respond to Webhook"** node:
   - **Response**: `Success! Updated {{ $json.metricName }} to {{ $json.value }}`

6. **Activate** workflow

### Step 3: Test Slash Command

In Slack, type:
```
/update-metric project:"E-Commerce Growth Platform" metric:"Conversion Rate" value:15.5
```

---

## 🎯 Quick Summary

**For Real-time Messages (Option 1)**:
- ✅ Users just type messages in channel
- ✅ Works automatically
- ⚠️ Requires ngrok + Slack Event Subscriptions

**For Slash Commands (Option 2)**:
- ✅ More structured commands
- ✅ Easier to parse
- ⚠️ Requires ngrok

**Both need ngrok to expose localhost!**

---

## 🔧 Troubleshooting

**Slack can't reach n8n**:
- Make sure ngrok is running
- Use HTTPS URL (not HTTP)
- Update Request URL in Slack app

**Messages not triggering**:
- Check workflow is **Active**
- Verify Slack app has correct permissions
- Check n8n execution logs

**Authentication errors**:
- Verify API_TOKEN is correct
- Check backend is running
- Verify user email exists in database

---

## 📝 Example Messages

**For North Star Metrics**:
- Channel message: `update north star: E-Commerce Growth Platform, Conversion Rate, 15.5`
- Slash command: `/update-metric project:"E-Commerce Growth Platform" metric:"Conversion Rate" value:15.5`

**For Goal Metrics**:
- Channel message: `update goal metric: E-Commerce Growth Platform, Improve Support, Response Time, 5.2`
- Slash command: `/update-goal-metric project:"E-Commerce" goal:"Improve Support" metric:"Response Time" value:5.2`

