# Production Deployment: Backend + n8n Setup

## 🎯 Answer: Run Both Services, nginx Routes to Both

**On your server:**
- ✅ Backend API runs on port 7400
- ✅ n8n runs on port 5678
- ✅ nginx routes to both (reverse proxy)

---

## 🏗️ Server Architecture

```
Internet
   ↓
nginx (Port 80/443) ← Public access
   ↓
   ├──→ Backend API (Port 7400) → Supabase
   └──→ n8n (Port 5678) → Calls Backend API
```

---

## 📦 What Runs on Server

### 1. Backend API Service
- **Port:** 7400 (internal)
- **Public URL:** `https://api.scalez.in` (via nginx)
- **Runs with:** PM2 or systemd

### 2. n8n Service
- **Port:** 5678 (internal)
- **Public URL:** `https://webhooks.scalez.in` or `https://api.scalez.in/webhooks` (via nginx)
- **Runs with:** PM2 or systemd

### 3. nginx (Reverse Proxy)
- **Port:** 80/443 (public)
- **Routes:**
  - `/api/*` → Backend API (port 7400)
  - `/webhooks/*` → n8n (port 5678)

---

## 🔧 nginx Configuration Example

### Option 1: Separate Subdomain

```nginx
# Backend API
server {
    listen 80;
    server_name api.scalez.in;
    
    location / {
        proxy_pass http://localhost:7400;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# n8n Webhooks
server {
    listen 80;
    server_name webhooks.scalez.in;
    
    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Webhook URLs:**
- `https://webhooks.scalez.in/webhook/north-star-metrics`
- `https://webhooks.scalez.in/webhook/goal-metrics`

---

### Option 2: Same Domain, Different Paths

```nginx
server {
    listen 80;
    server_name api.scalez.in;
    
    # Backend API routes
    location /api/ {
        proxy_pass http://localhost:7400;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # n8n webhook routes
    location /webhook/ {
        proxy_pass http://localhost:5678/webhook/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Webhook URLs:**
- `https://api.scalez.in/webhook/north-star-metrics`
- `https://api.scalez.in/webhook/goal-metrics`

---

## 🚀 Running Services on Server

### Option 1: Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start Backend API
cd /path/to/backend
pm2 start app.js --name "backend-api"

# Start n8n
cd /path/to/backend
pm2 start npm --name "n8n" -- run n8n

# Save PM2 configuration
pm2 save
pm2 startup  # Auto-start on server reboot
```

### Option 2: Using systemd

**Backend Service** (`/etc/systemd/system/backend-api.service`):
```ini
[Unit]
Description=Backend API Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/backend
ExecStart=/usr/bin/node app.js
Restart=always

[Install]
WantedBy=multi-user.target
```

**n8n Service** (`/etc/systemd/system/n8n.service`):
```ini
[Unit]
Description=n8n Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/backend
Environment="API_BASE_URL=https://api.scalez.in"
Environment="API_TOKEN=your_permanent_token"
ExecStart=/usr/bin/npm run n8n
Restart=always

[Install]
WantedBy=multi-user.target
```

**Enable and start:**
```bash
sudo systemctl enable backend-api
sudo systemctl enable n8n
sudo systemctl start backend-api
sudo systemctl start n8n
```

---

## 📝 Environment Variables on Server

PORT=7400
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
ACCESS_TOKEN_SECRET=your_secret

### n8n (in systemd or package.json):
```bash
API_BASE_URL=https://api.scalez.in
API_TOKEN=your_permanent_token
N8N_SECURE_COOKIE=true  # Use true for HTTPS
N8N_HOST=0.0.0.0
N8N_PORT=5678
```

---

## 🔐 SSL/HTTPS Setup

### Using Let's Encrypt with Certbot:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.scalez.in -d webhooks.scalez.in

# Auto-renewal
sudo certbot renew --dry-run
```

---

## ✅ Production Checklist

- [ ] Backend API running on port 7400 (PM2/systemd)
- [ ] n8n running on port 5678 (PM2/systemd)
- [ ] nginx configured and running
- [ ] SSL certificates installed
- [ ] Environment variables set (API_TOKEN, etc.)
- [ ] Firewall configured (allow ports 80, 443)
- [ ] Services auto-start on reboot (PM2 startup or systemd enable)
- [ ] Webhook URLs updated in workflows to use production domain

---

## 🎯 Summary

**What you need on server:**
1. ✅ Run Backend API (port 7400)
2. ✅ Run n8n (port 5678)
3. ✅ Configure nginx to route to both

**nginx doesn't run the services** - it just routes traffic to them!

**Both services run independently:**
- Backend: Your API server
- n8n: Webhook server

**nginx acts as reverse proxy** - receives requests and forwards to correct service.

---

## 💡 Simple Deployment Flow

1. **Install dependencies on server:**
   ```bash
   # Backend
   cd backend && npm install
   
   # n8n is already in backend/node_modules (from npm install)
   ```

2. **Start both services:**
   ```bash
   # Option 1: PM2
   pm2 start app.js --name backend
   pm2 start "npm run n8n" --name n8n
   
   # Option 2: Two separate terminal sessions
   # Terminal 1:
   npm start  # Backend on 7400
   
   # Terminal 2:
   npm run n8n  # n8n on 5678
   ```

3. **Configure nginx:**
   - Routes `/api/*` → localhost:7400
   - Routes `/webhook/*` → localhost:5678

4. **Done!** ✅

Both services run, nginx routes traffic to them!

