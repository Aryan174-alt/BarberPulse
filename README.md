# QueueNear

## Backend

From the project root in PowerShell:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
docker compose up -d
cd backend
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py runserver
```

The health endpoint is available at `http://127.0.0.1:8000/api/health/`.

## Frontend

In another PowerShell terminal:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```
