# Distribution Guide

This package is designed to be **fully portable** and can be shared/deployed anywhere.

## Package Contents

The `simple/` folder is completely standalone with:
- ✅ All source code
- ✅ Dependency lists (requirements.txt, package.json)
- ✅ Setup and run scripts with relative paths
- ✅ Complete documentation
- ✅ No hard-coded absolute paths

## How to Share

### Method 1: Direct Copy
```bash
# Copy the entire simple folder
cp -r simple/ /path/to/destination/
```

### Method 2: Create Archive
```bash
# Create a zip file
cd voice_call
zip -r glm4-voice-demo.zip simple/ -x "simple/venv/*" -x "simple/frontend/node_modules/*" -x "simple/.env.local" -x "simple/backend/__pycache__/*"

# Or create a tar.gz
tar -czf glm4-voice-demo.tar.gz simple/ --exclude="simple/venv" --exclude="simple/frontend/node_modules" --exclude="simple/.env.local" --exclude="simple/backend/__pycache__"
```

### Method 3: Git Repository
```bash
cd simple
git init
git add .
git commit -m "Initial commit: GLM-4-Voice Real-time Chat Demo"
git remote add origin <your-repo-url>
git push -u origin main
```

## Files to Exclude When Distributing

**Always exclude** (already in .gitignore):
- `venv/` - Virtual environment (recreate with setup.sh)
- `frontend/node_modules/` - Node packages (recreate with npm install)
- `.env.local` - API keys (user must create their own)
- `backend/__pycache__/` - Python cache
- `*.log` - Log files

**Include these important files**:
- `.env.example` - Template for .env.local
- All `.sh` scripts
- All `.md` documentation
- `requirements.txt`
- `frontend/package.json`
- All source code

## For Recipients

Once someone receives the package:

```bash
# 1. Extract (if archived)
unzip glm4-voice-demo.zip
# or
tar -xzf glm4-voice-demo.tar.gz

# 2. Navigate to folder
cd simple

# 3. Setup (works from any location!)
./setup.sh

# 4. Configure
cp .env.example .env.local
# Edit .env.local and add GLM_API_KEY

# 5. Run
./start_backend.sh    # Terminal 1
./start_frontend.sh   # Terminal 2
```

## Deployment to Server

### Development Mode
Same as local setup - just run the scripts!

### Production Mode

**Backend:**
```bash
cd simple
source venv/bin/activate
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Frontend:**
```bash
cd simple/frontend
npm run build
# Serve the dist/ folder with nginx/apache
```

**Or use Docker** (create Dockerfile):
```dockerfile
# Backend
FROM python:3.10
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# Frontend (separate container)
FROM node:18
WORKDIR /app
COPY frontend/package*.json .
RUN npm install
COPY frontend/ .
RUN npm run build
CMD ["npm", "run", "preview"]
```

## License & Credits

When distributing, ensure you:
- Include attribution to GLM-4-Voice API (ZhipuAI)
- Note that OpenAI Whisper is used (MIT License)
- Include any required license files

## Customization Before Sharing

You may want to:
1. Update `README.md` with your specific instructions
2. Modify `config.py` defaults for your use case
3. Add your organization's branding to the frontend
4. Include example API key instructions for your users

## Support

Users should refer to:
- `QUICKSTART.md` - Quick 3-step guide
- `README.md` - Full documentation
- Backend logs for debugging

## File Integrity Check

After distribution, recipients can verify they have all necessary files:

```bash
cd simple

# Check structure
ls -la
# Should see: backend/, frontend/, *.sh, *.md, requirements.txt, .env.example

# Check backend
ls backend/
# Should see: main.py, glm_voice_client.py, audio_utils.py, vad.py, config.py, session_manager.py

# Check frontend
ls frontend/
# Should see: package.json, src/, index.html, vite.config.ts
```

All scripts use relative paths, so they work from any installation location! 🚀
