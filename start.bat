@echo off
echo ==========================================================
echo Starting Help Desk Management System (Full-Stack)
echo ==========================================================
echo.
echo Starting Backend Server on http://127.0.0.1:5000...
start "Help Desk Backend (Flask)" cmd /k "cd backend && .\venv\Scripts\python.exe run.py"

echo Starting Frontend Server on http://127.0.0.1:5173...
start "Help Desk Frontend (Vite React)" cmd /k "cd frontend && npm run dev"

echo.
echo ==========================================================
echo Both servers started!
echo Frontend: http://localhost:5173
echo Backend API: http://127.0.0.1:5000
echo ==========================================================
pause

