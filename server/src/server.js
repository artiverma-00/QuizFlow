require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const app = require("./app");
const Attempt = require("./models/Attempt");
const Quiz = require("./models/Quiz");
const { gradeAttempt, isPastDeadline } = require("./utils/quizLogic");

const PORT = Number(process.env.PORT || 5000);
let sweepRunning = false;

async function sweepExpiredAttempts() {
  if (sweepRunning || mongoose.connection.readyState !== 1) return;
  sweepRunning = true;
  try {
    const now = new Date();
    const due = await Attempt.find({ status: "in-progress", deadlineAt: { $lte: now } }).limit(100);
    for (const attempt of due) {
      const quiz = await Quiz.findById(attempt.quiz);
      if (!quiz || attempt.status !== "in-progress") continue;
      attempt.score = gradeAttempt(quiz, attempt.answers);
      attempt.submittedAt = now;
      attempt.durationSeconds = Math.max(0, Math.min(Math.floor((now - attempt.startedAt) / 1000), Math.floor((attempt.deadlineAt - attempt.startedAt) / 1000)));
      attempt.status = "auto-submitted";
      await attempt.save();
    }
    const windowClosed = await Attempt.find({ status: "in-progress" }).limit(100);
    for (const attempt of windowClosed) {
      const quiz = await Quiz.findById(attempt.quiz);
      if (!quiz || !isPastDeadline(now, quiz.endAt) || attempt.status !== "in-progress") continue;
      attempt.score = gradeAttempt(quiz, attempt.answers);
      attempt.submittedAt = now;
      attempt.durationSeconds = Math.max(0, Math.min(Math.floor((now - attempt.startedAt) / 1000), Math.floor((attempt.deadlineAt - attempt.startedAt) / 1000)));
      attempt.status = "auto-submitted";
      await attempt.save();
    }
  } catch (err) { console.error("Expired attempt sweep failed:", err.message); }
  finally { sweepRunning = false; }
}

async function start() {
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI. Copy .env.example to .env and set your MongoDB connection string.");
    process.exit(1);
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error("JWT_SECRET must be set to a random secret of at least 32 characters.");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected.");
  app.listen(PORT, () => console.log(`QuizFlow API running at http://localhost:${PORT}`));
  setInterval(sweepExpiredAttempts, 3000);
}
if (require.main === module) start().catch(err => { console.error("Startup failed:", err.message); process.exit(1); });
module.exports = { start, sweepExpiredAttempts };
