# 🚀 Smart Onboarding System

A full-stack intern onboarding management platform built with **React**, **Node.js/Express**, and **MongoDB**. Admins can create tasks, track intern progress, review screenshot proof submissions, and send automated reminder emails — all from a clean, modern dashboard.

---

## ✨ Features

### 👨‍💼 Admin
- Create onboarding tasks and assign them to one or more interns by name (checkbox list)
- Toggle **Requires Proof** to mandate screenshot submissions for a task
- **Pending Approvals panel** — view submitted screenshot thumbnails, approve or reject with a comment
- **Intern Progress table** — assigned / completed / pending counts per intern with a mini progress bar
- **Overdue Tasks panel** — quickly see who has missed deadlines
- **Task Analytics chart** — bar chart showing assigned / completed / pending per task
- **Send Reminder Emails** — one-click email blast to all interns with tasks due within 7 days

### 👩‍💻 Intern
- View assigned onboarding tasks and personal tasks separately
- See real-time status: **Pending → Submitted → Completed / Rejected**
- Upload a **screenshot proof** with live image preview, then submit — uploads to Cloudinary
- If rejected, see the admin's comment and resubmit a corrected screenshot
- Create personal tasks with a title, description, and optional deadline
- Track overall onboarding progress with a visual progress bar

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express 5 |
| Database | MongoDB (Mongoose) |
| Auth | JWT (JSON Web Tokens) + bcrypt |
| File Storage | Cloudinary + Multer |
| Email | Nodemailer (Mailtrap for dev) |

---

## 📂 Project Structure

```
smart-onboarding-system/
├── backend/
│   ├── config/          # DB connection
│   ├── controllers/     # authController, taskController
│   ├── middleware/       # JWT auth middleware
│   ├── models/          # User, Task schemas
│   ├── routes/          # authRoutes, taskRoutes
│   ├── utils/           # Email helper
│   └── server.js
└── frontend/
    └── src/
        ├── components/  # Sidebar, Navbar, TaskCard, AnalyticsChart, ProgressBar
        ├── context/     # AuthContext (JWT session)
        ├── pages/       # Login, Register, AdminDashboard, InternDashboard
        └── services/    # Axios API client
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account
- Mailtrap account (for dev email testing)

---

### 1. Clone the repo

```bash
git clone https://github.com/your-username/smart-onboarding-system.git
cd smart-onboarding-system
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `/backend`:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

# Cloudinary (for proof image uploads)
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_KEY=your_api_key
CLOUDINARY_SECRET=your_api_secret

# Email (Mailtrap for dev / Gmail for prod)
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password

# Or Mailtrap SMTP
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_mailtrap_user
MAILTRAP_PASS=your_mailtrap_pass
```

Start the backend:

```bash
npm run dev      # development (nodemon)
npm start        # production
```

The API will be available at `http://localhost:5000/api`.

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🔌 API Reference

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user (admin or intern) |
| POST | `/api/auth/login` | Login and receive a JWT |
| GET | `/api/auth/interns` | Get all intern users |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks` | Create a new task (admin) |
| GET | `/api/tasks` | Get tasks for the logged-in user |
| GET | `/api/tasks/progress` | Get intern's own progress stats |
| PUT | `/api/tasks/:id/complete` | Mark a task as complete |
| POST | `/api/tasks/:id/submit-proof` | Upload screenshot proof (`multipart/form-data`, field: `proof`) |
| PUT | `/api/tasks/:id/approve/:userId` | Approve a submitted proof (admin) |
| PUT | `/api/tasks/:id/reject/:userId` | Reject with a comment (admin) |
| GET | `/api/tasks/admin/task-analytics` | Analytics per task (admin) |
| GET | `/api/tasks/admin/pending-approvals` | Proofs awaiting review (admin) |
| GET | `/api/tasks/admin/intern-progress` | Progress stats per intern (admin) |
| GET | `/api/tasks/admin/overdue-tasks` | Tasks past deadline (admin) |
| POST | `/api/tasks/admin/send-reminders` | Email interns with upcoming deadlines (admin) |

---

## 👤 User Roles

| Role | Access |
|------|--------|
| `admin` | Full dashboard — create tasks, review proofs, view analytics, send reminders |
| `intern` | Own dashboard — view assigned tasks, upload proof screenshots, create personal tasks |

> When an intern registers, 3 default onboarding tasks are automatically assigned to them.

---

## 🔄 Proof Submission Workflow

```
Intern uploads screenshot
        ↓
status = "submitted", approvalStatus = "pending"
        ↓
Admin reviews thumbnail in Pending Approvals panel
        ↓
   ┌────┴────┐
Approve     Reject (with comment)
   ↓              ↓
status =     status = "rejected"
"completed"  adminComment visible to intern
             Intern can resubmit
```

---

## 🖼 Screenshots

> _Add screenshots of your admin and intern dashboards here._

---

## 📄 License

MIT © 2024 — feel free to use, fork, and adapt.
