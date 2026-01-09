# Construction CRM System

A comprehensive Construction CRM system built with React, Node.js, and MySQL for managing construction projects from lead generation to completion.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Ant Design
- **Backend**: Node.js + Express + TypeScript + Sequelize
- **Database**: MySQL 8.0+
- **Authentication**: JWT

## Project Structure

```
crm-system/
├── frontend/          # React frontend application
├── backend/           # Node.js backend API
├── database/          # Database migrations and seeds
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```

3. Set up environment variables:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database credentials
   ```

4. Set up database:
   ```bash
   cd backend
   npm run migrate
   npm run seed
   ```

5. Start development servers:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## Features

- Lead Management
- Quotation Management
- Project Management
- Work Order Management
- Material & Warehouse Management
- Daily Progress Reports (DPR)
- Equipment Rental Tracking
- Expense Management with Approval Workflow
- Drawing Management
- Vendor Management

## License

Proprietary

