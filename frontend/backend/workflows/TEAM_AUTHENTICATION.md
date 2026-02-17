# Team Authentication for n8n Webhooks

## Overview

The n8n workflows support **two authentication methods** for team scenarios:

1. **Project Owner Token** (Default - Simplest)
2. **User Token from Webhook** (Flexible - Per User)

## 🔐 Authentication Methods

### Method 1: Project Owner Token (Recommended for Most Cases)

**How it works:**
- Use the **project owner's JWT token** as `API_TOKEN` environment variable
- All webhook calls will authenticate as the project owner
- Works for all team members since the owner has access to all projects

**Setup:**
```bash
# Get project owner's token
curl -X POST http://localhost:7400/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "password123"
  }'

# Set in environment (or package.json)
export API_TOKEN=owner_token_here
```

**Pros:**
- ✅ Simple - one token for all webhooks
- ✅ Works for all team members automatically
- ✅ No changes needed when new team members join

**Cons:**
- ⚠️ All actions are recorded as the owner (not individual users)

---

### Method 2: User Token from Webhook (For Individual Tracking)

**How it works:**
- Each webhook request can include the triggering user's token
- The workflow will use that user's token for authentication
- Actions are recorded under the specific user

**Webhook Payload Format:**
```json
{
  "token": "user_jwt_token_here",
  "projectId": "507f1f77bcf86cd799439011",
  "name": "Monthly Active Users",
  "shortName": "MAU",
  ...
}
```

**Setup:**
1. Set `API_TOKEN` to a default/fallback token (project owner)
2. Include `token` field in webhook payload when calling from external tools
3. If `token` is provided, it will be used; otherwise, falls back to `API_TOKEN`

**Example (Zapier/Slack Integration):**
```javascript
// When user triggers webhook from Slack
{
  "token": user.slack_user_token,  // User's JWT token
  "projectId": "...",
  "name": "...",
  ...
}
```

**Pros:**
- ✅ Individual user tracking
- ✅ Respects user permissions
- ✅ More granular audit trail

**Cons:**
- ⚠️ Requires passing token in each webhook call
- ⚠️ Each user needs their own token

---

## 🎯 Recommended Approach

### For Most Use Cases:
**Use Method 1 (Project Owner Token)**
- Set `API_TOKEN` to the project owner's token
- Simpler setup
- Works for all team members

### For Advanced Use Cases:
**Use Method 2 (User Token)**
- When you need individual user tracking
- When integrating with tools that have user context (Slack, Jira)
- When you need to respect individual permissions

---

## 🔧 How to Switch Between Methods

### Current Implementation:
The workflows support **both methods automatically**:

1. **If `token` is in webhook payload** → Uses that token (Method 2)
2. **If `token` is NOT provided** → Uses `API_TOKEN` from environment (Method 1)

### Example Workflow Logic:
```javascript
// In workflow
userToken = $json.body.token || $env.API_TOKEN
// Uses user token if provided, otherwise falls back to API_TOKEN
```

---

## 📝 Webhook Examples

### Example 1: Using Project Owner Token (Method 1)

```bash
curl -X POST http://localhost:5678/webhook/north-star-metrics \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "507f1f77bcf86cd799439011",
    "name": "Monthly Active Users",
    "shortName": "MAU",
    "description": "Total active users",
    "currentValue": 1000,
    "targetValue": 5000,
    "unit": "users"
  }'
```

*Note: No `token` field - uses `API_TOKEN` from environment*

---

### Example 2: Using User Token (Method 2)

```bash
curl -X POST http://localhost:5678/webhook/north-star-metrics \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "projectId": "507f1f77bcf86cd799439011",
    "name": "Monthly Active Users",
    "shortName": "MAU",
    "description": "Total active users",
    "currentValue": 1000,
    "targetValue": 5000,
    "unit": "users"
  }'
```

*Note: Includes `token` field - uses that token instead of `API_TOKEN`*

---

## 🔄 Getting User Tokens for Team Members

### For Each Team Member:
```bash
# Get Alice's token
curl -X POST http://localhost:7400/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice.team@example.com",
    "password": "password123"
  }'

# Get Bob's token
curl -X POST http://localhost:7400/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob.team@example.com",
    "password": "password123"
  }'
```

### Token Expiration:
- Tokens expire after **12 hours**
- Users need to re-login to get new tokens
- For long-term automation, use project owner token (Method 1)

---

## 🛠️ Integration with External Tools

### Zapier Integration:
When setting up Zapier triggers, you can:
1. **Option A**: Use project owner token (store once in Zapier)
2. **Option B**: Get user token from Zapier's user context and pass it in payload

### Slack Integration:
When a user triggers webhook from Slack:
1. Authenticate user with your backend
2. Get user's JWT token
3. Include token in webhook payload
4. Workflow uses that token for API calls

---

## 📊 Summary

| Method | Setup Complexity | User Tracking | Recommended For |
|--------|------------------|---------------|-----------------|
| **Method 1: Owner Token** | Easy (1 token) | No (all as owner) | Most use cases, simple setups |
| **Method 2: User Token** | Medium (per user) | Yes (per user) | Advanced tracking, integrations |

**Default Recommendation:** Start with Method 1, switch to Method 2 if you need individual user tracking.

