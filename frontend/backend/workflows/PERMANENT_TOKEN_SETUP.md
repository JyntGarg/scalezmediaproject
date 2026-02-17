# Permanent Webhook Token Setup (No Client Management Required)

## 🎯 Problem Solved

**Before:** Clients had to manually get JWT tokens and update n8n every 12 hours (tokens expire).

**Now:** Generate a **long-lived token (1 year)** once, and it works automatically - **no client management needed!**

---

## 🚀 Quick Setup (One-Time)

### Step 1: Generate Permanent Token

```bash
cd /Users/dnyaneshwarwantace/Downloads/scalez_new_phase/backend
npm run webhook:generate-token
```

This will:
- ✅ Find your project owner (John Doe)
- ✅ Generate a token that expires in **1 year** (not 12 hours)
- ✅ Save it to `.env.webhook` file
- ✅ Display the token for you to copy

### Step 2: Start n8n with Auto-Loaded Token

```bash
npm run webhook:start
```

This automatically:
- ✅ Loads the token from `.env.webhook`
- ✅ Sets `API_TOKEN` environment variable
- ✅ Starts n8n with the token ready to use

---

## 📋 How It Works

### The Solution:

1. **Long-Lived Token** (1 year expiry instead of 12 hours)
2. **Auto-Loaded** from `.env.webhook` file
3. **No Manual Updates** - set once, works for 1 year
4. **Client Doesn't Need to Know** - you handle it once on setup

### File Structure:

```
backend/
├── .env.webhook          ← Auto-generated token file (1 year expiry)
├── scripts/
│   └── generate-webhook-token.js  ← Script to generate token
└── package.json          ← New scripts added
```

---

## 🔧 Manual Setup (Alternative)

If you prefer to set it up manually:

### Option A: Use Generated Token in package.json

1. Run: `npm run webhook:generate-token`
2. Copy the token from output
3. Edit `package.json`:
   ```json
   "n8n": "N8N_SECURE_COOKIE=false API_BASE_URL=http://localhost:7400 API_TOKEN=YOUR_GENERATED_TOKEN n8n start"
   ```
4. Run: `npm run n8n`

### Option B: Use .env.webhook File

1. Run: `npm run webhook:generate-token`
2. Use the auto-start script: `npm run webhook:start`
3. Done! Token loads automatically

---

## 🔄 Token Refresh (Once Per Year)

The token expires after **1 year**. When it expires:

1. Run: `npm run webhook:generate-token` (generates new token)
2. Restart n8n: `npm run webhook:start`
3. Done! Works for another year

**Note:** You'll only need to do this once per year, not every 12 hours!

---

## 📝 Environment Variables

The `.env.webhook` file contains:

```env
# Webhook API Token (Auto-generated - Valid for 1 year)
API_BASE_URL=http://localhost:7400
API_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

These are automatically loaded when you run `npm run webhook:start`.

---

## 🎯 For Clients

**What clients need to know:**
- ✅ Nothing! They don't need to manage tokens
- ✅ Webhooks just work
- ✅ You (the developer) set it up once

**What you (developer) do:**
1. Run `npm run webhook:generate-token` once
2. Use `npm run webhook:start` to start n8n
3. That's it! Token works for 1 year

---

## 🔐 Security Notes

- ✅ Token is stored locally in `.env.webhook` (already in `.gitignore`)
- ✅ Token is specific to project owner account
- ✅ Token expires after 1 year (can be regenerated)
- ✅ Same permissions as project owner (can access all projects)

---

## 🐛 Troubleshooting

### Token expired?
```bash
npm run webhook:generate-token  # Generate new one
npm run webhook:start           # Restart with new token
```

### User not found?
The script looks for `john.doe@example.com` by default. To use a different user:
```bash
WEBHOOK_OWNER_EMAIL=other@example.com npm run webhook:generate-token
```

### File not found?
Make sure you're in the `backend/` directory:
```bash
cd /Users/dnyaneshwarwantace/Downloads/scalez_new_phase/backend
npm run webhook:generate-token
```

---

## ✅ Summary

**Old Way:**
- ❌ Get token manually every 12 hours
- ❌ Update n8n environment variables
- ❌ Client needs to know about n8n

**New Way:**
- ✅ Generate token once (valid 1 year)
- ✅ Auto-loads when starting n8n
- ✅ Client doesn't need to know anything
- ✅ Works automatically

**Setup Time:** 2 minutes (once)
**Maintenance:** Once per year

