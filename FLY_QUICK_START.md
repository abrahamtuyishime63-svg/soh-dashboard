# Fly.io Manual Deployment Steps

## Quick Setup (No CLI Needed - Using Web Dashboard!)

### Option 1: Web Dashboard (EASIEST - No Installation!)

1. **Go to Fly.io**
   - Visit: https://fly.io

2. **Create Account** 
   - Click "Sign Up"
   - Email + Password

3. **Create New App**
   - Dashboard → Create App
   - Select "Deploy Docker image"
   - Choose region (e.g., "iad" for US East)

4. **Deploy Container**
   - Upload Docker image OR
   - Connect GitHub repo

5. **Add Secrets**
   - Settings → Variables
   - Add:
     ```
     GPSIOT_API_KEY=your_key
     GPSIOT_API_SECRET=your_secret
     NODE_ENV=production
     GPSIOT_POLL_INTERVAL=5000
     ```

6. **Deploy!**
   - Click Deploy
   - Wait 2-3 minutes
   - Your app is live! 🎉

---

## Option 2: Install flyctl CLI (Manual)

### Windows Installation

1. **Download flyctl**
   - Go: https://github.com/superfly/flyctl/releases
   - Download: `flyctl_windows_amd64.zip` (latest version)
   - Extract to: `C:\Program Files\flyctl\`

2. **Add to PATH**
   - Search: "Environment Variables"
   - Edit System Environment Variables
   - Under "Path", add: `C:\Program Files\flyctl`
   - Restart PowerShell

3. **Verify Installation**
   ```powershell
   flyctl version
   ```

### macOS Installation

```bash
curl -L https://fly.io/install.sh | sh
```

### Linux Installation

```bash
curl -L https://fly.io/install.sh | sh
```

---

## Deploy via CLI

```powershell
# 1. Login to Fly.io
flyctl auth login

# 2. Navigate to project
cd C:\Users\user\OneDrive\Desktop\soh-battery-dashboard\soh-dashboard

# 3. Deploy (fly.toml is already configured!)
flyctl deploy

# 4. Set secrets
flyctl secrets set GPSIOT_API_KEY=your_key
flyctl secrets set GPSIOT_API_SECRET=your_secret
flyctl secrets set NODE_ENV=production

# 5. View app
flyctl open

# 6. Watch logs
flyctl logs --follow
```

---

## Your App is Ready!

✅ **fly.toml** configured
✅ **Procfile** configured  
✅ **Git repository** ready
✅ **Code** committed

**Just deploy:**
1. Install flyctl (choose manual or web dashboard)
2. Run `flyctl deploy`
3. Add secrets
4. Done! 🚀

---

## Free Tier Includes

✅ 3 shared VMs
✅ 256MB RAM each
✅ 3GB storage
✅ 160GB bandwidth/month
✅ Global deploy
✅ Auto HTTPS

**$0/month** 💰

---

## Recommended: Web Dashboard Method

**Easiest** - No installation needed!

1. Go to https://fly.io
2. Create account
3. Create new app
4. Deploy from Git or Docker
5. Add environment variables
6. Done!

All from your browser! 🌐
