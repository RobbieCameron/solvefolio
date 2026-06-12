export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type ProblemStatus = "TODO" | "SOLVING" | "SOLVED";

export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
};

export type Problem = {
  id: string;
  title: string;
  topic: string;
  difficulty: Difficulty;
  status: ProblemStatus;
  prompt: string;
  solution?: string;
  solveTimeMinutes?: number;
  company?: CompanyTrack;
  createdAt: string;
  updatedAt: string;
  userId: string;
};

export type CompanyTrack = "Google" | "Meta" | "Amazon" | "Palantir";

export type InterviewFeedback = {
  id: string;
  problemId: string;
  userId: string;
  solution: string;
  complexity: string;
  explanation: string;
  correctness: number;
  timeComplexity: number;
  communication: number;
  edgeCases: number;
  score: number;
  summary: string;
  missingEdgeCases: string[];
  createdAt: string;
};

export type MockInterview = {
  id: string;
  userId: string;
  topic: string;
  company?: CompanyTrack;
  question: string;
  followUps: string[];
  answers: string[];
  feedback?: string;
  score?: number;
  createdAt: string;
  updatedAt: string;
};

export type Note = {
  id: string;
  title: string;
  body: string;
  topic: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
};

export type Flashcard = {
  id: string;
  front: string;
  back: string;
  topic: string;
  confidence: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
};

export type AppData = {
  users: User[];
  problems: Problem[];
  notes: Note[];
  flashcards: Flashcard[];
  feedback: InterviewFeedback[];
  mocks: MockInterview[];
};
