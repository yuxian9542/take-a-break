# Setup Checklist ✓

Use this checklist to ensure everything is set up correctly.

## Prerequisites
- [ ] Python 3.8+ installed (`python3 --version`)
- [ ] Node.js 16+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] GLM API key obtained from https://open.bigmodel.cn/

## Setup Steps
- [ ] Run `./setup.sh` successfully
- [ ] Create `.env` file from `env.example`
- [ ] Add your GLM_API_KEY to `.env`
- [ ] Verify `venv/` directory exists
- [ ] Verify `frontend/node_modules/` directory exists

## Verify Backend
- [ ] Run `./start_backend.sh`
- [ ] Backend starts without errors
- [ ] See "Application startup complete" message
- [ ] Backend accessible at http://localhost:8000

## Verify Frontend  
- [ ] Run `./start_frontend.sh` (in new terminal)
- [ ] Frontend starts without errors
- [ ] See "Local: http://localhost:5173/" message
- [ ] Can open http://localhost:5173 in browser

## Test Application
- [ ] Click "Start Chat" button
- [ ] Browser asks for microphone permission
- [ ] Grant microphone permission
- [ ] Speak into microphone
- [ ] See "🎤 Transcribing..." appear
- [ ] Hear AI voice response
- [ ] See transcript update with your words
- [ ] Can have multi-turn conversation
- [ ] Click "End Chat" to stop

## Common Issues

### Backend won't start
- Check `.env` file exists and has valid API key
- Verify virtual environment: `source venv/bin/activate` then `which python`
- Check ports: `lsof -i :8000` (kill if needed)

### Frontend won't start  
- Check node_modules: `cd frontend && npm install`
- Clear cache: `rm -rf node_modules package-lock.json && npm install`
- Check ports: `lsof -i :5173` (kill if needed)

### No microphone access
- Check browser settings (must be HTTPS or localhost)
- Grant microphone permissions when prompted
- Check system microphone settings

### Transcription not appearing
- Check backend logs for Whisper model download
- First run may be slow (downloading model)
- Verify internet connection for API calls

### No audio playback
- Check browser audio settings
- Verify speakers/headphones connected
- Check browser console for errors (F12)

## Success Criteria
✓ Both backend and frontend running  
✓ Can click "Start Chat" without errors  
✓ Microphone captures audio  
✓ Transcripts appear (even if slowly first time)  
✓ Audio responses play  
✓ Multi-turn conversation works  

## Getting Help
1. Check backend terminal for error messages
2. Check frontend browser console (F12)
3. Review `README.md` for detailed documentation
4. Verify API key has credits at https://open.bigmodel.cn/

---

**Quick Commands Reference:**
```bash
./setup.sh              # Initial setup
./start_backend.sh      # Start backend (Terminal 1)
./start_frontend.sh     # Start frontend (Terminal 2)
```

