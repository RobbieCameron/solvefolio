import { promises as fs } from "fs";
import path from "path";
import type {
  AppData,
  CompanyTrack,
  Difficulty,
  Flashcard,
  InterviewFeedback,
  MockInterview,
  Note,
  Problem,
  ProblemStatus,
  User
} from "./types";

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "local-db.json");

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

const starterData: AppData = {
  users: [],
  problems: [],
  notes: [],
  flashcards: [],
  feedback: [],
  mocks: []
};

async function readData(): Promise<AppData> {
  try {
    const raw = await fs.readFile(dataFile, "utf8");
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      users: parsed.users ?? [],
      problems: parsed.problems ?? [],
      notes: parsed.notes ?? [],
      flashcards: parsed.flashcards ?? [],
      feedback: parsed.feedback ?? [],
      mocks: parsed.mocks ?? []
    };
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(dataFile, JSON.stringify(starterData, null, 2));
    return structuredClone(starterData);
  }
}

async function writeData(data: AppData) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2));
}

export async function findUserByEmail(email: string) {
  const data = await readData();
  return data.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function findUserById(userId: string) {
  const data = await readData();
  return data.users.find((user) => user.id === userId) ?? null;
}

export async function createUser(input: Pick<User, "email" | "name" | "passwordHash">) {
  const data = await readData();
  if (data.users.some((user) => user.email.toLowerCase() === input.email.toLowerCase())) {
    throw new Error("Email already registered");
  }

  const user: User = { id: id(), createdAt: now(), ...input };
  data.users.push(user);
  seedWorkspace(data, user.id);
  await writeData(data);
  return user;
}

export async function getWorkspace(userId: string) {
  const data = await readData();
  return {
    problems: uniqueProblems(data.problems.filter((problem) => problem.userId === userId)),
    notes: data.notes.filter((note) => note.userId === userId),
    flashcards: data.flashcards.filter((flashcard) => flashcard.userId === userId),
    feedback: data.feedback.filter((item) => item.userId === userId),
    mocks: data.mocks.filter((mock) => mock.userId === userId)
  };
}

export async function upsertProblem(userId: string, input: Partial<Problem> & Pick<Problem, "title" | "topic" | "prompt">) {
  const data = await readData();
  const timestamp = now();
  const existing = input.id ? data.problems.find((problem) => problem.id === input.id && problem.userId === userId) : null;
  const duplicate = data.problems.find((problem) => problem.userId === userId && problemKey(problem) === problemKey(input));

  if (existing) {
    Object.assign(existing, input, { updatedAt: timestamp });
    await writeData(data);
    return existing;
  }

  if (duplicate) {
    return duplicate;
  }

  const problem: Problem = {
    id: id(),
    title: input.title,
    topic: input.topic,
    difficulty: (input.difficulty ?? "MEDIUM") as Difficulty,
    status: (input.status ?? "TODO") as ProblemStatus,
    prompt: input.prompt,
    solution: input.solution,
    solveTimeMinutes: input.solveTimeMinutes,
    company: input.company,
    createdAt: timestamp,
    updatedAt: timestamp,
    userId
  };
  data.problems.unshift(problem);
  await writeData(data);
  return problem;
}

export async function updateProblemStatus(userId: string, problemId: string, status: ProblemStatus) {
  const data = await readData();
  const problem = data.problems.find((item) => item.id === problemId && item.userId === userId);
  if (!problem) throw new Error("Problem not found");
  problem.status = status;
  problem.updatedAt = now();
  await writeData(data);
  return problem;
}

export async function createNote(userId: string, input: Pick<Note, "title" | "body" | "topic">) {
  const data = await readData();
  const timestamp = now();
  const note: Note = { id: id(), createdAt: timestamp, updatedAt: timestamp, userId, ...input };
  data.notes.unshift(note);
  await writeData(data);
  return note;
}

export async function createFlashcard(userId: string, input: Pick<Flashcard, "front" | "back" | "topic"> & Partial<Pick<Flashcard, "confidence">>) {
  const data = await readData();
  const timestamp = now();
  const flashcard: Flashcard = {
    id: id(),
    createdAt: timestamp,
    updatedAt: timestamp,
    userId,
    confidence: Math.min(5, Math.max(1, input.confidence ?? 2)),
    front: input.front,
    back: input.back,
    topic: input.topic
  };
  data.flashcards.unshift(flashcard);
  await writeData(data);
  return flashcard;
}

export async function createFeedback(userId: string, input: Omit<InterviewFeedback, "id" | "userId" | "createdAt">) {
  const data = await readData();
  const feedback: InterviewFeedback = { id: id(), userId, createdAt: now(), ...input };
  data.feedback.unshift(feedback);

  const problem = data.problems.find((item) => item.id === input.problemId && item.userId === userId);
  if (problem) {
    problem.solution = input.solution;
    problem.updatedAt = now();
  }

  await writeData(data);
  return feedback;
}

export async function createMockInterview(
  userId: string,
  input: Pick<MockInterview, "topic" | "question" | "followUps"> & Partial<Pick<MockInterview, "company">>
) {
  const data = await readData();
  const timestamp = now();
  const mock: MockInterview = {
    id: id(),
    userId,
    topic: input.topic,
    company: input.company,
    question: input.question,
    followUps: input.followUps,
    answers: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };
  data.mocks.unshift(mock);
  await writeData(data);
  return mock;
}

export async function completeMockInterview(userId: string, mockId: string, answers: string[], feedback: string, score: number) {
  const data = await readData();
  const mock = data.mocks.find((item) => item.id === mockId && item.userId === userId);
  if (!mock) throw new Error("Mock interview not found");
  mock.answers = answers;
  mock.feedback = feedback;
  mock.score = score;
  mock.updatedAt = now();
  await writeData(data);
  return mock;
}

export async function createDrillSet(userId: string, problems: Array<Omit<Problem, "id" | "createdAt" | "updatedAt" | "userId">>) {
  const data = await readData();
  const timestamp = now();
  const existingKeys = new Set(data.problems.filter((problem) => problem.userId === userId).map(problemKey));
  const created = problems
    .filter((problem) => {
      const key = problemKey(problem);
      if (existingKeys.has(key)) return false;
      existingKeys.add(key);
      return true;
    })
    .map((problem) => ({
      id: id(),
      createdAt: timestamp,
      updatedAt: timestamp,
      userId,
      ...problem
    }));
  data.problems.unshift(...created);
  await writeData(data);
  return created;
}

export async function dedupeProblems(userId: string) {
  const data = await readData();
  const before = data.problems.length;
  const seen = new Set<string>();
  data.problems = data.problems.filter((problem) => {
    if (problem.userId !== userId) return true;
    const key = problemKey(problem);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  await writeData(data);
  return before - data.problems.length;
}

function uniqueProblems(problems: Problem[]) {
  const seen = new Set<string>();
  return problems.filter((problem) => {
    const key = problemKey(problem);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function problemKey(problem: Pick<Problem, "title" | "topic" | "prompt"> & Partial<Pick<Problem, "company">>) {
  return [problem.title, problem.topic, problem.company ?? "", problem.prompt].join("|").toLowerCase().trim();
}

function seedWorkspace(data: AppData, userId: string) {
  const timestamp = now();
  data.problems.push(
    {
      id: id(),
      title: "Two Sum",
      topic: "Arrays",
      difficulty: "EASY",
      status: "TODO",
      prompt: "Given an array of integers and a target, return indices of the two numbers that add up to the target. Explain the hash map invariant, duplicate handling, and O(n) time complexity.",
      solution: "Track complements in a map while scanning once.",
      solveTimeMinutes: 18,
      createdAt: timestamp,
      updatedAt: timestamp,
      userId
    },
    {
      id: id(),
      title: "Merge Intervals",
      topic: "Intervals",
      difficulty: "MEDIUM",
      status: "TODO",
      prompt: "Given a list of intervals, merge all overlapping intervals. Explain sorting by start time, the merge invariant, and boundary cases such as touching intervals and empty input.",
      solveTimeMinutes: 34,
      createdAt: timestamp,
      updatedAt: timestamp,
      userId
    },
    {
      id: id(),
      title: "LRU Cache",
      topic: "Design",
      difficulty: "MEDIUM",
      status: "TODO",
      prompt: "Design a data structure supporting get and put in O(1). When capacity is exceeded, evict the least recently used key. Explain the hash map plus doubly linked list design and update rules.",
      company: "Amazon",
      createdAt: timestamp,
      updatedAt: timestamp,
      userId
    }
  );
  data.notes.push({
    id: id(),
    title: "Interview Story Bank",
    topic: "Behavioral",
    body: "Prepare concise STAR stories for conflict, ambiguity, ownership, and failure recovery.",
    createdAt: timestamp,
    updatedAt: timestamp,
    userId
  });
  data.flashcards.push({
    id: id(),
    front: "When do you use BFS instead of DFS?",
    back: "BFS is ideal for shortest paths in unweighted graphs and level-order exploration.",
    topic: "Graphs",
    confidence: 3,
    createdAt: timestamp,
    updatedAt: timestamp,
    userId
  });
}
