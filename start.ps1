# Help Desk Management System Quick Launcher
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Starting Help Desk Management System (Full-Stack)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\python.exe run.py"

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Servers started in new windows!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend API: http://127.0.0.1:5000" -ForegroundColor Yellow

