# CLOUD SHELL DEPLOYMENT - COPY & PASTE READY

## The ONE Command to Deploy Everything

```bash
git clone https://github.com/Direwolfe999/Kinesis.git && cd Kinesis && export GOOGLE_API_KEY="YOUR_KEY_HERE" && chmod +x setup_env.sh && ./setup_env.sh && BACKEND_PORT=8080 python3 backend/main_production.py
```

**Replace `YOUR_KEY_HERE` with your actual key from: https://aistudio.google.com/apikey**

---

## Step-by-Step (If One-Command Fails)

### Step 1: Clone the Repo
```bash
git clone https://github.com/Direwolfe999/Kinesis.git
cd Kinesis
```

### Step 2: Export Your API Key
```bash
export GOOGLE_API_KEY="your_actual_key_from_aistudio"
```

### Step 3: Run Setup Script
```bash
chmod +x setup_env.sh
./setup_env.sh
```

### Step 4: Start Backend
```bash
BACKEND_PORT=8080 python3 backend/main_production.py
```

### Step 5: Open Web Preview
- Click **Web Preview** button (top-right of Cloud Shell)
- Select **port 8080**
- New tab opens with Kinesis UI

---

## Link to Your Own Project

Change the GitHub URL from:
```bash
git clone https://github.com/Direwolfe999/Kinesis.git
```

To your fork:
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

The rest stays the same. API key config stays the same. Everything else automatic.

---

## If It Fails

```bash
# Check API key
echo $GOOGLE_API_KEY

# Check Python version
python3 --version

# Check if port 8080 is free
lsof -i :8080

# Restart (kill old process first)
pkill -f "python3 backend"
sleep 2
BACKEND_PORT=8080 python3 backend/main_production.py
```

---

## What Each Part Does

| Command | Purpose |
|---------|---------|
| `git clone` | Download your repo |
| `cd Kinesis` | Enter directory |
| `export GOOGLE_API_KEY` | Set API authentication |
| `chmod +x setup_env.sh` | Make script executable |
| `./setup_env.sh` | Auto-install dependencies |
| `BACKEND_PORT=8080` | Configure for Cloud Shell |
| `python3 backend/main_production.py` | Start the server |

---

## Success Indicators

You'll see:
```
INFO:     Uvicorn running on http://0.0.0.0:8080
INFO:     ✅ Kinesis backend initialized
INFO:     Application startup complete
```

Then Web Preview → port 8080 should load the UI.

---

## Next: Record Your Demo

1. Allow microphone/camera when browser asks
2. Click "Enter Kinesis"
3. Ask Kinesis questions
4. Interrupt mid-response (barge-in demo)
5. Show system logs (F12 → Console)
6. Record everything with ScreenFlow or OBS
7. Upload to YouTube
8. Submit to Devpost with GitHub URL

---

**That's it! No complex setup. No Docker. No configuration files to edit. Just paste, run, record, submit.**
