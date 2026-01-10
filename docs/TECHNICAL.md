# Construction CRM - Technical Documentation

## Architecture Overview

### Tech Stack
- **Frontend:** React 18 + TypeScript + Ant Design
- **Backend:** Node.js + Express + TypeScript
- **Database:** MySQL 8.0+
- **ORM:** Sequelize
- **Authentication:** JWT

### Project Structure
```
CRM/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   ├── models/          # Sequelize models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth, error handling
│   │   ├── services/        # Business services
│   │   └── utils/           # Helper functions
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── context/         # React context
│   │   ├── utils/           # Helper functions
│   │   └── routes/          # Routing config
│   └── package.json
│
├── database/
│   ├── schema.sql           # Database schema
│   ├── migrations/          # Migration scripts
│   └── seeds/               # Seed data
│
└── docs/                    # Documentation
```

---

## Database Design

### Core Tables

#### Users & Authentication
- `users` - User accounts
- `roles` - User roles (Admin, Manager, Engineer, etc.)
- `permissions` - Granular permissions
- `user_roles` - Many-to-many mapping
- `role_permissions` - Many-to-many mapping

#### Master Data
- `companies` - Company information
- `vendor_types` - Vendor type master (NEW)
- `vendors` - Vendor details
- `materials` - Material master
- `warehouses` - Warehouse locations

#### Projects
- `projects` - Project master
- `project_vendors` - Vendor assignments to projects
- `leads` - Sales leads
- `quotations` - Quotation management
- `work_orders` - Work order tracking

#### Operations
- `daily_progress_reports` - DPR entries
- `manpower_reports` - Manpower tracking
- `equipment` - Equipment master
- `equipment_rentals` - Equipment rental tracking
- `expenses` - Expense management

---

## API Design

### RESTful Conventions
- `GET /api/resource` - List all
- `GET /api/resource/:id` - Get one
- `POST /api/resource` - Create
- `PUT /api/resource/:id` - Update
- `DELETE /api/resource/:id` - Delete (soft delete)

### Authentication
All API endpoints (except `/api/auth/*`) require JWT token:
```
Authorization: Bearer <token>
```

### Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Format
```json
{
  "success": false,
  "message": "Error message",
  "stack": "..." // Only in development
}
```

---

## Authentication Flow

### Registration
1. User submits: username, name, email, password, employee_id
2. Backend validates input
3. Check for existing username/employee_id
4. Hash password with bcrypt
5. Create user record
6. Generate JWT token
7. Return token + user data

### Login
1. User submits: username, password
2. Backend finds user by username
3. Compare password with bcrypt
4. Generate JWT token
5. Update last_login timestamp
6. Return token + user data

### Token Refresh
1. Client sends refresh token
2. Backend validates token
3. Generate new access token
4. Return new token

---

## Frontend Architecture

### State Management
- **React Context:** Global state (Auth, Theme)
- **Local State:** Component-specific state
- **Form State:** Ant Design Form

### Routing
- **Public Routes:** /login, /register
- **Protected Routes:** All others (require authentication)
- **Layout:** Sidebar navigation with nested routes

### API Communication
- **Axios:** HTTP client
- **Interceptors:** Auto-add JWT token
- **Error Handling:** Global error interceptor

---

## Validation Standards

### Indian Compliance

#### Phone Numbers
- **Format:** 10 digits
- **Pattern:** `^[6-9]\d{9}$`
- **Example:** 9876543210

#### GST Number
- **Format:** 15 characters
- **Pattern:** `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`
- **Example:** 22AAAAA0000A1Z5

#### PAN Number
- **Format:** 10 characters
- **Pattern:** `^[A-Z]{5}[0-9]{4}[A-Z]{1}$`
- **Example:** ABCDE1234F

---

## Security

### Password Security
- **Hashing:** bcrypt with salt rounds = 10
- **Min Length:** 6 characters
- **Storage:** Never store plain text

### JWT Security
- **Secret:** Environment variable
- **Expiry:** 24 hours (configurable)
- **Refresh:** Refresh token mechanism

### API Security
- **CORS:** Configured for specific origins
- **Helmet:** Security headers
- **Rate Limiting:** (To be implemented)

---

## Database Migrations

### Migration Files
Location: `database/migrations/`

Format: `XXX_description.sql`

Example:
```sql
-- Migration: 001_add_username_column.sql
ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE NOT NULL;
ALTER TABLE users MODIFY COLUMN email VARCHAR(100) NULL;
```

### Running Migrations
```bash
cd database/migrations
node run-migration.js
```

---

## Environment Variables

### Backend (.env)
```
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=crm_construction

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h

# Server
PORT=5000
NODE_ENV=development
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

---

## Development Workflow

### Starting Development
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Database Setup
```bash
# Create database
mysql -u root -p
CREATE DATABASE crm_construction;

# Run schema
mysql -u root -p crm_construction < database/schema.sql

# Run migrations
cd database/migrations
node run-migration.js

# Seed data
cd backend
npm run seed
```

---

## Testing Strategy

### Manual Testing
- Test each API endpoint with Postman/Thunder Client
- Test UI flows in browser
- Test validation rules
- Test error handling

### Automated Testing (Future)
- Unit tests: Jest
- Integration tests: Supertest
- E2E tests: Playwright

---

## Deployment

### Production Checklist
- [ ] Set NODE_ENV=production
- [ ] Use strong JWT_SECRET
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Enable logging
- [ ] Set up monitoring

### Build Commands
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run build
```

---

## Performance Optimization

### Database
- Indexes on foreign keys
- Indexes on frequently queried columns
- Connection pooling

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Caching

### Backend
- Response compression
- Query optimization
- Caching (Redis - future)

---

## Monitoring & Logging

### Logging
- **Library:** Winston
- **Levels:** error, warn, info, debug
- **Format:** JSON in production

### Monitoring (Future)
- Application metrics
- Error tracking (Sentry)
- Performance monitoring

---

## Code Standards

### TypeScript
- Strict mode enabled
- No implicit any
- Proper type definitions

### Naming Conventions
- **Files:** kebab-case (user-controller.ts)
- **Classes:** PascalCase (UserController)
- **Functions:** camelCase (getUserById)
- **Constants:** UPPER_SNAKE_CASE (JWT_SECRET)

### Code Organization
- One model per file
- One controller per resource
- Group related routes
- Separate business logic from controllers

---

**Last Updated:** January 10, 2026  
**Version:** 1.0.0
