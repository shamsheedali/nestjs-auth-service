# Quick Start Guide - NestJS Auth Service

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js (v18 or higher)
- ✅ npm or yarn
- ⬜ Docker Desktop (for easy database setup)
- ⬜ PostgreSQL (if not using Docker)
- ⬜ Redis (if not using Docker)
- ⬜ Mailhog (installed via Docker for email testing)

## Option 1: Using Docker (Recommended - Easiest)

### Step 1: Install Docker Desktop
If you don't have Docker installed:
- Download from: https://www.docker.com/products/docker-desktop
- Install and start Docker Desktop
- Verify installation: `docker --version`

### Step 2: Start Services
```bash
# Start PostgreSQL, Redis, pgAdmin, and Mailhog
docker-compose up -d

# Verify services are running
docker-compose ps
```

### Step 3: Access Tools
- **pgAdmin**: http://localhost:5050 (login: `admin@admin.com` / `admin`)
- **Mailhog**: http://localhost:8025 (check emails here)

---

## Option 2: Manual Installation (Without Docker)

### Step 1: Install PostgreSQL
**Windows:**
1. Download from: https://www.postgresql.org/download/windows/
2. Run installer (use default settings)
3. Remember the password you set for `postgres` user
4. Default port: 5432

**Using Chocolatey:**
```bash
choco install postgresql
```

### Step 2: Install Redis
**Windows:**
1. Download from: https://github.com/microsoftarchive/redis/releases
2. Or use Memurai (Redis alternative for Windows): https://www.memurai.com/

**Using Chocolatey:**
```bash
choco install redis-64
```

### Step 3: Install pgAdmin (Optional but Recommended)
**Windows:**
1. Download from: https://www.pgadmin.org/download/pgadmin-4-windows/
2. Run installer

**Using Chocolatey:**
```bash
choco install pgadmin4
```

### Step 4: Create Database
```sql
-- Connect to PostgreSQL using pgAdmin or psql
-- Then run:
CREATE DATABASE nestjs_auth;
```

### Step 5: Update .env File
Make sure your `.env` file has the correct credentials matching your installation.

---

## Common Setup Steps (Both Options)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Email (Using Mailhog)

The project is configured to use **Mailhog** by default for development.
- **SMTP Server**: `localhost:1025`
- **Web UI**: http://localhost:8025
- No authentication required

If you are NOT using Docker, you can install Mailhog separately or use Mailtrap.

### 3. Run Database Migrations
```bash
# This will create the database tables
npm run migration:run
```

### 4. Start the Application
```bash
# Development mode with hot reload
npm run start:dev
```

### 5. Access Swagger API Documentation
Open your browser: **http://localhost:3000/api/docs**

---

## Quick Test

### Test 1: Health Check
```bash
curl http://localhost:3000/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "info": { ... }
  }
}
```

### Test 2: Register User (via Swagger)
1. Go to http://localhost:3000/api/docs
2. Find `POST /api/v1/auth/register`
3. Click "Try it out"
4. Use this example:
   ```json
   {
     "email": "test@example.com",
     "password": "SecurePass@123",
     "firstName": "John",
     "lastName": "Doe"
   }
   ```
5. Click "Execute"

### Test 3: Verify Email
1. Go to **http://localhost:8025** (Mailhog UI)
2. You should see an email "Verify Your Email Address"
3. Copy the token or click the link
4. Use `POST /api/v1/auth/verify-email` endpoint

### Test 4: Login
1. Use `POST /api/v1/auth/login` in Swagger
2. Credentials:
   ```json
   {
     "email": "test@example.com",
     "password": "SecurePass@123"
   }
   ```
3. Copy the `accessToken` from response

### Test 5: Access Protected Route
1. Click the "Authorize" button (lock icon) in Swagger
2. Paste your access token
3. Try `GET /api/v1/auth/me`

---

## Troubleshooting

### "Cannot connect to database"
- **Docker**: Run `docker-compose ps` to check if postgres is running
- **Manual**: Check if PostgreSQL service is running in Windows Services
- Verify credentials in `.env` match your setup

### "Redis connection failed"
- **Docker**: Run `docker-compose ps` to check if redis is running
- **Manual**: Check if Redis service is running
- For Windows without Docker, consider using Memurai

### "Port already in use"
- PostgreSQL (5432): Another PostgreSQL instance might be running
- Application (3000): Another app is using port 3000
- Change ports in `.env` and `docker-compose.yml`

### "Migration failed"
- Ensure database exists: `nestjs_auth`
- Check database connection in `.env`
- Try: `npm run migration:revert` then `npm run migration:run`

---

## What's Next?

✅ Database and Redis running  
✅ Application started  
✅ Can register users  
✅ Can login and get JWT tokens  

**Next Steps:**
1. Test all authentication flows
2. Customize email templates (in `email.service.ts`)
3. Add more endpoints as needed
4. Write unit and E2E tests
5. Deploy to production

---

## Need Help?

- **Full Setup Guide**: See `DATABASE_SETUP.md`
- **API Documentation**: http://localhost:3000/api/docs (when app is running)
- **Docker Commands**: See `DATABASE_SETUP.md`

## Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Application | http://localhost:3000 | - |
| Swagger Docs | http://localhost:3000/api/docs | - |
| pgAdmin (Docker) | http://localhost:5050 | admin@admin.com / admin |
| PostgreSQL | localhost:5432 | postgres / postgres |
| Redis | localhost:6379 | redis_password |
