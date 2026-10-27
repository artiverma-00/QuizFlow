# QuizFlow — Timed Quiz Platform

QuizFlow is a responsive full-stack timed assessment application built to meet the supplied assignment. It uses React + Vite for the frontend, Node.js + Express for the API, MongoDB + Mongoose for persistence, JWT for authentication, and Jest for backend logic tests.

## Features implemented

- Teacher and student roles with role-protected API routes.
- Student and teacher self-registration with server-validated account roles.
- Teacher quiz creation with single-answer and multiple-answer questions, points, duration, start/end window, instructions, and optional question/option shuffling.
- Teacher quiz list, quiz management details, and question-level analytics.
- Student quiz catalog and quiz instructions.
- One-question-at-a-time assessment interface, answer navigation, flag-for-review, auto-save, and submit confirmation.
- Server-calculated deadline: the attempt deadline is the earlier of `startedAt + duration` and the quiz `endAt`.
- The backend rejects answer updates at/after the deadline. The browser timer is only a visual countdown.
- Server-side background sweep automatically submits expired attempts; endpoints also finalize overdue attempts when accessed.
- Correct-answer flags are stripped from student-facing question payloads. Correct answers and detailed answer review are returned only after submission and after the quiz window closes.
- Draft and archived quizzes are not exposed to students, including when a student attempts to access a quiz URL directly.
- Automatic grading uses the correct answers selected by the teacher during quiz creation. Each question awards its configured points only when the student's answer exactly matches the answer key; unanswered or incorrect answers award zero points.
- Leaderboard sorts by score descending, then completion time ascending, then student name for deterministic ties.
- Responsive desktop/mobile layout based on the provided Stitch export's design system: indigo/violet palette, Inter typography, modular panels, assessment timer, question navigator, and focused exam canvas.
- Demo seed data and nine automated unit tests for important grading, deadline, answer-key privacy, and ranking rules.

## Requirements

- Node.js 20 or newer
- npm
- A MongoDB database: MongoDB Atlas or a local MongoDB instance

No paid third-party API key is required. You do need a MongoDB connection string. No AI API is used at runtime.

## Quick start (Windows)

1. Extract the ZIP to a folder.
2. Double-click `setup.bat`. It installs dependencies and creates local environment files.
3. Open the root `.env` file in a text editor. Set:
   - `MONGODB_URI` to your own MongoDB Atlas connection string.
   - `JWT_SECRET` to a random secret of at least 32 characters.
4. In MongoDB Atlas, create a database user and allow your current IP address in Network Access. Do not commit your connection string.
5. Double-click `seed-demo-data.bat` once. This creates demo accounts and sample quizzes.
6. Double-click `start.bat`.
7. Open the frontend at `http://localhost:5173`.

If Windows asks about network access, allow Node.js for your private network.

## Manual setup (Windows/macOS/Linux)

```bash
# From the project root
cp .env.example .env
cp client/.env.example client/.env
npm install
```

Edit `.env` with a real `MONGODB_URI` and a strong `JWT_SECRET`, then seed and start:

```bash
npm run seed
npm run dev
```

Frontend: `http://localhost:5173`  
Backend health check: `http://localhost:5000/api/health`

Run tests:

```bash
npm test
```

Build the frontend:

```bash
npm run build
```

## Demo logins

Both demo accounts use the password `QuizFlow123!`.

| Role | Email |
|---|---|
| Teacher | `teacher@quizflow.demo` |
| Student | `student@quizflow.demo` |

The seed script creates:
- An active `JavaScript Fundamentals` quiz for taking immediately.
- An ended `Web Fundamentals — Practice Quiz` with a submitted demo attempt for released results and leaderboard inspection.

The seed script resets quizzes created by the demo teacher and attempts belonging to the demo student. Do not run it against a production database containing data you want to keep.

## Environment settings

Root `.env` settings (see `.env.example`):

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret (32+ characters) |
| `JWT_EXPIRES_IN` | Token lifetime, defaults to `1d` |
| `PORT` | API port, defaults to `5000` |
| `CLIENT_URL` | Allowed frontend origin, defaults to `http://localhost:5173` |
| `NODE_ENV` | Runtime mode |

Frontend `client/.env` setting (see `client/.env.example`):

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend API base URL |

Never expose `MONGODB_URI` or `JWT_SECRET` in frontend variables. Never commit `.env`.

## API overview

- `POST /api/auth/register` — create a student or teacher account with a validated role
- `POST /api/auth/login` — authenticate
- `GET /api/auth/me` — current account
- `GET /api/quizzes` — role-appropriate quiz listing
- `POST /api/quizzes` — teacher creates a quiz
- `GET /api/quizzes/:id` — quiz details; answer key is teacher-only
- `PATCH /api/quizzes/:id` — teacher updates an owned draft quiz
- `PATCH /api/quizzes/:id/publish` — teacher publishes an owned draft quiz
- `PATCH /api/quizzes/:id/archive` — archive a teacher-owned quiz
- `POST /api/quizzes/:id/start` — start/resume an eligible student attempt
- `GET /api/attempts/:id` — recover an active attempt without correctness flags
- `PUT /api/attempts/:id/answers/:questionId` — save an answer, rejecting late changes
- `POST /api/attempts/:id/submit` — submit or finalize an attempt
- `GET /api/attempts/:id/result` — results, answer review only after release
- `GET /api/quizzes/:id/my-attempt` — current student's attempt status
- `GET /api/quizzes/:id/leaderboard` — ranked submitted attempts
- `GET /api/quizzes/:id/analytics` — teacher-only question performance analytics
- `GET /api/health` — health check

## Data model and design decisions

### User
`name`, normalized unique `email`, `passwordHash` (excluded from ordinary queries), `role` (`teacher` or `student`).

### Quiz
`title`, `description`, `instructions`, `durationMinutes`, `startAt`, `endAt`, `status`, `createdBy`, `questions`, `resultsRelease`, `shuffleQuestions`, `shuffleOptions`.

Question options store `isCorrect` on the server. Student serializers explicitly return only option IDs and text during active attempts.

### Attempt
`quiz`, `student`, `startedAt`, `deadlineAt`, `submittedAt`, `status`, `answers`, `score`, `maxScore`, `durationSeconds`, plus per-attempt question/option order for shuffling. A unique `(quiz, student)` index enforces one attempt per student per quiz.

### Answer
Embedded in the attempt as `questionId`, `selectedOptionIds`, and `updatedAt`. Answers are validated against the quiz question and its actual option IDs on every write.

### Answer keys and marks
Teachers select the correct option or options while creating or editing a draft quiz and assign points to every question. Single-answer questions require the one selected correct option. Multiple-answer questions require the complete correct set: selecting only some correct options, selecting an incorrect option, or leaving the question unanswered earns zero points. The final score is the sum of the points earned for each question.

### Security decisions

- Server time determines all attempt deadlines. The effective deadline is `min(startedAt + duration, quiz.endAt)`.
- Late answer writes are rejected server-side even if the client changes its clock or bypasses the UI.
- Correct answers are not included in student-facing active quiz payloads.
- Result endpoint withholds scores and answer review until both the attempt is submitted and the quiz window has ended.
- API role checks protect teacher-only operations and students can only access their own attempts.
- Public registration accepts only the validated `student` or `teacher` roles selected in the registration form.
- Multiple-answer grading uses exact-set matching: all correct options and no incorrect options must be selected to earn the question's points.

## Automated tests

The Jest suite covers:
1. Deadline is capped by the quiz end window.
2. Attempt duration controls the deadline when it ends first.
3. The exact deadline is considered expired.
4. Single-answer grading.
5. Exact-set multiple-answer grading.
6. Total score calculation with unanswered questions.
7. Leaderboard score/time ordering.
8. Student-safe serialization excludes `isCorrect`.
9. Server validation rejects multiple correct options for a single-answer question.
10. Per-question points are awarded only for answers matching the teacher's answer key.

Run with `npm test`.

## What's finished

The core full-stack flows, demo data, responsive UI, backend validation, grading, role checks, deadline enforcement, answer-key protection, results release, leaderboard, analytics, environment example, and tests are implemented.

## Known limitations / future work

- Production deployment is not included; configure the frontend and API origins and use a hosted MongoDB instance before deploying.
- JWT is stored in browser local storage for this demo. A production deployment should consider secure, HttpOnly cookies, refresh-token rotation, and stronger session controls.
- The background timeout sweeper is intentionally simple and runs in the API process. For a multi-instance deployment, use a durable job queue or database-backed worker with atomic claim/transition semantics.
- Quiz editing after publication, invitation/class enrollment, password reset email, and real notification delivery are not implemented.
- Analytics currently treats unanswered questions as missed and uses exact-set grading for multiple-answer questions.
- Shuffle order is stored per attempt. The UI is functional, but expanded audit logging and robust retry/idempotency handling would be useful for a production exam system.
- The seed data is for local demonstration only; change demo passwords and remove seeded accounts before production use.

## AI tools used

- OpenAI ChatGPT: assisted with architecture planning, implementation drafting, validation/test design, and README documentation.
  

