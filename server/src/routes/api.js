const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const Quiz = require("../models/Quiz");
const Attempt = require("../models/Attempt");
const { requireAuth, requireRole } = require("../middleware/auth");
const { calculateDeadline, isPastDeadline, gradeAttempt, publicQuestion, validateQuizPayload, compareLeaderboard } = require("../utils/quizLogic");

const router = express.Router();

const idOk = id => mongoose.isValidObjectId(id);
const safeUser = user => ({ id: String(user._id), name: user.name, email: user.email, role: user.role });
const quizCard = quiz => ({
  id: String(quiz._id), title: quiz.title, description: quiz.description, instructions: quiz.instructions,
  durationMinutes: quiz.durationMinutes, startAt: quiz.startAt, endAt: quiz.endAt,
  status: quiz.status, questionCount: quiz.questions.length,
  maxScore: quiz.questions.reduce((sum, q) => sum + Number(q.points || 1), 0),
  teacher: quiz.createdBy && typeof quiz.createdBy === "object" ? quiz.createdBy.name : undefined
});
const canViewQuiz = (quiz, user) => user.role === "teacher" && String(quiz.createdBy._id || quiz.createdBy) === String(user._id);
function attemptQuestions(quiz, attempt) {
  const byId = new Map(quiz.questions.map(q => [String(q._id), q]));
  const ids = attempt.questionOrder && attempt.questionOrder.length ? attempt.questionOrder : quiz.questions.map(q => String(q._id));
  return ids.map(id => byId.get(String(id))).filter(Boolean).map(q => {
    const result = publicQuestion(q);
    const orderedIds = attempt.optionOrder && attempt.optionOrder[String(q._id)];
    if (Array.isArray(orderedIds) && orderedIds.length) {
      const options = new Map(result.options.map(o => [String(o._id), o]));
      result.options = orderedIds.map(id => options.get(String(id))).filter(Boolean);
    }
    return result;
  });
}

async function finalizeAttempt(attempt, quiz, auto = false) {
  if (attempt.status !== "in-progress") return attempt;
  attempt.score = gradeAttempt(quiz, attempt.answers);
  attempt.submittedAt = new Date();
  attempt.durationSeconds = Math.max(0, Math.min(Math.floor((attempt.submittedAt - attempt.startedAt) / 1000), Math.floor((attempt.deadlineAt - attempt.startedAt) / 1000)));
  attempt.status = auto ? "auto-submitted" : "submitted";
  await attempt.save();
  return attempt;
}

// Health check
router.get("/health", (_req, res) => res.json({ ok: true, service: "QuizFlow API", time: new Date().toISOString() }));

// Authentication: public registration validates the selected account role.
router.post("/auth/register", async (req, res, next) => {
  try {
    const { name, email, password, role = "student" } = req.body || {};
    const errors = [];
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80) errors.push("Name must be between 2 and 80 characters.");
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) errors.push("Enter a valid email address.");
    if (typeof password !== "string" || password.length < 8 || password.length > 128) errors.push("Password must be between 8 and 128 characters.");
    if (role !== "teacher" && role !== "student") errors.push("Choose either teacher or student.");
    if (errors.length) return res.status(400).json({ message: errors[0], errors });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: "An account with this email already exists." });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash, role });
    const token = jwt.sign({ sub: String(user._id), role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "1d" });
    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) { next(err); }
});

router.post("/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== "string" || typeof password !== "string" || email.length > 254 || password.length > 128) {
      return res.status(400).json({ message: "Enter your email and password." });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: "Email or password is incorrect." });
    const token = jwt.sign({ sub: String(user._id), role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "1d" });
    res.json({ token, user: safeUser(user) });
  } catch (err) { next(err); }
});

router.get("/auth/me", requireAuth, (req, res) => res.json({ user: safeUser(req.user) }));

// Quiz listing and teacher authoring.
router.get("/quizzes", requireAuth, async (req, res, next) => {
  try {
    const filter = req.user.role === "teacher" ? { createdBy: req.user._id, status: { $ne: "archived" } } : { status: "published" };
    const quizzes = await Quiz.find(filter).populate("createdBy", "name").sort({ startAt: 1 });
    const now = Date.now();
    res.json({ quizzes: quizzes.map(q => ({ ...quizCard(q), availability: now < q.startAt.getTime() ? "upcoming" : now >= q.endAt.getTime() ? "ended" : "available" })) });
  } catch (err) { next(err); }
});

router.post("/quizzes", requireAuth, requireRole("teacher"), async (req, res, next) => {
  try {
    const errors = validateQuizPayload(req.body);
    if (errors.length) return res.status(400).json({ message: errors[0], errors });
    const payload = req.body;
    const quiz = await Quiz.create({
      title: payload.title.trim(), description: (payload.description || "").trim(),
      instructions: (payload.instructions || "").trim(), durationMinutes: Number(payload.durationMinutes),
      startAt: new Date(payload.startAt), endAt: new Date(payload.endAt),
      resultsRelease: "after-window", shuffleQuestions: Boolean(payload.shuffleQuestions),
      shuffleOptions: Boolean(payload.shuffleOptions), status: payload.publish === false ? "draft" : "published",
      createdBy: req.user._id,
      questions: payload.questions.map(q => ({
        text: q.text.trim(), type: q.type, points: Number(q.points),
        options: q.options.map(o => ({ text: o.text.trim(), isCorrect: o.isCorrect === true }))
      }))
    });
    res.status(201).json({ quiz: quizCard(quiz) });
  } catch (err) { next(err); }
});

router.get("/quizzes/:id", requireAuth, async (req, res, next) => {
  try {
    if (!idOk(req.params.id)) return res.status(400).json({ message: "Invalid quiz ID." });
    const quiz = await Quiz.findById(req.params.id).populate("createdBy", "name");
    if (!quiz || quiz.status === "archived") return res.status(404).json({ message: "Quiz not found." });
    if (req.user.role === "student" && quiz.status !== "published") return res.status(404).json({ message: "Quiz not found." });
    if (req.user.role === "teacher" && !canViewQuiz(quiz, req.user)) return res.status(403).json({ message: "You can only manage quizzes you created." });
    const result = quizCard(quiz);
    const detailNow = Date.now();
    result.availability = detailNow < quiz.startAt.getTime() ? "upcoming" : detailNow >= quiz.endAt.getTime() ? "ended" : "available";
    if (req.user.role === "teacher") result.questions = quiz.questions.map(q => ({ ...publicQuestion(q), options: q.options.map(o => ({ _id: String(o._id), text: o.text, isCorrect: o.isCorrect })) }));
    else result.questions = quiz.questions.map(publicQuestion);
    res.json({ quiz: result });
  } catch (err) { next(err); }
});

router.patch("/quizzes/:id", requireAuth, requireRole("teacher"), async (req, res, next) => {
  try {
    if (!idOk(req.params.id)) return res.status(400).json({ message: "Invalid quiz ID." });
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!quiz) return res.status(404).json({ message: "Quiz not found." });
    if (quiz.status !== "draft") return res.status(409).json({ message: "Only draft quizzes can be edited." });
    const errors = validateQuizPayload(req.body);
    if (errors.length) return res.status(400).json({ message: errors[0], errors });
    const payload = req.body;
    Object.assign(quiz, {
      title: payload.title.trim(),
      description: (payload.description || "").trim(),
      instructions: (payload.instructions || "").trim(),
      durationMinutes: Number(payload.durationMinutes),
      startAt: new Date(payload.startAt),
      endAt: new Date(payload.endAt),
      shuffleQuestions: Boolean(payload.shuffleQuestions),
      shuffleOptions: Boolean(payload.shuffleOptions),
      questions: payload.questions.map(q => ({
        text: q.text.trim(), type: q.type, points: Number(q.points),
        options: q.options.map(o => ({ text: o.text.trim(), isCorrect: o.isCorrect === true }))
      }))
    });
    await quiz.save();
    res.json({ message: "Draft quiz updated.", quiz: quizCard(quiz) });
  } catch (err) { next(err); }
});

router.patch("/quizzes/:id/publish", requireAuth, requireRole("teacher"), async (req, res, next) => {
  try {
    if (!idOk(req.params.id)) return res.status(400).json({ message: "Invalid quiz ID." });
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!quiz) return res.status(404).json({ message: "Quiz not found." });
    if (quiz.status !== "draft") return res.status(409).json({ message: "Only draft quizzes can be published." });
    quiz.status = "published";
    await quiz.save();
    res.json({ message: "Quiz published.", quiz: quizCard(quiz) });
  } catch (err) { next(err); }
});

router.patch("/quizzes/:id/archive", requireAuth, requireRole("teacher"), async (req, res, next) => {
  try {
    if (!idOk(req.params.id)) return res.status(400).json({ message: "Invalid quiz ID." });
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!quiz) return res.status(404).json({ message: "Quiz not found." });
    quiz.status = "archived";
    await quiz.save();
    res.json({ message: "Quiz archived." });
  } catch (err) { next(err); }
});

// Student attempts.
router.post("/quizzes/:id/start", requireAuth, requireRole("student"), async (req, res, next) => {
  try {
    if (!idOk(req.params.id)) return res.status(400).json({ message: "Invalid quiz ID." });
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz || quiz.status !== "published") return res.status(404).json({ message: "This quiz is not available." });
    const now = new Date();
    if (now < quiz.startAt) return res.status(403).json({ message: "This quiz has not opened yet." });
    if (now >= quiz.endAt) return res.status(403).json({ message: "The quiz window has closed." });
    let attempt = await Attempt.findOne({ quiz: quiz._id, student: req.user._id });
    if (attempt && attempt.status !== "in-progress") return res.status(409).json({ message: "You have already submitted an attempt for this quiz." });
    if (attempt && isPastDeadline(now, attempt.deadlineAt)) {
      await finalizeAttempt(attempt, quiz, true);
      return res.status(409).json({ message: "Your quiz deadline has passed. Your attempt was automatically submitted." });
    }
    if (!attempt) {
      const startedAt = new Date();
      const deadlineAt = calculateDeadline(startedAt, quiz.durationMinutes, quiz.endAt);
      const questionIds = quiz.questions.map(q => String(q._id));
      const optionOrder = {};
      for (const q of quiz.questions) {
        let ids = q.options.map(o => String(o._id));
        if (quiz.shuffleOptions) ids = ids.sort(() => Math.random() - 0.5);
        optionOrder[String(q._id)] = ids;
      }
      const orderedQuestions = quiz.shuffleQuestions ? questionIds.sort(() => Math.random() - 0.5) : questionIds;
      attempt = await Attempt.create({ quiz: quiz._id, student: req.user._id, startedAt, deadlineAt, maxScore: quiz.questions.reduce((s, q) => s + q.points, 0), questionOrder: orderedQuestions, optionOrder });
    }
    res.status(201).json({ attempt: { id: String(attempt._id), status: attempt.status, startedAt: attempt.startedAt, deadlineAt: attempt.deadlineAt, serverTime: new Date(), quiz: quizCard(quiz), questions: attemptQuestions(quiz, attempt) } });
  } catch (err) { next(err); }
});

router.get("/attempts/:id", requireAuth, requireRole("student"), async (req, res, next) => {
  try {
    if (!idOk(req.params.id)) return res.status(400).json({ message: "Invalid attempt ID." });
    const attempt = await Attempt.findOne({ _id: req.params.id, student: req.user._id }).populate("quiz");
    if (!attempt) return res.status(404).json({ message: "Attempt not found." });
    if (attempt.status === "in-progress" && isPastDeadline(new Date(), attempt.deadlineAt)) await finalizeAttempt(attempt, attempt.quiz, true);
    if (attempt.status !== "in-progress") return res.json({ attempt: { id: String(attempt._id), status: attempt.status, submittedAt: attempt.submittedAt, message: "This attempt has been submitted." } });
    res.json({ attempt: {
      id: String(attempt._id), status: attempt.status, startedAt: attempt.startedAt, deadlineAt: attempt.deadlineAt,
      serverTime: new Date(), quiz: quizCard(attempt.quiz), questions: attemptQuestions(attempt.quiz, attempt),
      answers: attempt.answers.map(a => ({ questionId: String(a.questionId), selectedOptionIds: a.selectedOptionIds.map(String) }))
    } });
  } catch (err) { next(err); }
});

router.put("/attempts/:id/answers/:questionId", requireAuth, requireRole("student"), async (req, res, next) => {
  try {
    const { id, questionId } = req.params;
    if (!idOk(id) || !idOk(questionId)) return res.status(400).json({ message: "Invalid attempt or question ID." });
    const selectedOptionIds = req.body && req.body.selectedOptionIds;
    if (!Array.isArray(selectedOptionIds) || selectedOptionIds.length > 8 || selectedOptionIds.some(x => !idOk(x))) return res.status(400).json({ message: "Select valid answer options." });
    const attempt = await Attempt.findOne({ _id: id, student: req.user._id, status: "in-progress" });
    if (!attempt) return res.status(404).json({ message: "Active attempt not found." });
    const quiz = await Quiz.findById(attempt.quiz);
    if (!quiz) return res.status(404).json({ message: "Quiz not found." });
    const now = new Date();
    if (isPastDeadline(now, attempt.deadlineAt) || isPastDeadline(now, quiz.endAt)) {
      await finalizeAttempt(attempt, quiz, true);
      return res.status(409).json({ message: "Time is up. Answers can no longer be changed; your attempt is being submitted." });
    }
    const question = quiz.questions.id(questionId);
    if (!question) return res.status(404).json({ message: "Question not found in this quiz." });
    const allowed = new Set(question.options.map(o => String(o._id)));
    if (selectedOptionIds.some(id => !allowed.has(String(id)))) return res.status(400).json({ message: "One or more selected options do not belong to this question." });
    if (question.type === "single" && selectedOptionIds.length > 1) return res.status(400).json({ message: "Choose only one option for this question." });
    const existing = attempt.answers.find(a => String(a.questionId) === String(questionId));
    if (existing) {
      existing.selectedOptionIds = selectedOptionIds;
      existing.updatedAt = now;
    } else attempt.answers.push({ questionId, selectedOptionIds, updatedAt: now });
    await attempt.save();
    res.json({ message: "Answer saved.", savedAt: now, serverTime: new Date() });
  } catch (err) { next(err); }
});

router.post("/attempts/:id/submit", requireAuth, requireRole("student"), async (req, res, next) => {
  try {
    if (!idOk(req.params.id)) return res.status(400).json({ message: "Invalid attempt ID." });
    const attempt = await Attempt.findOne({ _id: req.params.id, student: req.user._id }).populate("quiz");
    if (!attempt) return res.status(404).json({ message: "Attempt not found." });
    if (attempt.status === "in-progress") {
      const expired = isPastDeadline(new Date(), attempt.deadlineAt) || isPastDeadline(new Date(), attempt.quiz.endAt);
      await finalizeAttempt(attempt, attempt.quiz, expired);
    }
    res.json({ message: "Attempt submitted.", attempt: { id: String(attempt._id), status: attempt.status, submittedAt: attempt.submittedAt } });
  } catch (err) { next(err); }
});

router.get("/attempts/:id/result", requireAuth, requireRole("student"), async (req, res, next) => {
  try {
    if (!idOk(req.params.id)) return res.status(400).json({ message: "Invalid attempt ID." });
    const attempt = await Attempt.findOne({ _id: req.params.id, student: req.user._id }).populate("quiz").populate("student", "name");
    if (!attempt) return res.status(404).json({ message: "Attempt not found." });
    if (attempt.status === "in-progress") return res.status(409).json({ message: "Submit your attempt before viewing results." });
    if (new Date() < attempt.quiz.endAt) return res.json({ released: false, releaseAt: attempt.quiz.endAt, message: "Your score and correct answers will be released after the quiz window closes." });
    const questions = attempt.quiz.questions.map(q => {
      const selected = (attempt.answers.find(a => String(a.questionId) === String(q._id)) || {}).selectedOptionIds || [];
      return { ...publicQuestion(q), options: q.options.map(o => ({ _id: String(o._id), text: o.text, isCorrect: o.isCorrect, selected: selected.map(String).includes(String(o._id)) })), earnedPoints: require("../utils/quizLogic").gradeQuestion(q, selected) };
    });
    res.json({ released: true, score: attempt.score, maxScore: attempt.maxScore, percentage: attempt.maxScore ? Math.round(attempt.score / attempt.maxScore * 100) : 0, durationSeconds: attempt.durationSeconds, status: attempt.status, submittedAt: attempt.submittedAt, quiz: quizCard(attempt.quiz), questions });
  } catch (err) { next(err); }
});


router.get("/quizzes/:id/my-attempt", requireAuth, requireRole("student"), async (req, res, next) => {
  try {
    if (!idOk(req.params.id)) return res.status(400).json({ message: "Invalid quiz ID." });
    const attempt = await Attempt.findOne({ quiz: req.params.id, student: req.user._id }).sort({ createdAt: -1 });
    if (!attempt) return res.status(404).json({ message: "You have not attempted this quiz yet." });
    res.json({ attempt: { id: String(attempt._id), status: attempt.status, submittedAt: attempt.submittedAt, deadlineAt: attempt.deadlineAt } });
  } catch (err) { next(err); }
});

router.get("/quizzes/:id/leaderboard", requireAuth, async (req, res, next) => {
  try {
    if (!idOk(req.params.id)) return res.status(400).json({ message: "Invalid quiz ID." });
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found." });
    if (req.user.role === "teacher" && String(quiz.createdBy) !== String(req.user._id)) return res.status(403).json({ message: "You can only view your own quiz leaderboard." });
    if (req.user.role === "student" && new Date() < quiz.endAt) return res.status(403).json({ message: "The leaderboard will be available after the quiz window closes." });
    const attempts = await Attempt.find({ quiz: quiz._id, status: { $in: ["submitted", "auto-submitted"] } }).populate("student", "name");
    const rows = attempts.map(a => ({ studentName: a.student.name, score: a.score, maxScore: a.maxScore, durationSeconds: a.durationSeconds || 0, submittedAt: a.submittedAt, status: a.status }));
    rows.sort(compareLeaderboard);
    res.json({ leaderboard: rows.map((row, i) => ({ rank: i + 1, ...row })) });
  } catch (err) { next(err); }
});

router.get("/quizzes/:id/analytics", requireAuth, requireRole("teacher"), async (req, res, next) => {
  try {
    if (!idOk(req.params.id)) return res.status(400).json({ message: "Invalid quiz ID." });
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!quiz) return res.status(404).json({ message: "Quiz not found." });
    const attempts = await Attempt.find({ quiz: quiz._id, status: { $in: ["submitted", "auto-submitted"] } });
    const questionStats = quiz.questions.map(q => {
      let wrong = 0, answered = 0;
      for (const attempt of attempts) {
        const answer = attempt.answers.find(a => String(a.questionId) === String(q._id));
        if (answer && answer.selectedOptionIds.length) answered++;
        if (require("../utils/quizLogic").gradeQuestion(q, answer ? answer.selectedOptionIds : []) === 0) wrong++;
      }
      return { questionId: String(q._id), question: q.text, wrongCount: wrong, answeredCount: answered, wrongRate: attempts.length ? Math.round(wrong / attempts.length * 100) : 0 };
    }).sort((a, b) => b.wrongRate - a.wrongRate);
    res.json({ totalAttempts: attempts.length, averageScore: attempts.length ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length) : 0, questionStats });
  } catch (err) { next(err); }
});

module.exports = router;
