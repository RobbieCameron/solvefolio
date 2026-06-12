import type { CompanyTrack, Difficulty, InterviewFeedback, Problem } from "./types";

const companyPatterns: Record<CompanyTrack, Array<{ topic: string; difficulty: Difficulty; title: string; prompt: string }>> = {
  Google: [
    {
      topic: "Graphs",
      difficulty: "MEDIUM",
      title: "Number of Islands",
      prompt: "Given an m x n grid of '1' land and '0' water, count the number of islands. An island is connected horizontally or vertically. Explain DFS/BFS traversal, visited marking, and the O(mn) time bound."
    },
    {
      topic: "Graphs",
      difficulty: "MEDIUM",
      title: "Course Schedule",
      prompt: "Given numCourses and prerequisite pairs, determine whether all courses can be finished. Model courses as a directed graph and explain either cycle detection with DFS colors or Kahn's topological sort."
    },
    {
      topic: "Graphs",
      difficulty: "HARD",
      title: "Word Ladder",
      prompt: "Given beginWord, endWord, and a dictionary, return the length of the shortest transformation sequence. Each step changes one character and must be a valid word. Explain BFS, neighbor generation, and why BFS gives shortest path."
    }
  ],
  Meta: [
    {
      topic: "Stack",
      difficulty: "EASY",
      title: "Valid Parentheses",
      prompt: "Given a string containing parentheses, brackets, and braces, determine whether it is valid. Explain stack matching, early failures, and edge cases such as empty input and leftover openings."
    },
    {
      topic: "Graphs",
      difficulty: "MEDIUM",
      title: "Clone Graph",
      prompt: "Given a reference to a node in a connected undirected graph, return a deep copy. Explain how a hash map prevents duplicate clones and how DFS or BFS handles cycles."
    },
    {
      topic: "Trees",
      difficulty: "MEDIUM",
      title: "Binary Tree Right Side View",
      prompt: "Given a binary tree, return the values visible from the right side. Explain level-order traversal or DFS by depth, and justify why one value per depth is recorded."
    }
  ],
  Amazon: [
    {
      topic: "Design",
      difficulty: "MEDIUM",
      title: "LRU Cache",
      prompt: "Design a data structure supporting get and put in O(1). When capacity is exceeded, evict the least recently used key. Explain the hash map plus doubly linked list design and update rules."
    },
    {
      topic: "Heaps",
      difficulty: "MEDIUM",
      title: "Top K Frequent Elements",
      prompt: "Given an integer array and k, return the k most frequent elements. Compare heap, bucket sort, and quickselect approaches, including time and space tradeoffs."
    },
    {
      topic: "Arrays",
      difficulty: "MEDIUM",
      title: "Kth Largest Element in an Array",
      prompt: "Given an unsorted array, return the kth largest element. Explain min-heap and quickselect options, expected versus worst-case complexity, and duplicate handling."
    }
  ],
  Palantir: [
    {
      topic: "Intervals",
      difficulty: "MEDIUM",
      title: "Merge Intervals",
      prompt: "Given a list of intervals, merge all overlapping intervals. Explain sorting by start time, the merge invariant, and boundary cases such as touching intervals and empty input."
    },
    {
      topic: "Union Find",
      difficulty: "MEDIUM",
      title: "Accounts Merge",
      prompt: "Given account names and email lists, merge accounts that share an email. Explain graph connected components or union-find, then return sorted merged email groups."
    },
    {
      topic: "Design",
      difficulty: "HARD",
      title: "Design In-Memory File System",
      prompt: "Design ls, mkdir, addContentToFile, and readContentFromFile. Explain trie-like directory nodes, file content storage, path parsing, and command complexity."
    }
  ]
};

export function gradeInterviewAnswer(input: { problem: Problem; solution: string; complexity: string; explanation: string }) {
  const solution = input.solution.toLowerCase();
  const complexity = input.complexity.toLowerCase();
  const explanation = input.explanation.toLowerCase();
  const combined = `${solution} ${complexity} ${explanation}`;

  const correctness = scoreFromSignals(combined, ["hash", "map", "sort", "bfs", "dfs", "dp", "invariant", "edge", "return"], 62);
  const timeComplexity = scoreFromSignals(complexity, ["o(", "time", "space", "n", "log", "constant"], 56);
  const communication = scoreFromSignals(explanation, ["because", "first", "then", "tradeoff", "example", "constraint"], 58);
  const edgeCases = scoreFromSignals(combined, ["empty", "duplicate", "negative", "single", "overflow", "cycle", "disconnected"], 48);
  const score = Math.round(correctness * 0.35 + timeComplexity * 0.22 + communication * 0.23 + edgeCases * 0.2);
  const missingEdgeCases = [
    !combined.includes("empty") && "Empty or single-item input",
    !combined.includes("duplicate") && "Duplicate values or repeated states",
    input.problem.topic.toLowerCase().includes("graph") && !combined.includes("cycle") && "Cycles or disconnected components"
  ].filter(Boolean) as string[];
  const evidenceStrengths = buildEvidenceStrengths(input.problem, combined, complexity, explanation);
  const evidenceGaps = buildEvidenceGaps(input.problem, combined, complexity, explanation, missingEdgeCases);

  return {
    correctness,
    timeComplexity,
    communication,
    edgeCases,
    score,
    missingEdgeCases,
    evidenceStrengths,
    evidenceGaps,
    scoreBand: scoreBand(score),
    percentileLabel: percentileLabel(score),
    summary:
      score >= 82
        ? "Strong interview answer. Tighten the edge-case pass and you can present this confidently."
        : score >= 68
          ? "Good base answer. Add clearer invariants, complexity proof, and more edge-case coverage."
          : "This needs another pass. Focus on the core invariant, test cases, and a crisp complexity explanation."
  };
}

export function detectWeaknesses(problems: Problem[]) {
  const grouped = new Map<string, { total: number; solved: number }>();
  problems.forEach((problem) => {
    const item = grouped.get(problem.topic) ?? { total: 0, solved: 0 };
    item.total += 1;
    if (problem.status === "SOLVED") item.solved += 1;
    grouped.set(problem.topic, item);
  });

  return Array.from(grouped.entries())
    .map(([topic, item]) => ({ topic, total: item.total, solved: item.solved, percent: Math.round((item.solved / item.total) * 100) }))
    .filter((item) => item.total >= 1 && item.percent < 60)
    .sort((a, b) => a.percent - b.percent);
}

export function buildWeaknessDrills(topic: string) {
  const normalized = topic.toLowerCase();
  const graph = normalized.includes("graph");
  const dp = normalized.includes("dp");
  const base = graph ? ["BFS layers", "DFS cycle check", "Connected components", "Shortest unweighted path", "Topological ordering"] : dp ? ["Memoized recurrence", "Bottom-up table", "State transition audit", "Space compression", "Path reconstruction"] : ["Core invariant", "Boundary case", "Complexity proof", "Follow-up variation", "Timed implementation"];

  return base.map((label, index) => ({
    title: `${topic} Repair Drill ${index + 1}: ${label}`,
    topic,
    difficulty: index > 2 ? "HARD" as Difficulty : "MEDIUM" as Difficulty,
    status: "TODO" as const,
    prompt: `Complete a focused ${topic} drill on ${label}. Explain the invariant, walk through one edge case, and state time and space complexity.`
  }));
}

export function buildCompanyTrack(company: CompanyTrack) {
  return companyPatterns[company].map((item) => ({
    ...item,
    company,
    status: "TODO" as const
  }));
}

export function startMockInterview(topic: string, company?: CompanyTrack) {
  const prefix = company ? `${company} style` : "Technical";
  return {
    topic,
    company,
    question: `${prefix}: solve a ${topic} problem where constraints force you to justify the data structure, complexity, and failure modes.`,
    followUps: [
      "What edge case would break the first version of your solution?",
      "Can you improve the time or space complexity?",
      "How would you explain the invariant to an interviewer?",
      "What test case would you write first?"
    ]
  };
}

export function finishMockInterview(answers: string[]) {
  const text = answers.join(" ").toLowerCase();
  const score = scoreFromSignals(text, ["complexity", "edge", "because", "test", "invariant", "optimize", "tradeoff"], 52);
  const feedback =
    score >= 80
      ? "Strong mock. You explained tradeoffs and handled follow-ups with structure."
      : score >= 65
        ? "Solid mock. Add a sharper first test, clearer complexity proof, and one alternative approach."
        : "Repeat this mock. Your answer needs more structure around constraints, edge cases, and complexity.";
  return { score, feedback };
}

export function analytics(problems: Problem[], feedback: InterviewFeedback[]) {
  const solved = problems.filter((problem) => problem.status === "SOLVED");
  const mastered = new Set(detectMasteredTopics(problems));
  const avgSolveTime = Math.round(solved.reduce((sum, problem) => sum + (problem.solveTimeMinutes ?? 32), 0) / Math.max(1, solved.length));
  const recentScore = feedback[0]?.score ?? 68;
  const readiness = Math.min(96, Math.round((solved.length / Math.max(1, problems.length)) * 55 + mastered.size * 8 + recentScore * 0.25));
  return {
    currentStreak: Math.max(1, Math.min(12, solved.length + feedback.length)),
    avgSolveTime,
    topicsMastered: mastered.size,
    readiness
  };
}

function detectMasteredTopics(problems: Problem[]) {
  const grouped = new Map<string, { total: number; solved: number }>();
  problems.forEach((problem) => {
    const item = grouped.get(problem.topic) ?? { total: 0, solved: 0 };
    item.total += 1;
    if (problem.status === "SOLVED") item.solved += 1;
    grouped.set(problem.topic, item);
  });
  return Array.from(grouped.entries()).filter(([, item]) => item.total >= 1 && item.solved / item.total >= 0.8).map(([topic]) => topic);
}

function scoreFromSignals(text: string, signals: string[], floor: number) {
  const hits = signals.filter((signal) => text.includes(signal)).length;
  return Math.min(98, floor + hits * 7 + Math.min(12, Math.floor(text.length / 120)));
}

function buildEvidenceStrengths(problem: Problem, combined: string, complexity: string, explanation: string) {
  const topic = problem.topic.toLowerCase();
  const strengths: string[] = [];

  if (topic.includes("stack") || problem.title.toLowerCase().includes("parentheses")) {
    if (combined.includes("stack")) strengths.push("Correctly identified stack as the optimal structure.");
    if (combined.includes("leftover") || combined.includes("opening")) strengths.push("Discussed leftover opening bracket validation.");
  }
  if (topic.includes("array") || topic.includes("heap")) {
    if (combined.includes("hash") || combined.includes("heap") || combined.includes("quickselect")) strengths.push("Selected a data structure aligned with the target complexity.");
    if (combined.includes("duplicate")) strengths.push("Considered duplicate values instead of assuming unique inputs.");
  }
  if (topic.includes("graph") || topic.includes("union")) {
    if (combined.includes("bfs") || combined.includes("dfs") || combined.includes("union")) strengths.push("Used traversal or union structure appropriate for connected components.");
    if (combined.includes("cycle") || combined.includes("visited")) strengths.push("Accounted for revisits, cycles, or visited-state management.");
  }
  if (topic.includes("design")) {
    if (combined.includes("hash") || combined.includes("map")) strengths.push("Explained constant-time lookup with a keyed index.");
    if (combined.includes("list") || combined.includes("node")) strengths.push("Connected state updates to an explicit node/list structure.");
  }
  if (complexity.includes("o(")) strengths.push("Provided formal Big-O complexity.");
  if (explanation.includes("because") || explanation.includes("invariant")) strengths.push("Explained reasoning instead of only describing code steps.");

  return uniqueList(strengths).slice(0, 4);
}

function buildEvidenceGaps(problem: Problem, combined: string, complexity: string, explanation: string, missingEdgeCases: string[]) {
  const gaps: string[] = [];
  if (!combined.includes("invariant")) gaps.push("Did not formally define the core invariant.");
  if (!complexity.includes("space")) gaps.push("Space complexity needs a clearer justification.");
  if (!explanation.includes("example") && !explanation.includes("walk")) gaps.push("Could include a concrete walkthrough to make the explanation easier to inspect.");
  gaps.push(...missingEdgeCases.map((item) => `Limited coverage: ${item}.`));
  if (problem.difficulty === "HARD" && !combined.includes("tradeoff")) gaps.push("Hard problem answer should discuss tradeoffs or alternative approaches.");
  return uniqueList(gaps).slice(0, 4);
}

function uniqueList(items: string[]) {
  return Array.from(new Set(items));
}

function scoreBand(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Promising";
  if (score >= 60) return "Developing";
  return "Needs work";
}

function percentileLabel(score: number) {
  if (score >= 90) return "Top 10% signal";
  if (score >= 80) return "Top 20% signal";
  if (score >= 70) return "Top 35% signal";
  if (score >= 60) return "Practice-ready";
  return "Early attempt";
}
