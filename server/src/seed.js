require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Quiz = require("./models/Quiz");
const Attempt = require("./models/Attempt");

async function run() {
  if (!process.env.MONGODB_URI) throw new Error("Set MONGODB_URI in the project-root .env file first.");
  await mongoose.connect(process.env.MONGODB_URI);
  const teacherEmail = "teacher@quizflow.demo";
  const studentEmail = "student@quizflow.demo";
  const passwordHash = await bcrypt.hash("QuizFlow123!", 12);
  const teacher = await User.findOneAndUpdate({ email: teacherEmail }, { name: "Dr. Elena Rostova", email: teacherEmail, passwordHash, role: "teacher" }, { upsert: true, new: true, setDefaultsOnInsert: true });
  const student = await User.findOneAndUpdate({ email: studentEmail }, { name: "Alex Morgan", email: studentEmail, passwordHash, role: "student" }, { upsert: true, new: true, setDefaultsOnInsert: true });

  await Quiz.deleteMany({ createdBy: teacher._id });
  await Attempt.deleteMany({ student: student._id });
  const now = new Date();
  const active = await Quiz.create({
    title: "JavaScript Fundamentals",
    description: "A focused assessment of JavaScript language fundamentals.",
    instructions: "You have 20 minutes. Answer one question at a time. Your attempt will submit automatically when the timer expires. Correct answers are released after the quiz window closes.",
    durationMinutes: 20, startAt: new Date(now.getTime() - 60 * 60 * 1000), endAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    status: "published", createdBy: teacher._id, shuffleQuestions: false, shuffleOptions: false,
    questions: [
      { text: "Which keyword declares a block-scoped variable that can be reassigned?", type: "single", points: 2, options: [{ text: "const", isCorrect: false }, { text: "let", isCorrect: true }, { text: "static", isCorrect: false }, { text: "define", isCorrect: false }] },
      { text: "Which of the following are valid JavaScript primitive types?", type: "multiple", points: 3, options: [{ text: "string", isCorrect: true }, { text: "boolean", isCorrect: true }, { text: "array", isCorrect: false }, { text: "bigint", isCorrect: true }] },
      { text: "What does Array.prototype.map() return?", type: "single", points: 2, options: [{ text: "A new array", isCorrect: true }, { text: "The original array only", isCorrect: false }, { text: "A boolean", isCorrect: false }, { text: "Always undefined", isCorrect: false }] },
      { text: "Which statement about const is true?", type: "single", points: 2, options: [{ text: "The binding cannot be reassigned", isCorrect: true }, { text: "Objects declared const are deeply immutable", isCorrect: false }, { text: "It is function-scoped", isCorrect: false }, { text: "It can be redeclared in the same scope", isCorrect: false }] }
    ]
  });

  const ended = await Quiz.create({
    title: "Web Fundamentals — Practice Quiz",
    description: "A completed demo assessment for inspecting results and the leaderboard.",
    instructions: "Demo results are released because this quiz window has ended.",
    durationMinutes: 15, startAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), endAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    status: "published", createdBy: teacher._id,
    questions: [
      { text: "Which protocol is used to transfer web pages?", type: "single", points: 2, options: [{ text: "HTTP", isCorrect: true }, { text: "FTP only", isCorrect: false }, { text: "SMTP", isCorrect: false }] },
      { text: "Which are frontend technologies?", type: "multiple", points: 3, options: [{ text: "HTML", isCorrect: true }, { text: "CSS", isCorrect: true }, { text: "React", isCorrect: true }, { text: "MongoDB", isCorrect: false }] }
    ]
  });

  const qs = ended.questions;
  const submittedAt = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  await Attempt.create({
    quiz: ended._id, student: student._id, startedAt: new Date(submittedAt.getTime() - 5 * 60 * 1000),
    deadlineAt: new Date(submittedAt.getTime() + 10 * 60 * 1000), submittedAt, status: "submitted",
    answers: [
      { questionId: qs[0]._id, selectedOptionIds: [qs[0].options[0]._id] },
      { questionId: qs[1]._id, selectedOptionIds: [qs[1].options[0]._id, qs[1].options[1]._id, qs[1].options[2]._id] }
    ], score: 5, maxScore: 5, durationSeconds: 300
  });
  console.log("Seed complete.");
  console.log("Teacher: teacher@quizflow.demo / QuizFlow123!");
  console.log("Student: student@quizflow.demo / QuizFlow123!");
  console.log(`Active quiz ID: ${active._id}`);
  console.log(`Ended quiz ID: ${ended._id}`);
  await mongoose.disconnect();
}
run().catch(async err => { console.error(err.message); await mongoose.disconnect().catch(()=>{}); process.exit(1); });
