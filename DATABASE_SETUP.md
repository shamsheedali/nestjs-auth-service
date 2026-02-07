# Database Setup Guide

## Quick Start with Docker

### 1. Start PostgreSQL, Redis, and pgAdmin

```bash
# Start all services
docker-compose up -d

# Check if services are running
docker-compose ps

# View logs
docker-compose logs -f
```

### 2. Access pgAdmin

1. Open your browser and go to: **http://localhost:5050**
2. Login with:
   - **Email**: `admin@admin.com`
   - **Password**: `admin`

### 3. Connect to PostgreSQL in pgAdmin

1. Right-click on "Servers" → "Register" → "Server"
2. **General Tab**:
   - Name: `NestJS Auth DB`
3. **Connection Tab**:
   - Host: `postgres` (or `localhost` if connecting from outside Docker)
   - Port: `5432`
   - Database: `nestjs_auth`
   - Username: `postgres`
   - Password: `postgres`
4. Click "Save"

### 4. Run Database Migrations

```bash
# Generate initial migration
npm run migration:generate -- src/migrations/InitialSchema

# Run migrations
npm run migration:run
```

### 5. Start the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### 6. Access Swagger Documentation

Open your browser and go to: **http://localhost:3000/api/docs**

## Service URLs

- **Application**: http://localhost:3000
- **Swagger API Docs**: http://localhost:3000/api/docs
- **pgAdmin**: http://localhost:5050
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Docker Commands

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v

# Restart services
docker-compose restart

# View logs for specific service
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f pgadmin
```

## Email Configuration (Optional)

For testing email functionality, you have several options:

### Option 1: Mailtrap (Recommended for Development)
1. Sign up at https://mailtrap.io (free tier available)
2. Get your SMTP credentials
3. Update `.env`:
   ```env
   MAIL_HOST=smtp.mailtrap.io
   MAIL_PORT=2525
   MAIL_USER=your-mailtrap-username
   MAIL_PASSWORD=your-mailtrap-password
   ```

### Option 2: Gmail (For Testing)
1. Enable 2FA on your Google account
2. Generate an App Password
3. Update `.env`:
   ```env
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_SECURE=true
   MAIL_USER=your-email@gmail.com
   MAIL_PASSWORD=your-app-password
   ```

### Option 3: MailHog (Local Email Testing)
Add to `docker-compose.yml`:
```yaml
  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
```

Then update `.env`:
```env
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_SECURE=false
```

## Testing the API

### 1. Register a New User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass@123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### 2. Verify Email (use token from email or database)
```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token": "your-verification-token"}'
```

### 3. Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass@123"
  }'
```

### 4. Access Protected Route
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Troubleshooting

### PostgreSQL Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Connect to PostgreSQL directly
docker exec -it nestjs-auth-postgres psql -U postgres -d nestjs_auth
```

### Redis Connection Issues
```bash
# Check if Redis is running
docker-compose ps redis

# Test Redis connection
docker exec -it nestjs-auth-redis redis-cli -a redis_password ping
```

### Application Won't Start
1. Check if `.env` file exists and has correct values
2. Ensure PostgreSQL and Redis are running
3. Check application logs for specific errors
4. Verify all dependencies are installed: `npm install`

## Database Management

### View Data in pgAdmin
1. Navigate to: Servers → NestJS Auth DB → Databases → nestjs_auth → Schemas → public → Tables
2. Right-click on a table → View/Edit Data → All Rows

### Useful SQL Queries

```sql
-- View all users
SELECT id, email, "firstName", "lastName", "isEmailVerified", role, "createdAt" 
FROM "user" 
WHERE "deletedAt" IS NULL;

-- View refresh tokens
SELECT id, token, "userId", "expiresAt", "createdAt" 
FROM refresh_token;

-- Manually verify a user's email
UPDATE "user" 
SET "isEmailVerified" = true, "emailVerificationToken" = NULL 
WHERE email = 'test@example.com';
```

## Next Steps

1. ✅ Start Docker services
2. ✅ Access pgAdmin and connect to database
3. ✅ Update `.env` with email credentials (optional)
4. ✅ Run migrations
5. ✅ Start the application
6. ✅ Test endpoints via Swagger UI
7. ⬜ Write unit tests
8. ⬜ Write E2E tests
9. ⬜ Deploy to production
