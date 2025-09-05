# SkinAI - Docker Setup (Frontend + Backend + Postgres + pgAdmin)

This package was assembled from your uploaded frontend zip and wrapped with a production-ready Docker setup.

## Folder structure
```
skinai-project/
  docker-compose.yml
  README_DOCKER.md
  backend/
    Dockerfile
    package.json
    server.js
  frontend/
    Dockerfile
    ... (your original frontend files here)
  db/
    init/
      01_schema.sql  # creates tables and seeds demo user
```
> Note: The Postgres data is stored in a **named volume** `db_data` (defined in `docker-compose.yml`).

## Run (first time)
```bash
cd skinai-project
docker compose up -d --build
```

- Frontend: http://localhost:3000
- Backend:  http://localhost:4000
- pgAdmin:  http://localhost:5050  (login: admin@admin.com / admin)

### Connect pgAdmin to Postgres
1. Open pgAdmin → Add New Server
2. General → Name: `SkinAI DB`
3. Connection:
   - Host: `db`
   - Port: `5432`
   - Username: `admin`
   - Password: `1234`
   - Maintenance DB: `skinai`

### Initialize database
The `db/init/01_schema.sql` will auto-run only on **first startup** of the database (i.e., when the volume is empty).
If you need to reset:
```bash
docker compose down -v
docker compose up -d --build
```

## API quick test
```bash
# Health
curl http://localhost:4000/health

# Login with demo user (user / pass)
curl -X POST http://localhost:4000/login -H "Content-Type: application/json"   -d '{"username":"user", "password":"pass"}'
```

## Frontend integration (Sign In / Free Trial / Logout)
- Call `POST http://localhost:4000/login` with `{ username, password }` → get `{ token, username, userId }`
- Call `POST http://localhost:4000/free-trial` → returns `{ session: "temporary", username: "Guest" }` (no DB write)
- Call `POST http://localhost:4000/logout` with `{ userId }` when a real user logs out

### Navbar behavior
- If token exists → show `Log Out` and display the `username` next to it.
- If no token → show `Sign In`.
- Center button text → change to `Free Trial` (English).

> You can store the token in memory or localStorage (for simplicity). Free Trial sessions should **not** be persisted—clear state on refresh.

## Common issues
- **Spaces in path**: `cd` into the project folder before running Compose to avoid context errors.
- **Reset everything**: `docker compose down -v && docker compose up -d --build`
- **DB init didn’t run**: Make sure you cleared volumes with `down -v`.
- **CORS**: The backend enables CORS for all origins by default (adjust as needed).
- **JWT secret**: Change `JWT_SECRET` env in `docker-compose.yml` for production.
```

