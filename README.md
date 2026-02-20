# Scalez Media Project

A full-stack **growth and experimentation management platform** for teams to manage projects, goals, ideas, tests, learnings, and analytics in one place. The app supports North Star metrics, funnel visualization, action plans, and role-based access.

---

## Overview

**Scalez** helps teams:

- **Manage projects** — Create, archive, and track projects with status (Active, Completed, On Hold, etc.).
- **Set goals** — Define goals linked to key metrics and track progress.
- **Run experiments** — Capture ideas → run tests → record learnings (Ideas → Tests → Learnings pipeline).
- **Track North Star metrics** — Define and monitor North Star metrics per project with value history.
- **Analyze performance** — View analytics across goals, ideas, tests, and learnings (worked / didn’t work / inconclusive).
- **Use models** — Create and compare business/financial models and run simulations.
- **Plan actions** — Organize action plans with categories and pointers (doc-style structure).
- **Visualize funnels** — Build and view funnel flows (e.g. webinar, sales, traffic) with React Flow–style nodes.
- **Configure workspace** — Manage roles, users, company, billing, notifications, and workspace (levers, key metrics).

The app uses **Supabase** for auth, database, and storage (via `supabaseApi.js`). The frontend is deployed on **Vercel**; an optional Node/Express backend (REST + Socket.IO) can be deployed separately if needed. Production URLs are set via environment variables (no hardcoded domains).

---

## Tech Stack

| Layer      | Technologies |
|-----------|--------------|
| **Frontend** | React 19, React Router 6, Redux Toolkit, Supabase client, Axios, Socket.IO client, Tailwind-style UI (Radix, custom components), Chart.js, ECharts, React Flow, Quill/SunEditor, Formik, Yup |
| **Backend**  | Node.js, Express, Socket.IO, JWT auth, Supabase (replacing MongoDB), Multer (uploads), Mailgun, Google APIs, n8n (webhooks), bcryptjs, Joi |
| **Database / Auth** | Supabase (PostgreSQL + Auth + Storage + RLS) |

---

## Project Structure

```
scalezmediaproject/
├── frontend/                    # React SPA
│   ├── public/
│   ├── src/
│   │   ├── App.js               # Root app, theme (light/dark), Socket, favicon
│   │   ├── routes/index.js      # All route definitions
│   │   ├── layout/              # MainLayout, ProjectLayout, SettingsLayout, Toolbar, etc.
│   │   ├── pages/               # Page components
│   │   │   ├── Dashboard/       # Main dashboard (check-ins, goals, ideas, tasks, tests, learnings)
│   │   │   ├── Projects/        # Projects list, Goals, Ideas, Tests, Learnings, Insights,
│   │   │   │                    # North Star, Integrations, Calendar, Gantt, Tour
│   │   │   ├── Models/          # Models list, ModelInfo, ModelSimulation, CompareModel
│   │   │   ├── Analytics/       # Cross-project analytics (goals, ideas, tests, learnings)
│   │   │   ├── ActionPlan/     # Action plans, categories, pointers
│   │   │   ├── Settings/        # Profile, Roles, Users, Workspace, Notifications, Company, Billing
│   │   │   ├── Landing/         # Login, Signup, Forgot/Reset password
│   │   │   ├── NodeTypes/       # Funnel nodes (Webinar, Sales, Email, etc.)
│   │   │   └── ...
│   │   ├── redux/               # store, slices (project, dashboard, setting, model, actionPlan, etc.)
│   │   ├── components/          # Reusable UI (cards, tables, dialogs, NorthStarWidget, etc.)
│   │   ├── utils/               # supabaseClient, supabaseApi, axios, permissions, formatTime, etc.
│   │   └── theme/               # LightTheme, DarkTheme
│   └── package.json             # Frontend deps (react-scripts, PORT=3005)
│
└── frontend/backend/            # Node/Express API server
    ├── app.js                   # Express app, Socket.IO, CORS, route mounting
    ├── routes/                  # Auth, Project, Goal, Idea, Test, Learning, Analytics, etc.
    ├── controllers/             # Per-domain controllers
    ├── config/                  # supabaseClient
    ├── helpers/                 # JWT, roles, file upload, email
    ├── scripts/                 # Seed, webhook, test scripts
    └── package.json             # Express, socket.io, supabase, nodemon, etc.
```

---

## Main Features

- **Dashboard** — Widgets for check-ins, goals, ideas, tasks, tests, learnings; bar charts; North Star widget; quick links to projects.
- **Projects** — CRUD, status, archive, search/filter; sidebar: Goals, Ideas, Tests, Learnings, Insights, North Star metrics, Integrations, Calendar.
- **Goals** — Goals list, create/delete, link to key metrics; request ideas from goals.
- **Ideas** — Ideas board, create/share/test/delete; public idea view; goal-based ideas.
- **Tests** — Test tracking, kanban, move to learning, send back to ideas.
- **Learnings** — Learning items, mark worked/didn’t work/inconclusive; link back to tests/ideas.
- **Insights** — Project-level insights.
- **North Star metrics** — Create/edit metrics, current/target, value history, time period, public toggle.
- **Integrations** — e.g. Google integrations per project.
- **Calendar** — Project calendar view.
- **Analytics** — Aggregated goals, ideas, tests, learnings; charts (ECharts); CSV export.
- **Models** — List, create, compare, simulate (business/financial models).
- **Action plans** — Hierarchy of action plans → categories → pointers; access control; progress.
- **Funnel** — Funnel builder per project (React Flow), dashboard at `funnel/:projectId`.
- **Settings** — Profile, roles, users, workspace (levers, key metrics), notifications, company, billing.

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- Supabase project (for auth and database)
- (Optional) Backend for REST API and Socket.IO — runs on port **7400** by default

### Frontend

```bash
cd frontend
npm install
npm start
```

Runs at **http://localhost:3005**.

### Backend (optional)

```bash
cd frontend/backend
npm install
cp .env.example .env   # if available, then set SUPABASE_URL, SUPABASE_ANON_KEY, etc.
npm run dev
```

Server runs at **http://localhost:7400**; Socket.IO is attached to the same server.

### Environment

- **Frontend (Vercel)** — In Vercel, set:
  - `REACT_APP_FRONTEND_URL` — Your app URL (e.g. `https://your-app.vercel.app`). Falls back to current origin if unset.
  - `REACT_APP_API_URL` — (Optional) Custom API base URL if you deploy the Node backend. Leave unset when using Supabase only.
  - `REACT_APP_SOCKET_URL` — (Optional) Socket.IO server URL; defaults to `REACT_APP_API_URL` if set.
  - Supabase: `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` (see `supabaseClient.js`).
- **Local dev** — API/socket at `http://localhost:7400`, app at `http://localhost:3005`.
- **Backend** — Uses `.env` (Supabase, JWT, Mailgun, Google). Set `FRONTEND_URL` for CORS (e.g. your Vercel URL). Health: `GET /health`.

---

## Key Files

| File | Purpose |
|------|--------|
| `frontend/src/utils/backendServerBaseURL.js` | API/socket/frontend URLs; production uses `REACT_APP_*` env vars (Vercel) |
| `frontend/src/utils/supabaseClient.js` | Supabase client init |
| `frontend/src/utils/supabaseApi.js` | Supabase-based API layer (auth, users, projects, goals, ideas, etc.) |
| `frontend/src/redux/store.js` | Redux store and slices |
| `frontend/src/routes/index.js` | All app routes |
| `frontend/backend/app.js` | Express + Socket.IO and route mounting |

---

## License

MIT.
