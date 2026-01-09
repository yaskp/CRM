# Setup Instructions

## Prerequisites
- Node.js 18+ installed
- MySQL 8.0+ installed and running
- Database `crm_construction` created

## Step 1: Database Setup

The database `crm_construction` is already created. Now we need to:

1. **Run the database schema** (if not already done):
   ```bash
   mysql -u root -p crm_construction < database/schema.sql
   ```

   Or manually execute the SQL file in your MySQL client.

## Step 2: Configure Environment

1. **Backend Environment**:
   - The `.env` file should be created in `backend/` directory
   - Update `DB_PASSWORD` if your MySQL root user has a password
   - Update `JWT_SECRET` to a secure random string (minimum 32 characters)

## Step 3: Seed Database

Run the seed script to create default roles, permissions, and admin user:

```bash
cd backend
npm run seed
```

This will create:
- Companies (VHPT, VHSHREE)
- Roles (Admin, Site Engineer, Store Manager, etc.)
- Permissions
- Default admin user (email: admin@crm.com, password: admin123)

## Step 4: Start Development Servers

### Terminal 1 - Backend Server
```bash
cd backend
npm run dev
```

The backend will run on `http://localhost:5000`

### Terminal 2 - Frontend Server
```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:3000`

## Step 5: Access the Application

1. Open browser: `http://localhost:3000`
2. Login with:
   - Email: `admin@crm.com`
   - Password: `admin123`

## Troubleshooting

### Database Connection Issues
- Check MySQL is running: `mysql -u root -p`
- Verify database exists: `SHOW DATABASES;`
- Check `.env` file has correct credentials

### Port Already in Use
- Backend: Change `PORT` in `backend/.env`
- Frontend: Change port in `frontend/vite.config.ts`

### Module Not Found Errors
- Run `npm install` in both `backend/` and `frontend/` directories

## Next Steps

After successful setup:
1. Create additional users through the registration page
2. Assign roles to users
3. Start creating projects, leads, and managing materials

