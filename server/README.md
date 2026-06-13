# Odoo Cafe POS - Backend Setup & Testing Guide

## Quick Start

### 1. Prerequisites
- Node.js (v16+)
- PostgreSQL 12+ 
- npm or yarn

### 2. Install Dependencies
```bash
cd server
npm install
```

### 3. Setup PostgreSQL Database

#### Windows (Using pgAdmin 4):
1. **Install PostgreSQL**
   - Download from: https://www.postgresql.org/download/windows/
   - During installation, set password for `postgres` user (remember this!)
   - Install pgAdmin 4 when prompted

2. **Start PostgreSQL Service**
   - Search for "Services" in Windows
   - Find "postgresql-x64-16" (or your version)
   - Right-click → Start

3. **Create Database**
   - Open pgAdmin 4
   - Right-click "Databases" → Create → Database
   - Name: `odoo_cafe`
   - Click Save

4. **Update .env file**
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/odoo_cafe"
   ```
   Replace `YOUR_PASSWORD` with your postgres password

#### Mac/Linux:
```bash
# Install PostgreSQL (using Homebrew on Mac)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb odoo_cafe

# Update DATABASE_URL in .env if needed
```

### 4. Initialize Database

```bash
cd server

# Generate Prisma Client
npm run prisma:generate

# Push schema to database
npm run db:push

# Seed initial data
npm run prisma:seed
```

### 5. Start Backend Server

```bash
cd server
npm run dev
```

Server will run at: **http://localhost:5000**

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer YOUR_TOKEN
```

### Key Endpoints

#### Auth
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get current user
- `GET /auth/employees` - List all employees
- `PUT /auth/profile` - Update profile
- `DELETE /auth/employees/:id` - Archive employee

#### Products & Categories
- `GET /products` - List products
- `POST /products` - Create product
- `GET /products/:id` - Get product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product
- `GET /categories` - List categories
- `POST /categories` - Create category
- `GET /products/kds/items` - Get KDS items

#### Orders
- `POST /orders` - Create order
- `GET /orders/:id` - Get order
- `GET /orders/by-session/:sessionId` - Get session orders
- `PUT /orders/:id/status` - Update order status
- `POST /orders/:id/items` - Add item to order
- `DELETE /orders/items/:orderItemId` - Remove item from order
- `PUT /orders/:id/discount` - Apply discount

#### Sessions
- `POST /sessions` - Create session
- `GET /sessions` - List all sessions
- `GET /sessions/:id` - Get session
- `GET /sessions/my-open` - Get current open session
- `PUT /sessions/:id/close` - Close session

#### Kitchen
- `GET /kitchen/orders` - Get all kitchen orders
- `GET /kitchen/orders/:orderId` - Get order kitchen items
- `PUT /kitchen/orders/:id/status` - Update KDS order status
- `PUT /kitchen/orders/:id/assign` - Assign chef to order
- `PUT /kitchen/orders/:id/complete` - Complete KDS order

#### Tables & Floors
- `GET /floors` - List floors
- `POST /floors` - Create floor
- `GET /tables` - List all tables
- `GET /tables/floor/:floorId` - Get floor tables
- `POST /tables` - Create table

#### Coupons
- `GET /coupons` - List coupons
- `POST /coupons` - Create coupon
- `GET /coupons/:code` - Validate coupon

## Test Workflow

### 1. Register & Login
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Save the token from response
```

### 2. Create Session
```bash
curl -X POST http://localhost:5000/api/sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 3. Create Order
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_ID",
    "employeeId": "YOUR_USER_ID",
    "items": [
      {
        "productId": "PRODUCT_ID",
        "quantity": 2
      }
    ]
  }'
```

## Frontend Integration

Update your frontend `.env`:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

Example fetch call:
```javascript
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@odoocafe.com',
    password: 'admin123'
  })
});
const data = await response.json();
localStorage.setItem('token', data.data.token);
```

## Database Schema

Tables created:
- `users` - Staff members
- `categories` - Product categories
- `products` - Menu items
- `floors` - Restaurant floors
- `tables` - Dining tables
- `sessions` - Cash drawer sessions
- `orders` - Customer orders
- `order_items` - Items in orders
- `kitchen_orders` - KDS orders
- `coupons` - Discount coupons
- `payment_methods` - Payment types

## Troubleshooting

### "Could not connect to the database"
1. Check PostgreSQL is running (Services → postgresql)
2. Verify DATABASE_URL in .env
3. Ensure database `odoo_cafe` exists
4. Check postgres password is correct

### "Port 5000 already in use"
```bash
# Kill process on port 5000
# Windows: netstat -ano | findstr :5000
# Then: taskkill /PID XXXX /F

# Or change PORT in .env
```

### "Module not found"
```bash
npm install
npm run prisma:generate
```

## Development Tips

- Use Postman or Insomnia to test APIs
- Check `uploads/` folder for product images
- Logs show in console with `npm run dev`
- Reset database: `npm run db:push -- --force-reset` (⚠️ deletes data!)

## Default Credentials (After Seed)
- Email: `admin@odoocafe.com`
- Password: `admin123`
