const { calculateDeadline, isPastDeadline, gradeQuestion, gradeAttempt, compareLeaderboard, publicQuestion, validateQuizPayload } = require("../src/utils/quizLogic");

describe("QuizFlow backend rules", () => {
  test("deadline is the earlier of duration and quiz end window", () => {
    const start = new Date("2026-10-27T10:00:00.000Z");
    const quizEnd = new Date("2026-10-27T10:12:00.000Z");
    expect(calculateDeadline(start, 20, quizEnd).toISOString()).toBe("2026-10-27T10:12:00.000Z");
  });

  test("deadline uses attempt duration when it ends first", () => {
    const start = new Date("2026-10-27T10:00:00.000Z");
    const quizEnd = new Date("2026-10-27T11:00:00.000Z");
    expect(calculateDeadline(start, 15, quizEnd).toISOString()).toBe("2026-10-27T10:15:00.000Z");
  });

  test("answer updates are considered late at the exact deadline", () => {
    const deadline = new Date("2026-10-27T10:15:00.000Z");
    expect(isPastDeadline(new Date("2026-10-27T10:14:59.999Z"), deadline)).toBe(false);
    expect(isPastDeadline(deadline, deadline)).toBe(true);
  });

  test("single-answer grading awards points only for the exact correct option", () => {
    const q = { points: 2, options: [{ _id: "a", isCorrect: true }, { _id: "b", isCorrect: false }] };
    expect(gradeQuestion(q, ["a"])).toBe(2);
    expect(gradeQuestion(q, ["b"])).toBe(0);
  });

  test("multiple-answer grading requires the complete correct set", () => {
    const q = { points: 3, options: [{ _id: "a", isCorrect: true }, { _id: "b", isCorrect: true }, { _id: "c", isCorrect: false }] };
    expect(gradeQuestion(q, ["a", "b"])).toBe(3);
    expect(gradeQuestion(q, ["a"])).toBe(0);
    expect(gradeQuestion(q, ["a", "b", "c"])).toBe(0);
  });

  test("attempt grading sums earned points and treats unanswered questions as zero", () => {
    const quiz = { questions: [
      { _id: "q1", points: 2, options: [{ _id: "a", isCorrect: true }] },
      { _id: "q2", points: 3, options: [{ _id: "b", isCorrect: true }] }
    ] };
    expect(gradeAttempt(quiz, [{ questionId: "q1", selectedOptionIds: ["a"] }])).toBe(2);
  });

  test("attempt grading awards configured points for each matching answer key", () => {
    const quiz = { questions: [
      { _id: "q1", points: 2, options: [{ _id: "a", isCorrect: true }, { _id: "b", isCorrect: false }] },
      { _id: "q2", points: 5, options: [{ _id: "c", isCorrect: true }, { _id: "d", isCorrect: false }] },
      { _id: "q3", points: 10, options: [{ _id: "e", isCorrect: true }, { _id: "f", isCorrect: false }] }
    ] };
    expect(gradeAttempt(quiz, [
      { questionId: "q1", selectedOptionIds: ["a"] },
      { questionId: "q2", selectedOptionIds: ["d"] },
      { questionId: "q3", selectedOptionIds: ["e"] }
    ])).toBe(12);
  });

  test("leaderboard sorts score descending then completion time ascending", () => {
    const rows = [
      { studentName: "Late", score: 5, durationSeconds: 100 },
      { studentName: "Fast", score: 5, durationSeconds: 80 },
      { studentName: "Top", score: 6, durationSeconds: 120 }
    ].sort(compareLeaderboard);
    expect(rows.map(r => r.studentName)).toEqual(["Top", "Fast", "Late"]);
  });

  test("student-safe question serialization never includes correctness flags", () => {
    const q = { _id: "q1", text: "Question", type: "single", points: 1, options: [{ _id: "o1", text: "Answer", isCorrect: true }] };
    const serialized = publicQuestion(q);
    expect(serialized.options[0]).toEqual({ _id: "o1", text: "Answer" });
    expect(JSON.stringify(serialized)).not.toContain("isCorrect");
  });

  test("quiz validation rejects a single-answer question with multiple correct options", () => {
    const errors = validateQuizPayload({
      title: "Valid title", durationMinutes: 10,
      startAt: "2026-10-27T10:00:00.000Z", endAt: "2026-10-27T11:00:00.000Z",
      questions: [{ text: "Question", type: "single", points: 1, options: [{ text: "A", isCorrect: true }, { text: "B", isCorrect: true }] }]
    });
    expect(errors.some(e => e.includes("exactly one correct option"))).toBe(true);
  });
});
