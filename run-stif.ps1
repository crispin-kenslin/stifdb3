# Start backend
Start-Process powershell -ArgumentList "-NoExit", "-Command `"Set-Location 'C:\Users\CRISPIN JOE KENSLIN\Documents\COLLEGE\Biotechnology\VIII Semester\stifdb3\backend'; .\venv\Scripts\Activate.ps1; uvicorn main:app --host 0.0.0.0 --port 8000`""

# Start frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command `"Set-Location 'C:\Users\CRISPIN JOE KENSLIN\Documents\COLLEGE\Biotechnology\VIII Semester\stifdb3\frontend'; npm install; npm run dev`""