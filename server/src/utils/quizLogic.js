function calculateDeadline(startedAt, durationMinutes, quizEndAt) {
  const startMs = new Date(startedAt).getTime();
  const durationMs = Number(durationMinutes) * 60 * 1000;
  const endMs = new Date(quizEndAt).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(durationMs) || !Number.isFinite(endMs) || durationMs <= 0) {
    throw new Error("Invalid deadline inputs");
  }
  return new Date(Math.min(startMs + durationMs, endMs));
}

function isPastDeadline(now, deadline) {
  return new Date(now).getTime() >= new Date(deadline).getTime();
}

function gradeQuestion(question, selectedOptionIds) {
  const selected = [...new Set((selectedOptionIds || []).map(String))].sort();
  const correct = question.options.filter(o => o.isCorrect).map(o => String(o._id || o.id)).sort();
  if (!selected.length || !correct.length) return 0;
  if (selected.length !== correct.length) return 0;
  return selected.every((id, i) => id === correct[i]) ? Number(question.points || 1) : 0;
}

function gradeAttempt(quiz, answers) {
  let score = 0;
  const answerMap = new Map((answers || []).map(a => [String(a.questionId), a.selectedOptionIds || []]));
  for (const question of quiz.questions) score += gradeQuestion(question, answerMap.get(String(question._id)) || []);
  return score;
}

function compareLeaderboard(a, b) {
  const scoreDiff = Number(b.score || 0) - Number(a.score || 0);
  if (scoreDiff !== 0) return scoreDiff;
  const timeDiff = Number(a.durationSeconds || Infinity) - Number(b.durationSeconds || Infinity);
  if (timeDiff !== 0) return timeDiff;
  return String(a.studentName || "").localeCompare(String(b.studentName || ""));
}

function publicQuestion(question) {
  return {
    _id: String(question._id),
    text: question.text,
    type: question.type,
    points: question.points,
    options: question.options.map(option => ({ _id: String(option._id), text: option.text }))
  };
}

function validateQuizPayload(input) {
  const errors = [];
  if (!input || typeof input !== "object") return ["Quiz data is required."];
  if (typeof input.title !== "string" || input.title.trim().length < 3 || input.title.trim().length > 120) errors.push("Title must be between 3 and 120 characters.");
  if (!Number.isInteger(Number(input.durationMinutes)) || Number(input.durationMinutes) < 1 || Number(input.durationMinutes) > 600) errors.push("Duration must be a whole number from 1 to 600 minutes.");
  const start = new Date(input.startAt).getTime(), end = new Date(input.endAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) errors.push("A valid start and end date are required.");
  else if (end <= start) errors.push("The end time must be after the start time.");
  if (!Array.isArray(input.questions) || input.questions.length < 1 || input.questions.length > 100) errors.push("Add between 1 and 100 questions.");
  else input.questions.forEach((q, i) => {
    const label = `Question ${i + 1}`;
    if (!q || typeof q.text !== "string" || !q.text.trim() || q.text.trim().length > 2000) errors.push(`${label}: enter text up to 2,000 characters.`);
    if (!["single", "multiple"].includes(q.type)) errors.push(`${label}: choose single-answer or multiple-answer.`);
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 8) errors.push(`${label}: add 2–8 options.`);
    else {
      if (q.options.some(o => !o || typeof o.text !== "string" || !o.text.trim() || o.text.length > 500)) errors.push(`${label}: every option needs text up to 500 characters.`);
      const correctCount = q.options.filter(o => o && o.isCorrect === true).length;
      if (correctCount < 1) errors.push(`${label}: mark at least one correct answer.`);
      if (q.type === "single" && correctCount !== 1) errors.push(`${label}: single-answer questions must have exactly one correct option.`);
    }
    if (!Number.isInteger(Number(q.points)) || Number(q.points) < 1 || Number(q.points) > 100) errors.push(`${label}: points must be 1–100.`);
  });
  if (typeof input.description === "string" && input.description.length > 2000) errors.push("Description must be at most 2,000 characters.");
  return errors;
}

module.exports = { calculateDeadline, isPastDeadline, gradeQuestion, gradeAttempt, compareLeaderboard, publicQuestion, validateQuizPayload };
