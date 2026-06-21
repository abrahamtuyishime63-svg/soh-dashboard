# Railway Deployment Guide

🚀 **Fastest way to deploy**: Railway deploys from GitHub with zero configuration!

## Quick Deploy (5 minutes)

### Step 1: Push Code to GitHub

```bash
# Create a new repository on GitHub (https://github.com/new)
# Don't initialize with README

# In your project directory:
cd soh-dashboard
git remote add origin https://github.com/YOUR-USERNAME/soh-dashboard.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Railway

1. Go to **https://railway.app**
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub"**
4. Authorize Railway to access your GitHub account
5. Select the **`soh-dashboard`** repository
6. Railway automatically detects Node.js and deploys!

### Step 3: Add Environment Variables

In Railway dashboard:

1. Click on your **Deployments**
2. Go to **Settings**
3. Click **"Variables"**
4. Add your GPS IoT credentials:

```
GPSIOT_API_KEY=your_api_key_here
GPSIOT_API_SECRET=your_api_secret_here
GPSIOT_POLL_INTERVAL=5000
NODE_ENV=production
```

5. Click **"Save"**
6. Railway auto-redeploys with new variables!

### Step 4: Access Your App

Your app is live at: `https://your-app-name.railway.app`

**Example endpoints:**
- Dashboard: `https://your-app-name.railway.app/`
- API: `https://your-app-name.railway.app/api/health`
- GPS IoT: `https://your-app-name.railway.app/api/gpsiot/status`

---

## Features

✅ **Zero Config** - Auto-detects Node.js  
✅ **Git Auto-Deploy** - Push to main = auto-deploy  
✅ **Environment Variables** - Easy secret management  
✅ **Free Tier** - $5/month free credits  
✅ **Auto SSL** - HTTPS included  
✅ **Logs** - Real-time logging in dashboard  
✅ **Metrics** - CPU, Memory, Disk monitoring  

---

## Production Configuration

### 1. Build Script

Railway reads `package.json` scripts:

```json
{
  "scripts": {
    "start": "node api/server.js",
    "build": "npm run build",
    "dev": "concurrently \"node api/server.js\" \"npx vite\""
  }
}
```

✅ Our `package.json` is already configured!

### 2. Port Configuration

Railway sets `$PORT` environment variable. Update `api/server.js`:

```javascript
const PORT = process.env.PORT || 3001;
```

✅ Already done in our server!

### 3. Health Checks

Railway uses `/api/health` for monitoring:

```bash
GET https://your-app-name.railway.app/api/health
```

Should return:
```json
{
  "ok": true,
  "uptime": 123.45,
  "timestamp": "2026-06-21T..."
}
```

✅ Already implemented!

---

## Monitoring & Logs

### View Logs in Railway

```bash
# Install Railway CLI (optional)
npm install -g @railway/cli

# Login
railway login

# View logs
railway logs
```

### Or use Web Dashboard

1. Go to Railway dashboard
2. Click your project
3. Click **"View Logs"** tab
4. Watch real-time logs

---

## Troubleshooting

### App crashes after deploy

Check logs: **Railway Dashboard → Logs**

Common issues:
- Missing environment variables
- Port already in use (Railway sets `$PORT`)
- Memory limit exceeded

### GPS IoT not connecting

1. Verify credentials in **Variables**
2. Check logs for auth errors
3. Ensure GPS IoT API is accessible (it should work from anywhere)

### Slow deployment

Railway builds on first deploy (~2-3 min). Subsequent deploys are faster.

---

## Cost

| Resource | Free Tier | After Credits |
|----------|-----------|---------------|
| Compute | $5/month | $0.50/hour |
| Disk (per GB) | $5/month | $0.50/month |
| Outbound | Included | $0.10/GB |

**Recommendation**: Start with free tier, upgrade to paid if needed.

---

## Advanced: Custom Domain

1. Buy domain (GoDaddy, Namecheap, etc.)
2. In Railway: **Project Settings → Domain**
3. Add your domain
4. Update DNS records (Railway shows instructions)
5. HTTPS auto-configured! 🔒

---

## GitHub Auto-Deploy

Every time you push to `main`:

```bash
git add .
git commit -m "Update: Add new feature"
git push origin main
# Railway auto-deploys! 🚀
```

Turn off auto-deploy in **Railway Settings** if needed.

---

## Backup & Recovery

### Export Database (if using Railway PostgreSQL)

```bash
railway run pg_dump > backup.sql
```

### Rollback to Previous Deployment

In Railway dashboard:
1. Click **Deployments**
2. Select previous deployment
3. Click **"Redeploy"**

Done! ✅

---

## Support

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: Community support
- **Your App Docs**: See other markdown files in this repo

---

**Status**: ✅ Ready to deploy on Railway!

Next: Push your code to GitHub, then deploy from Railway dashboard.
