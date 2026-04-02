# Start backend (FastAPI with uvicorn)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "
cd D:\kenslin\stifdb3\backend;
.\venv\Scripts\Activate.ps1;
uvicorn main:app --host 0.0.0.0 --port 8000
"

# Start frontend (React/Vite/etc.)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "
cd D:\kenslin\stifdb3\frontend;
npm install;
npm run dev
"