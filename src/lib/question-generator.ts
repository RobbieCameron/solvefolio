import type { Difficulty } from "./types";

const patterns: Record<string, string[]> = {
  arrays: ["prefix sums", "two pointers", "hash maps", "sliding windows"],
  graphs: ["BFS", "DFS", "topological ordering", "shortest paths"],
  dp: ["state design", "memoization", "tabulation", "space optimization"],
  system: ["capacity planning", "consistency", "caching", "observability"],
  sql: ["joins", "aggregation", "window functions", "index usage"]
};

export async function generateQuestion(topic: string, difficulty: Difficulty) {
  const normalized = topic.trim().toLowerCase();
  const pool = Object.entries(patterns).find(([key]) => normalized.includes(key))?.[1] ?? [
    "constraints",
    "tradeoffs",
    "edge cases",
    "complexity analysis"
  ];
  const concept = pool[Math.floor(Math.random() * pool.length)];
  const title = `${topic} ${difficulty === "HARD" ? "Deep Dive" : difficulty === "MEDIUM" ? "Skill Rep" : "Warm-up"}`;

  return {
    title,
    topic,
    difficulty,
    prompt:
      `Solve a ${difficulty.toLowerCase()} interview problem about ${topic}. ` +
      `Your answer should use ${concept}, explain the core invariant, handle edge cases, and include time and space complexity.`,
    solution:
      "Start by clarifying inputs and constraints, choose the simplest data structure that preserves the invariant, then test against a small counterexample before coding."
  };
}
