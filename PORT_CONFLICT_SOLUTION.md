# Port 5000 Conflict - Solution Guide

## Problem
Error: `EADDRINUSE: address already in use :::5000`

This happens when port 5000 is already being used by another process (usually a previous instance of the backend server).

## Quick Solutions

### Option 1: Kill Process Using Port (Windows PowerShell)
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace <PID> with actual process ID)
taskkill /PID <PID> /F

# Or use the provided script
.\kill-port.ps1
```

### Option 2: Use a Different Port
Set `PORT` environment variable in `backend/.env`:
```
PORT=5001
```

### Option 3: Automatic Port Handling (Already Implemented)
The server.ts now has better error handling and will show helpful messages if port is in use.

## Prevention
- Always stop the server properly using `Ctrl+C`
- Use `npm run dev` which includes nodemon for auto-restart
- Check running processes before starting: `netstat -ano | findstr :5000`

## Updated Server Error Handling
The server now:
- ✅ Detects port conflicts
- ✅ Shows helpful error messages
- ✅ Provides instructions to fix the issue
- ✅ Exits gracefully instead of crashing

