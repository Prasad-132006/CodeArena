# CodeArena — AI-Powered Online Judge & Coding Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16+-black.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D.svg?logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-Sandboxed-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **CodeArena** is a production-minded competitive programming and learning platform featuring an isolated Docker C++ judge and an original AI coding coach that explains submission failures using **actual compiler diagnostics and test execution evidence**.

---

## 1. Architecture & Monorepo Structure

CodeArena is organized as a modular monorepo:

```text
CodeArena/
├── .env.example                 # Example environment variables template
├── .gitignore                   # Comprehensive gitignore for Python, Node, Docker
├── docker-compose.yml           # Local development orchestration (Postgres, Redis, API, Web)
├── README.md                    # Project documentation & Windows launch guide
│
├── backend/                     # FastAPI Modular Monolith Backend
│   ├── Dockerfile               # Container definition for API server
│   ├── requirements.txt         # Pinned Python dependencies
│   ├── alembic.ini              # Database migration configuration
│   ├── app/
│   │   ├── main.py              # Application entrypoint & CORS middleware
│   │   ├── core/
│   │   │   ├── config.py        # Pydantic BaseSettings & env parsing
│   │   │   ├── database.py      # SQLAlchemy 2.x async session & engine
│   │   │   └── redis.py         # Async Redis client & pooling
│   │   ├── api/v1/
│   │   │   ├── router.py        # Central API v1 router
│   │   │   └── endpoints/
│   │   │       └── health.py    # Deep diagnostic check (API, DB, Redis)
│   │   ├── models/
│   │   │   └── base.py          # UUID primary keys & UTC timestamp mixins
│   │   └── schemas/
│   │       └── health.py        # Validated Pydantic models for status diagnostics
│   ├── migrations/              # Alembic database migrations
│   └── tests/
│       └── test_health.py       # Pytest unit & health verification tests
│
├── frontend/                    # Next.js 16 App Router Client
│   ├── Dockerfile               # Container definition for frontend
│   ├── package.json             # React 19, TypeScript, Tailwind CSS, Lucide
│   ├── tsconfig.json            # Strict TypeScript configuration
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx       # Root layout with dark theme & typography
│   │   │   ├── globals.css      # Design tokens (charcoal/slate, electric blue accents)
│   │   │   └── page.tsx         # Responsive landing page & live diagnostic dashboard
│   │   ├── components/
│   │   │   ├── Navbar.tsx       # Navigation header, status badge, theme toggle
│   │   │   └── HealthStatusWidget.tsx # Live ping & service latency monitor
│   │   ├── lib/
│   │   │   └── api.ts           # Type-safe API client helper
│   │   └── types/
│   │       └── index.ts         # Shared TypeScript interfaces
│   └── public/                  # Static assets
│
└── judge/                       # [Phase 3] Isolated C++ Sandbox Engine
    └── Dockerfile.judge         # Disposable non-root g++ execution container
```

---

## 2. Prerequisites (Windows 10/11)

Ensure the following tools are installed on your machine:
- **Docker Desktop** (with WSL2 backend enabled)
- **Node.js** 20.x or 22.x+ (`node --version`)
- **Python** 3.12+ (`python --version`)
- **Git** (`git --version`)

---

## 3. Windows PowerShell Launch Guide

Open a **PowerShell** terminal in the project root: `C:\Users\Shweta\Desktop\Prasad\Projects\CodeArena`

### Step 1: Initialize Environment File

```powershell
Copy-Item .env.example .env
```

### Step 2: Choose Execution Mode

#### Mode A: Full Docker Compose (Recommended)
Launch PostgreSQL, Redis, FastAPI backend, and Next.js frontend in isolated containers with a single command:

```powershell
docker compose up -d postgres redis
docker compose run --rm backend alembic upgrade head
docker compose up --build
```

The backend refreshes the seeded problem content, including starter code, whenever it starts. Restart the backend after changing a seeded problem template, then reload the problem page.

- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Documentation**: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- **Health Diagnostic Endpoint**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

To stop the containers:
```powershell
docker compose down
```

---

#### Mode B: Local Hybrid Development (Faster Hot-Reloading)

**Terminal 1 — Start PostgreSQL & Redis via Docker:**
```powershell
docker compose up -d postgres redis
```

**Terminal 2 — Start FastAPI Backend:**
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 3 — Start Next.js Frontend:**
```powershell
cd frontend
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the dashboard.

---

## 4. Verification & Testing

### Test Backend Endpoints
From PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/health" | ConvertTo-Json -Depth 4
```

Expected Response:
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "environment": "development",
  "timestamp": "2026-10-10T14:00:00Z",
  "services": {
    "api": {
      "status": "healthy",
      "response_time_ms": 0.1,
      "details": "CodeArena API is operating normally"
    },
    "database": {
      "status": "healthy",
      "response_time_ms": 2.4,
      "details": "PostgreSQL connection verified (codearena_db)"
    },
    "redis": {
      "status": "healthy",
      "response_time_ms": 1.1,
      "details": "Redis broker responsive"
    }
  }
}
```

### Run Backend Pytest Suite
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest tests/ -v
```

### Build & Validate Frontend
```powershell
cd frontend
npm run build
```

---

## 5. Judge System

Phase 3 now provides durable submissions, Redis-backed asynchronous judging, and a separate Docker worker. The worker uses a disposable non-root C++20 runner with resource limits. See [JUDGE.md](JUDGE.md) for API, setup, verdict and security details. Docker is a useful isolation layer, not a complete boundary for public multi-user execution; the trusted worker has Docker socket access and a stronger sandbox such as gVisor or Firecracker is recommended before public deployment.

---

## 6. Phased Implementation Roadmap

- [x] **Phase 1: Foundation & Monorepo**
  - Monorepo structure, Next.js, FastAPI, PostgreSQL, Redis, Docker Compose, Health endpoint, design tokens.
- [x] **Phase 2: Authentication & Problem Library**
  - JWT auth (Argon2id + HttpOnly cookie/Bearer), user management & profiles, problem schema, tags, evaluation test cases (sample & hidden), Monaco Editor workspace, problem browsing UI.
- [x] **Phase 3: Docker C++ Judge Engine & Worker**
<<<<<<< HEAD
  - Redis RQ job worker, isolated container runner, async verdict processing, submission history.
=======
  - Redis queue worker, isolated container runner, async verdict processing, submission history.
>>>>>>> 7bfa846 (added new coding lanaguages in ide and added new fontes with facility of adjusting font size)
- [ ] **Phase 4: Deterministic Diagnostics & AI Coding Coach**
  - Compiler error parsing, output diff engine, 4-level progressive hints, zero-cost fallback.
- [ ] **Phase 5: User Analytics & Topic Recommendations**
  - Recharts dashboard, weak-area detection algorithm, bookmarking, detailed submission viewer.
- [ ] **Phase 6: E2E Playwright Tests, Security Hardening & Deployment**
  - Automated tests, rate limits, production docker configurations, documentation.
