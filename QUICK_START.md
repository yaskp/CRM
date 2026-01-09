# Quick Start Guide

## ⚠️ Important: Configure Database Password

The MySQL connection requires a password. You need to create/update the `.env` file:

1. **Create `backend/.env` file** (copy from `.env.example` if it exists, or create new):

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=crm_construction
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE  # ⬅️ UPDATE THIS!

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development
```

2. **Replace `YOUR_MYSQL_PASSWORD_HERE`** with your actual MySQL root password

## Steps to Run

### 1. Seed the Database
```bash
cd backend
npm run seed
```

This creates:
- Companies (VHPT, VHSHREE)
- Roles and Permissions
- Admin user: `admin@crm.com` / `admin123`

### 2. Start Backend Server
```bash
cd backend
npm run dev
```
Backend runs on: http://localhost:5000

### 3. Start Frontend Server (New Terminal)
```bash
cd frontend
npm run dev
```
Frontend runs on: http://localhost:3000

### 4. Login
- Open: http://localhost:3000
- Email: `admin@crm.com`
- Password: `admin123`

## Troubleshooting

**"Access denied for user 'root'@'localhost'"**
- Check your MySQL password in `backend/.env`
- Verify MySQL is running: `mysql -u root -p`

**"Database doesn't exist"**
- Create it: `CREATE DATABASE crm_construction;`
- Or run: `mysql -u root -p < database/schema.sql`

**Port already in use**
- Change PORT in `backend/.env`
- Or kill the process using the port

