# QueueNear

QueueNear helps customers compare nearby barber shops by live queue, estimated wait, and service prices. Shop owners can update queue status, while a small rule-based assistant helps filter shop searches.

## Run with Docker

1. Copy `.env.example` to `.env` if you do not already have a local environment file.
2. Start Docker Desktop.
3. From the project root, run:

   ```powershell
   docker compose up --build
   ```

Docker starts PostgreSQL, applies Django migrations, seeds eight Jaipur demo shops, and serves the API and Vite frontend.

- Frontend: http://localhost:5173
- API health: http://localhost:8000/api/health/
- Django admin: http://localhost:8000/admin/

## Run locally on Windows

Start PostgreSQL with `docker compose up -d db`, then from the project root:

```powershell
py -3.13 -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
cd backend
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py seed_shops
.\.venv\Scripts\python.exe manage.py runserver
```

In another terminal:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

To create an administrator, run `.\.venv\Scripts\python.exe manage.py createsuperuser` from `backend/`. Create a shop in Django admin and select its owner account to enable the owner dashboard.

## Quality checks

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m assistant.eval.run_eval
.\.venv\Scripts\locust.exe -f loadtests\locustfile.py --host http://127.0.0.1:8000
```

```powershell
cd frontend
npm.cmd run build
```

## Important notes

- `.env` contains local secrets and is ignored by Git. Never commit it.
- Queue waits are estimates based on queue entries, service duration, and active barbers.
- The seed shops and prices are demo data, not live business listings.
- Walk-in queue entries are rate-limited. Customer queue joins require a JWT.
