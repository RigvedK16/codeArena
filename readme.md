# CodeArena

CodeArena is a full‑stack competitive programming and contest platform. It lets admins create contests and problems, and lets users solve problems, submit solutions, view leaderboards, and participate in proctored contests.

## Tech Stack

- **Frontend**: React, Vite, Redux Toolkit, Tailwind/DaisyUI‑style classes
- **Backend**: Node.js, Express, MongoDB (Mongoose)
- **Judge / Code Execution**: Remote execution via `/run` and `/submit` routes
- **AI Features**: Google Gemini via `@google/generative-ai`
- **Auth**: Cookie‑based session/JWT

---

## Folder Structure

- **[BackEnd](BackEnd)**
  - App entry: [`src/app.js`](BackEnd/src/app.js)
  - Config: [`src/config/databse.js`](BackEnd/src/config/databse.js)
  - Controllers:
    - Contests: [`src/controllers/contestController.js`](BackEnd/src/controllers/contestController.js)
      - Scoring helpers: [`contestController.computeEarnedScore`](BackEnd/src/controllers/contestController.js), [`contestController.computePenaltyMinutes`](BackEnd/src/controllers/contestController.js)
      - Contest lifecycle: create, list, register, start problem, violations, leaderboard
  - Models: [`src/models`](BackEnd/src/models)
    - Contests: [`contest.js`](BackEnd/src/models/contest.js)
    - Problems: [`problem.js`](BackEnd/src/models/problem.js)
    - Submissions: [`submission.js`](BackEnd/src/models/submission.js), [`contestSubmission.js`](BackEnd/src/models/contestSubmission.js)
    - Users and other contest-related entities
  - Routes: [`src/routes`](BackEnd/src/routes)
    - Auth: [`auth.js`](BackEnd/src/routes/auth.js)
    - Problems: [`problems.js`](BackEnd/src/routes/problems.js)
    - Contests: [`contests.js`](BackEnd/src/routes/contests.js)
    - Code run/submit: [`run.js`](BackEnd/src/routes/run.js), [`submit.js`](BackEnd/src/routes/submit.js)
    - AI / Chat: [`chat.js`](BackEnd/src/routes/chat.js), [`codeAnalyze.js`](BackEnd/src/routes/codeAnalyze.js)
  - Scripts:
    - Mark contest live by ID: [`scripts/makeContestLive.js`](BackEnd/scripts/makeContestLive.js)
    - Mark contest live by title: [`scripts/makeContestLiveByTitle.js`](BackEnd/scripts/makeContestLiveByTitle.js)
    - Local helper: [`src/scripts/setContestLive.js`](BackEnd/src/scripts/setContestLive.js)
  - Validation utils: [`src/utils/validation.js`](BackEnd/src/utils/validation.js)

- **[FrontEnd](FrontEnd)**
  - Entry: [`src/main.jsx`](FrontEnd/src/main.jsx), [`src/App.jsx`](FrontEnd/src/App.jsx)
  - State: [`redux/store.js`](FrontEnd/src/redux/store.js), [`redux/authSlice.js`](FrontEnd/src/redux/authSlice.js)
  - API helper: [`utils/api.js`](FrontEnd/src/utils/api.js)
  - Pages:
    - Contests list: [`pages/Contests.jsx`](FrontEnd/src/pages/Contests.jsx)
    - Contest dashboard & leaderboard: [`pages/ContestDashboard.jsx`](FrontEnd/src/pages/ContestDashboard.jsx), [`pages/Leaderboard.jsx`](FrontEnd/src/pages/Leaderboard.jsx)
    - Problems list & detail: [`pages/Problems.jsx`](FrontEnd/src/pages/Problems.jsx), [`pages/ProblemDetail.jsx`](FrontEnd/src/pages/ProblemDetail.jsx)
    - Create contest: [`pages/CreateContest.jsx`](FrontEnd/src/pages/CreateContest.jsx)
    - Dashboard & activity heatmap: [`pages/Dashboard.jsx`](FrontEnd/src/pages/Dashboard.jsx)
    - Auth: [`pages/Login.jsx`](FrontEnd/src/pages/Login.jsx), [`pages/Signup.jsx`](FrontEnd/src/pages/Signup.jsx)
  - Components:
    - Code editor & submission: [`components/CodeEditor.jsx`](FrontEnd/src/components/CodeEditor.jsx)
    - Submission modal: [`components/SubmissionResult.jsx`](FrontEnd/src/components/SubmissionResult.jsx)
    - Contest proctoring: [`components/ContestProctoringOverlay.jsx`](FrontEnd/src/components/ContestProctoringOverlay.jsx)
    - Layout & access control: [`Navbar.jsx`](FrontEnd/src/components/Navbar.jsx), [`RequireAuth.jsx`](FrontEnd/src/components/RequireAuth.jsx), [`RequireAdmin.jsx`](FrontEnd/src/components/RequireAdmin.jsx)

---

## Features

- **Problem Management**
  - Upload and manage problems from the UI ([`UploadProblems.jsx`](FrontEnd/src/pages/UploadProblems.jsx))
  - Language templates & syntax highlighting in [`CodeEditor.jsx`](FrontEnd/src/components/CodeEditor.jsx)

- **Contests**
  - Create contests with start/end time and per‑problem scores ([`CreateContest.jsx`](FrontEnd/src/pages/CreateContest.jsx), [`contestController.createContest`](BackEnd/src/controllers/contestController.js))
  - Registration window automatically closes 5 minutes before start on both:
    - Backend: [`contestController.registerForContest`](BackEnd/src/controllers/contestController.js)
    - Frontend: [`getContestStatus` / `canRegisterContest`](FrontEnd/src/pages/Contests.jsx)
  - Live contest countdowns and phase display (Upcoming/Live/Past) in
    - [`ContestDashboard.jsx`](FrontEnd/src/pages/ContestDashboard.jsx)
    - [`ProblemDetail.jsx`](FrontEnd/src/pages/ProblemDetail.jsx)
  - Per‑problem solve window and scoring with time and wrong‑attempt penalties via
    - [`contestController.computeEarnedScore`](BackEnd/src/controllers/contestController.js)
    - [`contestController.computePenaltyMinutes`](BackEnd/src/controllers/contestController.js)
  - Leaderboard and participant statistics ([`ContestDashboard.jsx`](FrontEnd/src/pages/ContestDashboard.jsx), [`Leaderboard.jsx`](FrontEnd/src/pages/Leaderboard.jsx))

- **Proctoring & Violations**
  - Fullscreen enforcement and violation logging from the frontend
    - [`ContestProctoringOverlay.jsx`](FrontEnd/src/components/ContestProctoringOverlay.jsx)
  - Backend violation endpoint
    - [`contestController.logContestViolation`](BackEnd/src/controllers/contestController.js)

- **AI & Code Review**
  - AI‑powered hints / analysis via Gemini:
    - Backend routing and jailbreak defenses in [`routes/chat.js`](BackEnd/src/routes/chat.js)
    - Frontend integration in [`SubmissionResult.jsx`](FrontEnd/src/components/SubmissionResult.jsx)

- **User Activity Dashboard**
  - Submission heatmap and stats in [`Dashboard.jsx`](FrontEnd/src/pages/Dashboard.jsx) using timezone config from `VITE_APP_TIMEZONE`.

---

## Getting Started

### Prerequisites

- Node.js (LTS)
- MongoDB instance (local or hosted)

### 1. Backend Setup

```bash
cd BackEnd
npm install
```

Create `.env` in `BackEnd` (see existing sample in [`BackEnd/.env`](BackEnd/.env)):

```bash
GEMINI_API_KEY=your_gemini_key_here
MONGODB_URI=mongodb://localhost:27017/codearena
JWT_SECRET=some-long-secret
FRONTEND_ORIGIN=http://localhost:5173
PORT=7777
```

Run the backend:

```bash
npm start      # runs src/app.js
# or for dev auto-reload (see scripts in BackEnd/package.json)
npm run build  # nodemon src/app.js
```

### 2. Frontend Setup

```bash
cd FrontEnd
npm install
```

Create `.env` in `FrontEnd`:

```bash
VITE_API_BASE=http://localhost:7777
VITE_APP_TIMEZONE=Asia/Kolkata
```

Run the frontend dev server (see scripts in [`FrontEnd/package.json`](FrontEnd/package.json)):

```bash
npm run dev
```

The app should be available at `http://localhost:5173` (default Vite port).

---

## Contest Utilities

From `BackEnd`:

```bash
# Mark a contest live by ObjectId
node scripts/makeContestLive.js <contestId>

# Mark a contest live by title (fuzzy search)
node scripts/makeContestLiveByTitle.js "<contest title>"

# Helper used by npm script
npm run contest:live -- <contestId>   # uses src/scripts/setContestLive.js
```

These adjust `startTime` and `endTime` so the contest is considered **Live** by both backend (`getContestPhase` in [`contestController.js`](BackEnd/src/controllers/contestController.js)) and frontend helpers (e.g. [`ContestDashboard.jsx`](FrontEnd/src/pages/ContestDashboard.jsx), [`Contests.jsx`](FrontEnd/src/pages/Contests.jsx)).

---

## Environment & Configuration

- **Backend**
  - All server‑side config via [`BackEnd/.env`](BackEnd/.env)
  - CORS uses `FRONTEND_ORIGIN`
  - Mongo connection via [`config/databse.js`](BackEnd/src/config/databse.js)

- **Frontend**
  - `VITE_API_BASE` controls the API base URL used in [`utils/api.js`](FrontEnd/src/utils/api.js)
  - `VITE_APP_TIMEZONE` is used for consistent dates in [`Dashboard.jsx`](FrontEnd/src/pages/Dashboard.jsx)

---

## Development Notes

- Auth state is stored in Redux:
  - [`authSlice.js`](FrontEnd/src/redux/authSlice.js)
  - [`store.js`](FrontEnd/src/redux/store.js)
- Protected routes are wrapped with [`RequireAuth.jsx`](FrontEnd/src/components/RequireAuth.jsx) and admin checks with [`RequireAdmin.jsx`](FrontEnd/src/components/RequireAdmin.jsx).
- Backend validation helpers are in [`validation.js`](BackEnd/src/utils/validation.js).

Contributions are welcome. Open issues and pull requests against the main branch of this repository.