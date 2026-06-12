const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("student123", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@student.dev" },
    update: {},
    create: { email: "demo@student.dev", name: "Demo Student", passwordHash }
  });

  await prisma.problem.createMany({
    data: [
      {
        title: "Two Sum With Follow-up",
        topic: "Arrays",
        difficulty: "EASY",
        status: "SOLVED",
        prompt: "Return indices of two numbers that add up to a target. Explain hash-map tradeoffs.",
        solution: "Use a map from needed complement to index.",
        userId: user.id
      },
      {
        title: "Merge Intervals",
        topic: "Intervals",
        difficulty: "MEDIUM",
        status: "SOLVING",
        prompt: "Merge overlapping intervals and discuss sorting complexity.",
        userId: user.id
      },
      {
        title: "Design a Rate Limiter",
        topic: "System Design",
        difficulty: "HARD",
        status: "TODO",
        prompt: "Design a distributed API rate limiter with burst handling and observability.",
        userId: user.id
      }
    ],
    skipDuplicates: true
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
