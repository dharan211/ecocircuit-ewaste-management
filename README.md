# EcoCircuit – E-Waste Collection and Disposal Management System

MERN stack: MongoDB, Express.js, React (Vite), Node.js.

## Features
- **Users:** register/login, submit e-waste requests (device, quantity, condition, address, preferred date), track status, cancel pending requests
- **Admin:** dashboard stats, review requests, approve/reject, schedule pickups, update status, add notes, manage users, maintain recycling records

## Setup
Requires Node.js 18+ and MongoDB running locally (or an Atlas URI in `server/.env`).

```bash
# Terminal 1 – backend
cd server
npm install
npm start          # http://localhost:5000

# Terminal 2 – frontend
cd client
npm install
npm run dev        # http://localhost:5173
```

Default admin (auto-created on first run, change it in `server/.env`):
`admin@ecocircuit.com` / `admin123`

## API
| Method | Route | Access |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | public |
| GET | /api/auth/me | user |
| GET, POST | /api/requests | user (own) / admin (all) |
| PATCH | /api/requests/:id | admin |
| DELETE | /api/requests/:id | user (pending, own) / admin |
| GET, DELETE | /api/admin/users(/:id) | admin |
| GET, POST | /api/admin/records | admin |
| GET | /api/admin/stats | admin |

## Flow
Pending → Approved → Scheduled → Collected → Recycled (or Rejected). Adding a recycling record for a Collected request marks it Recycled.
