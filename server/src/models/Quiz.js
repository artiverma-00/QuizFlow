const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true, maxlength: 500 },
  isCorrect: { type: Boolean, required: true, default: false }
}, { _id: true });

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  type: { type: String, enum: ["single", "multiple"], required: true },
  points: { type: Number, min: 1, max: 100, default: 1 },
  options: { type: [optionSchema], validate: v => v.length >= 2 && v.length <= 8 }
}, { _id: true });

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 2000, default: "" },
  instructions: { type: String, trim: true, maxlength: 3000, default: "Read each question carefully. Your attempt submits automatically when time expires." },
  durationMinutes: { type: Number, required: true, min: 1, max: 600 },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  resultsRelease: { type: String, enum: ["after-window"], default: "after-window" },
  shuffleQuestions: { type: Boolean, default: false },
  shuffleOptions: { type: Boolean, default: false },
  status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  questions: { type: [questionSchema], validate: v => v.length >= 1 && v.length <= 100 }
}, { timestamps: true });

quizSchema.index({ status: 1, startAt: 1, endAt: 1 });
quizSchema.index({ createdBy: 1, createdAt: -1 });
module.exports = mongoose.model("Quiz", quizSchema);
