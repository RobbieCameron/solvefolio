# Solvefolio: AI Interview Coach Portfolio

Solvefolio is a focused AI interview coach that turns coding solutions into recruiter-facing evidence. Students submit a solution, complexity analysis, and spoken explanation, then receive a scored coach report and proof card for their problem-solving portfolio.

## Features

- Email/password authentication with signed HTTP-only sessions
- Focused AI Interview Coach workflow
- Canonical interview problems such as Two Sum, Number of Islands, Course Schedule, LRU Cache, Clone Graph, and Merge Intervals
- Company-inspired tracks for Google, Meta, Amazon, and Palantir using recognizable public interview patterns
- Scored reports for correctness, complexity, communication, and edge-case coverage
- Recruiter-facing proof card generated from each coached solution
- Local JSON demo store for instant use without setup
- PostgreSQL-ready Prisma schema

## Tech Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Prisma + PostgreSQL schema
- JWT authentication
- API route integration

## Run Locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`.

The app works immediately in local demo mode using `data/local-db.json`. To use PostgreSQL, start a local PostgreSQL database, set `DATABASE_URL` in `.env`, then run:

```bash
npm run db:push
npm run db:seed
```

Demo seed credentials for the Prisma seed are:

- Email: `demo@student.dev`
- Password: `student123`

## Project Structure

- `src/app/page.tsx` - focused coach studio and proof-card interface
- `src/app/api` - authentication and workspace API endpoints
- `src/lib/store.ts` - local development persistence layer
- `src/lib/auth.ts` - JWT session helpers
- `src/lib/question-generator.ts` - topic-based prompt generation
- `src/lib/coach.ts` - scoring, canonical tracks, and coaching logic
- `prisma/schema.prisma` - PostgreSQL data model

## Resume Talking Points

- Designed and built a full-stack AI interview coach with authenticated per-user evidence
- Modeled Solvefolio entities across users, canonical problems, coach reports, and portfolio artifacts
- Implemented server-side API endpoints for stateful product workflows
- Repositioned the product around a single differentiated workflow: turning technical interview solutions into a visible proof portfolio
