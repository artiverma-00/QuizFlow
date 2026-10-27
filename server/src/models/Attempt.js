const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  selectedOptionIds: [{ type: mongoose.Schema.Types.ObjectId }],
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const attemptSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  startedAt: { type: Date, required: true },
  deadlineAt: { type: Date, required: true },
  submittedAt: { type: Date, default: null },
  status: { type: String, enum: ["in-progress", "submitted", "auto-submitted"], default: "in-progress", index: true },
  answers: { type: [answerSchema], default: [] },
  questionOrder: [{ type: String }],
  optionOrder: { type: mongoose.Schema.Types.Mixed, default: {} },
  score: { type: Number, default: null },
  maxScore: { type: Number, required: true },
  durationSeconds: { type: Number, default: null }
}, { timestamps: true });

attemptSchema.index({ quiz: 1, student: 1 }, { unique: true });
attemptSchema.index({ quiz: 1, score: -1, durationSeconds: 1 });
module.exports = mongoose.model("Attempt", attemptSchema);
