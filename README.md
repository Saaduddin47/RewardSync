# Recruitment Incentive Tracker

Production-style full-stack application to manage recruiter incentives with role-based dashboards.

## Stack

- Frontend: React + Vite + TailwindCSS + TanStack Table + React Hook Form + Zod
- Backend: Node.js + Express + MongoDB Atlas + JWT auth
- Export: ExcelJS via `GET /api/export-report`

## Run locally

### 1) Backend

```bash
cd backend
copy .env.example .env
# update MONGO_URI and JWT_SECRET in .env
npm install
npm run dev
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3) Seed first admin

```bash
POST http://localhost:5001/api/auth/seed-admin
```

Default seeded admin:

- Email: admin@rewardsync.com
- Password: Admin@123

## Roles

- Recruiter Dashboard: submit joiners, view eligibility and claim status
- BGV Dashboard: clear/fail BGV
- Manager Dashboard: approve/reject claims, export report
- Admin Dashboard: manage employees and recovery deficits
