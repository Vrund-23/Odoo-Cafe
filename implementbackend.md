# Backend Implementation Plan for Odoo Cafe POS

## **Technology Stack**
- **Runtime**: Node.js with JavaScript (ES6+)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma (with JavaScript)
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod
- **File Upload**: Multer (for product images)
- **Email**: Nodemailer (for receipt delivery)
- **QR Code**: qrcode (for UPI payments)

---

## **Phase 1: Project Setup & Database Design**

### **1.1 Database Schema (PostgreSQL)**

```
Tables to Create:

1. users
   - id (UUID, PK)
   - name (VARCHAR)
   - email (VARCHAR, UNIQUE)
   - password (VARCHAR, hashed)
   - role (ENUM: 'admin', 'employee')
   - is_archived (BOOLEAN)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

2. categories
   - id (UUID, PK)
   - name (VARCHAR)
   - color (VARCHAR, hex code)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

3. products
   - id (UUID, PK)
   - name (VARCHAR)
   - category_id (UUID, FK → categories)
   - price (DECIMAL)
   - unit_of_measure (VARCHAR)
   - tax (DECIMAL)
   - description (TEXT)
   - image_url (VARCHAR)
   - show_in_kds (BOOLEAN)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

4. payment_methods
   - id (UUID, PK)
   - type (ENUM: 'cash', 'card', 'upi')
   - is_enabled (BOOLEAN)
   - upi_id (VARCHAR, nullable)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

5. floors
   - id (UUID, PK)
   - name (VARCHAR)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

6. tables
   - id (UUID, PK)
   - floor_id (UUID, FK → floors)
   - table_number (VARCHAR)
   - seats (INTEGER)
   - is_active (BOOLEAN)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

7. coupons
   - id (UUID, PK)
   - code (VARCHAR, UNIQUE)
   - discount_type (ENUM: 'percentage', 'fixed')
   - discount_value (DECIMAL)
   - is_active (BOOLEAN)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

8. promotions
   - id (UUID, PK)
   - name (VARCHAR)
   - type (ENUM: 'product', 'order')
   - discount_type (ENUM: 'percentage', 'fixed')
   - discount_value (DECIMAL)
   - product_id (UUID, FK → products, nullable)
   - min_quantity (INTEGER, nullable)
   - min_order_amount (DECIMAL, nullable)
   - is_active (BOOLEAN)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

9. customers
   - id (UUID, PK)
   - name (VARCHAR)
   - email (VARCHAR)
   - phone (VARCHAR)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

10. sessions
    - id (UUID, PK)
    - user_id (UUID, FK → users)
    - opened_at (TIMESTAMP)
    - closed_at (TIMESTAMP, nullable)
    - closing_amount (DECIMAL, nullable)
    - status (ENUM: 'open', 'closed')

11. orders
    - id (UUID, PK)
    - order_number (VARCHAR, UNIQUE)
    - session_id (UUID, FK → sessions)
    - table_id (UUID, FK → tables, nullable)
    - customer_id (UUID, FK → customers, nullable)
    - employee_id (UUID, FK → users)
    - status (ENUM: 'draft', 'paid', 'cancelled')
    - subtotal (DECIMAL)
    - tax_amount (DECIMAL)
    - discount_amount (DECIMAL)
    - total (DECIMAL)
    - payment_method (VARCHAR, nullable)
    - payment_reference (VARCHAR, nullable)
    - coupon_id (UUID, FK → coupons, nullable)
    - created_at (TIMESTAMP)
    - updated_at (TIMESTAMP)

12. order_items
    - id (UUID, PK)
    - order_id (UUID, FK → orders)
    - product_id (UUID, FK → products)
    - quantity (DECIMAL)
    - unit_price (DECIMAL)
    - line_total (DECIMAL)
    - discount_amount (DECIMAL)
    - promotion_id (UUID, FK → promotions, nullable)
    - created_at (TIMESTAMP)

13. kitchen_orders
    - id (UUID, PK)
    - order_id (UUID, FK → orders)
    - order_item_id (UUID, FK → order_items)
    - status (ENUM: 'to_cook', 'preparing', 'completed')
    - is_item_completed (BOOLEAN)
    - created_at (TIMESTAMP)
    - updated_at (TIMESTAMP)
```

---

## **Phase 2: Backend Structure**

### **2.1 Folder Structure**

```
server/
├── src/
│   ├── config/
│   │   ├── database.js          # Prisma client setup
│   │   └── env.js               # Environment variables
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── category.controller.js
│   │   ├── product.controller.js
│   │   ├── payment.controller.js
│   │   ├── floor.controller.js
│   │   ├── table.controller.js
│   │   ├── coupon.controller.js
│   │   ├── promotion.controller.js
│   │   ├── user.controller.js
│   │   ├── customer.controller.js
│   │   ├── session.controller.js
│   │   ├── order.controller.js
│   │   ├── kitchen.controller.js
│   │   └── report.controller.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── validation.middleware.js
│   │   ├── error.middleware.js
│   │   └── upload.middleware.js
│   ├── routes/
│   │   ├── index.js             # Main router
│   │   ├── auth.routes.js
│   │   ├── category.routes.js
│   │   ├── product.routes.js
│   │   ├── payment.routes.js
│   │   ├── floor.routes.js
│   │   ├── coupon.routes.js
│   │   ├── user.routes.js
│   │   ├── customer.routes.js
│   │   ├── session.routes.js
│   │   ├── order.routes.js
│   │   ├── kitchen.routes.js
│   │   └── report.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── category.service.js
│   │   ├── product.service.js
│   │   ├── payment.service.js
│   │   ├── floor.service.js
│   │   ├── coupon.service.js
│   │   ├── promotion.service.js
│   │   ├── customer.service.js
│   │   ├── session.service.js
│   │   ├── order.service.js
│   │   ├── kitchen.service.js
│   │   ├── email.service.js
│   │   └── report.service.js
│   ├── utils/
│   │   ├── jwt.util.js
│   │   ├── password.util.js
│   │   ├── qrcode.util.js
│   │   └── response.util.js
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── category.validator.js
│   │   ├── product.validator.js
│   │   └── ...
│   └── app.js                   # Express app setup
├── prisma/
│   ├── schema.prisma            # Prisma schema
│   ├── migrations/              # Database migrations
│   └── seed.js                  # Seed data
├── uploads/                     # Product images
├── .env
├── .env.example
├── package.json
└── nodemon.json
```

---

## **Phase 3: API Endpoints Plan**

### **3.1 Authentication & Users**
```
POST   /api/auth/signup          # User registration
POST   /api/auth/login           # User login
GET    /api/auth/me              # Get current user
POST   /api/auth/logout          # Logout

GET    /api/users                # List all users
POST   /api/users                # Create user/employee
PUT    /api/users/:id            # Update user
DELETE /api/users/:id            # Delete user
PATCH  /api/users/:id/archive    # Archive user
PATCH  /api/users/:id/password   # Change password
```

### **3.2 Categories**
```
GET    /api/categories           # List all categories
POST   /api/categories           # Create category
PUT    /api/categories/:id       # Update category
DELETE /api/categories/:id       # Delete category
```

### **3.3 Products**
```
GET    /api/products             # List all products
GET    /api/products/:id         # Get single product
POST   /api/products             # Create product (with image upload)
PUT    /api/products/:id         # Update product
DELETE /api/products/:id         # Delete product
GET    /api/products/search      # Search products
```

### **3.4 Payment Methods**
```
GET    /api/payment-methods      # Get all payment methods
PATCH  /api/payment-methods/:id  # Toggle enable/disable
PUT    /api/payment-methods/upi  # Update UPI ID
```

### **3.5 Floors & Tables**
```
GET    /api/floors               # List all floors with tables
POST   /api/floors               # Create floor
PUT    /api/floors/:id           # Update floor
DELETE /api/floors/:id           # Delete floor

POST   /api/tables               # Create table
PUT    /api/tables/:id           # Update table
DELETE /api/tables/:id           # Delete table
GET    /api/tables/status        # Get table status (active orders)
```

### **3.6 Coupons & Promotions**
```
GET    /api/coupons              # List all coupons
POST   /api/coupons              # Create coupon
PUT    /api/coupons/:id          # Update coupon
DELETE /api/coupons/:id          # Delete coupon
POST   /api/coupons/validate     # Validate coupon code

GET    /api/promotions           # List all promotions
POST   /api/promotions           # Create promotion
PUT    /api/promotions/:id       # Update promotion
DELETE /api/promotions/:id       # Delete promotion
POST   /api/promotions/check     # Check applicable promotions
```

### **3.7 Customers**
```
GET    /api/customers            # List all customers
POST   /api/customers            # Create customer
PUT    /api/customers/:id        # Update customer
DELETE /api/customers/:id        # Delete customer
GET    /api/customers/search     # Search customers
```

### **3.8 Sessions**
```
GET    /api/sessions             # List all sessions
POST   /api/sessions             # Open new session
GET    /api/sessions/current     # Get current open session
PATCH  /api/sessions/:id/close   # Close session
```

### **3.9 Orders**
```
GET    /api/orders               # List orders (with filters)
GET    /api/orders/:id           # Get order details
POST   /api/orders               # Create order
PUT    /api/orders/:id           # Update order
DELETE /api/orders/:id           # Delete order (draft only)
PATCH  /api/orders/:id/pay       # Process payment
POST   /api/orders/:id/receipt/email # Email receipt
```

### **3.10 Kitchen Display**
```
GET    /api/kitchen/orders       # Get kitchen orders
POST   /api/kitchen/orders       # Send order to kitchen
PATCH  /api/kitchen/orders/:id/status # Update order stage
PATCH  /api/kitchen/items/:id/complete # Mark item complete
```

### **3.11 Reports**
```
GET    /api/reports/dashboard    # Dashboard metrics
GET    /api/reports/sales-trend  # Sales trend chart data
GET    /api/reports/top-categories # Top categories
GET    /api/reports/top-products # Top products
GET    /api/reports/top-orders   # Top orders
POST   /api/reports/export       # Export as PDF/XLS
```

---

## **Phase 4: Implementation Steps**

### **Step 1: Initial Setup** ✅
- Initialize Node.js project with ES6 modules
- Install dependencies (Express, Prisma, JWT, Zod, bcrypt, etc.)
- Setup Prisma with PostgreSQL
- Create environment configuration

**Dependencies to Install:**
```json
{
  "dependencies": {
    "express": "^4.19.2",
    "@prisma/client": "^5.x.x",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.24.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^6.9.x",
    "qrcode": "^1.5.x",
    "uuid": "^10.0.0"
  },
  "devDependencies": {
    "prisma": "^5.x.x",
    "nodemon": "^3.1.4"
  }
}
```

### **Step 2: Database Setup** 🗄️
- Create Prisma schema with all tables and relationships
- Generate and run migrations
- Create seed data for testing (default payment methods, sample categories, etc.)

### **Step 3: Core Infrastructure** 🏗️
- Setup Express app with middleware (cors, json parser, etc.)
- Create authentication middleware (JWT verification)
- Setup global error handling middleware
- Create validation middleware with Zod

### **Step 4: Authentication Module** 🔐
- Implement signup/login endpoints
- JWT token generation/verification utilities
- Password hashing with bcryptjs
- Protect routes with auth middleware

### **Step 5: Backend Management Modules** 📦
- **Categories CRUD**: Full create, read, update, delete
- **Products CRUD**: With image upload using Multer
- **Payment Methods**: Enable/disable toggles, UPI ID management
- **Floors & Tables CRUD**: Floor and table management
- **Coupons & Promotions CRUD**: Discount management with validation
- **Users/Employees Management**: CRUD with archive functionality

### **Step 6: POS Terminal Modules** 🖥️
- **Session Management**: Open/close session logic
- **Order Creation**: Cart management with calculations
- **Discount Logic**: Auto-apply promotions, manual coupon validation
- **Customer Management**: Link customers to orders

### **Step 7: Payment & Receipt** 💳
- **Payment Processing**: Handle cash, card, UPI methods
- **QR Code Generation**: Generate UPI QR codes dynamically
- **Receipt Generation**: Format order receipt
- **Email Service**: Send receipts via Nodemailer

### **Step 8: Kitchen Display** 👨‍🍳
- **Kitchen Order Management**: Send orders to kitchen
- **Status Updates**: Move orders through stages (To Cook → Preparing → Completed)
- **Item Completion**: Mark individual items as complete
- **Filtering**: Search and filter by product/category

### **Step 9: Reporting & Analytics** 📊
- **Dashboard Metrics**: Calculate total orders, revenue, average order value
- **Sales Trend**: Aggregate sales data by time period
- **Top Products/Categories/Orders**: Generate top performers
- **Filters**: Support date range, employee, session, product filters
- **Export**: Generate PDF/XLS reports (optional enhancement)

### **Step 10: Testing & Optimization** ✨
- Test all API endpoints with Postman/Thunder Client
- Add database indexes for performance
- Optimize complex queries
- Add input validation on all endpoints
- Error handling refinement

---

## **Phase 5: Key Technical Considerations**

### **5.1 Business Logic**

**Promotion Auto-Apply Logic:**
- Check cart items for product-level promotions (min quantity)
- Check cart total for order-level promotions (min order amount)
- Apply highest discount if multiple promotions qualify
- Show discount breakdown in order summary

**Tax Calculations:**
- Sum all product taxes
- Apply to subtotal before discounts
- Include in final total

**Discount Calculations:**
```javascript
// Product-level discount
productDiscount = (unitPrice * quantity * discountPercent) / 100

// Order-level discount (after subtotal + tax)
orderDiscount = ((subtotal + tax) * discountPercent) / 100
// OR
orderDiscount = fixedAmount

// Final total
total = subtotal + tax - discounts
```

**Change Calculation (Cash Payment):**
```javascript
change = amountReceived - orderTotal
```

**Order Number Generation:**
```javascript
// Format: ORD-YYYYMMDD-XXXX
// Example: ORD-20260613-0001
```

### **5.2 Security**

**Authentication:**
- Use JWT tokens (access tokens)
- Store hashed passwords with bcryptjs (salt rounds: 10)
- Protect all routes except signup/login with auth middleware

**Authorization:**
- Admin role: Full access to backend management
- Employee role: Access to POS terminal, orders, customers only
- Implement role-based middleware checks

**Input Validation:**
- Validate all request bodies with Zod schemas
- Sanitize user inputs
- Validate file uploads (image type, size limits)

**SQL Injection Prevention:**
- Prisma ORM handles parameterized queries automatically

**Environment Variables:**
```
DATABASE_URL=postgresql://user:password@localhost:5432/odoo_cafe
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
PORT=5000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### **5.3 Performance**

**Database Indexing:**
- Index on `users.email` (UNIQUE)
- Index on `orders.order_number` (UNIQUE)
- Index on `orders.session_id`
- Index on `products.category_id`
- Index on `order_items.order_id`

**Efficient Queries:**
- Use Prisma `include` for relations instead of multiple queries
- Implement pagination for large datasets (orders, products)
- Use `select` to fetch only required fields

**Caching (Optional):**
- Cache categories and products (rarely change)
- Use in-memory cache or Redis for production

### **5.4 Real-time Features** (Optional Enhancement)

**WebSocket for Kitchen Display:**
- Install `socket.io`
- Emit events when orders are sent to kitchen
- Update kitchen display in real-time
- Notify POS when order status changes

```javascript
// Example structure
io.on('connection', (socket) => {
  socket.on('order:sent-to-kitchen', (orderData) => {
    io.emit('kitchen:new-order', orderData);
  });
  
  socket.on('kitchen:update-status', (statusUpdate) => {
    io.emit('pos:order-status-updated', statusUpdate);
  });
});
```

---

## **Phase 6: Database Relationships Summary**

```
users (1) ←→ (Many) sessions
users (1) ←→ (Many) orders (as employee)

categories (1) ←→ (Many) products

floors (1) ←→ (Many) tables
tables (1) ←→ (Many) orders

sessions (1) ←→ (Many) orders

customers (1) ←→ (Many) orders

orders (1) ←→ (Many) order_items
orders (1) ←→ (Many) kitchen_orders
orders (1) ←→ (1) coupons (optional)

products (1) ←→ (Many) order_items
products (1) ←→ (Many) promotions (product-level)

order_items (1) ←→ (1) promotions (optional)

order_items (1) ←→ (Many) kitchen_orders
```

---

## **Phase 7: Sample Code Structure**

### **Example: Express App Setup (app.js)**

```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import errorMiddleware from './middlewares/error.middleware.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (uploads)
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api', routes);

// Error handling
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### **Example: Auth Controller Structure**

```javascript
import authService from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export const signup = async (req, res) => {
  try {
    const result = await authService.signup(req.body);
    sendSuccess(res, 201, 'User registered successfully', result);
  } catch (error) {
    sendError(res, error);
  }
};

export const login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    sendSuccess(res, 200, 'Login successful', result);
  } catch (error) {
    sendError(res, error);
  }
};
```

### **Example: Prisma Client Setup (config/database.js)**

```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
```

---

## **Phase 8: Testing Checklist**

### **Authentication Tests**
- [ ] User can signup with valid data
- [ ] User cannot signup with duplicate email
- [ ] User can login with correct credentials
- [ ] User cannot login with wrong password
- [ ] JWT token is generated on login
- [ ] Protected routes reject requests without token

### **Category Tests**
- [ ] Admin can create category
- [ ] Admin can list all categories
- [ ] Admin can update category
- [ ] Admin can delete category
- [ ] Category color updates reflect in products

### **Product Tests**
- [ ] Admin can create product with image
- [ ] Admin can update product
- [ ] Products can be filtered by category
- [ ] Products can be searched by name
- [ ] Admin can delete product

### **Order Tests**
- [ ] Employee can create order
- [ ] Order calculates subtotal, tax, discounts correctly
- [ ] Coupons can be applied
- [ ] Promotions auto-apply when conditions met
- [ ] Order can be paid with cash/card/UPI
- [ ] Paid orders cannot be edited
- [ ] Draft orders can be edited/deleted

### **Kitchen Tests**
- [ ] Orders are sent to kitchen
- [ ] Kitchen can update order status
- [ ] Individual items can be marked complete
- [ ] Only products with show_in_kds appear

### **Report Tests**
- [ ] Dashboard shows correct metrics
- [ ] Filters work correctly
- [ ] Sales trend data is accurate
- [ ] Top products/categories/orders display correctly

---

## **Next Steps**

Ready to start building! Here's the recommended approach:

1. **Setup PostgreSQL locally** and create database
2. **Initialize the backend structure** with all folders
3. **Create Prisma schema** with all tables
4. **Run migrations** to create database tables
5. **Build authentication module** (signup, login, JWT)
6. **Implement each module** step-by-step following the plan above

---

## **Quick Start Commands**

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Setup Prisma
npx prisma init

# Create migration
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed database (optional)
npm run seed

# Start development server
npm run dev
```

---

**Total Estimated Development Time:** 4-6 weeks for complete implementation

**Priority Order:**
1. Authentication & Users ⭐⭐⭐
2. Categories & Products ⭐⭐⭐
3. Payment Methods ⭐⭐
4. Floors & Tables ⭐⭐
5. Sessions & Orders ⭐⭐⭐
6. Coupons & Promotions ⭐⭐
7. Kitchen Display ⭐⭐
8. Customers ⭐
9. Reports & Analytics ⭐⭐

---

Would you like me to start implementing the backend structure now? 🚀
