# PostgreSQL Setup Guide for Odoo Cafe POS

## Windows Setup Instructions

### 1. Install PostgreSQL
- Download from: https://www.postgresql.org/download/windows/
- Run the installer
- **Important**: Remember the password you set for the `postgres` user
- Default installation folder is usually: `C:\Program Files\PostgreSQL\16`
- Install pgAdmin 4 (included in the installer)

### 2. Start PostgreSQL Service
- Press `Win + R` and type `services.msc`
- Find "PostgreSQL" service
- Right-click and select "Start"
- Or use Command Prompt: `net start postgresql-x64-16` (version may differ)

### 3. Open pgAdmin 4 Dashboard
- Find pgAdmin 4 in your applications
- Open it in your browser (usually http://localhost/pgadmin4)
- Login with the email and password you set during installation

### 4. Create Database
Option A (Using pgAdmin):
1. Right-click on "Databases" → Create → Database
2. Name: `odoo_cafe`
3. Click "Save"

Option B (Using Command Prompt):
```bash
psql -U postgres
```
Then enter your postgres password, and run:
```sql
CREATE DATABASE odoo_cafe;
\q
```

### 5. Verify Connection
Test the DATABASE_URL in your .env file:
```
postgresql://postgres:password@localhost:5432/odoo_cafe
```
Replace `password` with your actual postgres password.

### 6. Run Database Migrations
```bash
cd server
npm run db:push
npm run prisma:seed
```

## Troubleshooting

**Error: "Could not connect to the database"**
- Make sure PostgreSQL service is running
- Check your DATABASE_URL in .env
- Verify postgres username and password

**Port already in use**
- PostgreSQL default port is 5432
- If in use, you can change it in postgresql.conf file

**Permission denied**
- Make sure you're running the command prompt as Administrator
