# AI Teacher Agent

A personalised AI-powered teaching platform that guides students from zero to a working project — concept by concept, week by week.

---

## What It Does

The system acts as a software engineering mentor. A student describes a project they want to build, and the agent:

1. **Auto-detects** what technologies the student is missing
2. **Teaches** each prerequisite concept with a quiz to verify understanding
3. **Analyses** the student's own project plan and finds gaps
4. **Generates** a week-by-week roadmap aligned to the student's timeline
5. **Assigns** 5 daily coding tasks per week, each with concrete steps and a GitHub submission target
6. **Verifies** GitHub commits to confirm the week's deliverable was pushed
7. **Quizzes** the student on what they actually built
8. **Scores** weekly performance and adjusts the next week's difficulty

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI |
| AI / LLM | LangChain (provider-agnostic — Groq, OpenAI, Ollama, HuggingFace) |
| Frontend | Next.js (React) |
| GitHub Integration | GitHub REST API |
| Session Store | In-memory (Redis-ready) |

---

## Project Structure

```
ai-teacher-agent/
├── backend/
│   └── app/
│       ├── main.py                  # FastAPI app, CORS, router registration
│       ├── config.py                # Environment variable loading
│       ├── agents/
│       │   ├── state.py             # AgentState TypedDict — single source of truth
│       │   ├── graph.py             # Node singletons + get_initial_state()
│       │   └── nodes/
│       │       ├── stack_identifier_node.py     # Auto-detects missing tech stack
│       │       ├── prerequisite_node.py         # Generates concepts to learn
│       │       ├── quiz_generator_node.py       # Per-concept MCQ quiz + grader
│       │       ├── analyzer_node.py             # Evaluates student's project plan
│       │       ├── roadmap_node.py              # Builds week-by-week roadmap
│       │       ├── task_generator_node.py       # Generates 5 daily tasks per week
│       │       ├── completion_check_node.py     # Verifies GitHub submissions
│       │       ├── task_quiz_generator_node.py  # Weekly quiz on what was built
│       │       └── evaluator_node.py            # Scores week, gives feedback
│       ├── api/
│       │   ├── store.py             # In-memory session store
│       │   └── routers/
│       │       ├── sessions.py      # POST /sessions/start, GET/DELETE /sessions/{id}
│       │       ├── prereq.py        # POST /prereq/{id}/submit
│       │       ├── planning.py      # POST /planning/{id}/approach
│       │       └── weekly.py        # Task gen, GitHub check, quiz, evaluation
│       ├── services/
│       │   └── llm.py              # get_llm() factory — swap provider via .env
│       └── utils/
│           └── parser.py           # Robust JSON extractor for LLM outputs
└── frontend/
    ├── app/
    │   ├── page.jsx                 # Setup form (project details, known stack, repo URL)
    │   └── project/page.jsx         # Full learning experience (5-phase state machine)
    ├── components/
    │   ├── TaskCard.jsx             # Daily task card with steps and submission info
    │   ├── Sidebar.jsx
    │   ├── RoadmapProgress.jsx
    │   └── ProgressAnimation.jsx
    └── lib/
        └── api.js                   # HTTP client for all backend endpoints
```

---

## Agent Pipeline

Each node receives the full `AgentState`, transforms one part of it, and returns the updated state. No node shares mutable globals.

```
Session Start
    └── StackIdentifierNode       → unknown_stack[]
    └── PrerequisiteNode          → prerequisites[]
    └── QuizGeneratorNode         → quiz_results[0]

Per Concept (loop)
    └── student submits answers
    └── grade_quiz()              → quiz_results[n].passed
    └── if passed → next concept, else → retry

Approach Phase
    └── student writes plan
    └── AnalyzerNode              → analysis {gaps, positives, focus_areas}
    └── RoadmapNode               → roadmap {weeks[], milestones[]}

Per Week (loop)
    └── TaskGeneratorNode         → weekly_tasks[5]
    └── student works + pushes to GitHub
    └── CompletionCheckNode       → completion_status, completion_reason
    └── TaskQuizGeneratorNode     → task_quiz_results[n]
    └── grade_quiz()              → score, passed
    └── EvaluatorNode             → weekly_score, feedback, project_complete
    └── if not complete → next week
```

---

## API Endpoints

### Sessions
| Method | Endpoint | Description |
|---|---|---|
| POST | `/sessions/start` | Start a new session (runs stack detection + prerequisite generation) |
| GET | `/sessions/{id}` | Get full session state |
| DELETE | `/sessions/{id}` | Delete session |

### Prerequisites
| Method | Endpoint | Description |
|---|---|---|
| POST | `/prereq/{id}/submit` | Submit quiz answers, advance to next concept |
| GET | `/prereq/{id}/status` | Get current concept index and progress |

### Planning
| Method | Endpoint | Description |
|---|---|---|
| POST | `/planning/{id}/approach` | Submit project plan, triggers analysis + roadmap generation |
| GET | `/planning/{id}/roadmap` | Get generated roadmap |
| GET | `/planning/{id}/analysis` | Get approach analysis (gaps, positives) |

### Weekly
| Method | Endpoint | Description |
|---|---|---|
| POST | `/weekly/{id}/start` | Generate 5 daily tasks for current week |
| POST | `/weekly/{id}/check` | Verify GitHub submission |
| POST | `/weekly/{id}/skip` | [Test] Skip GitHub check, mark week complete |
| POST | `/weekly/{id}/skip-to-dashboard` | [Test] Skip to evaluation directly |
| GET | `/weekly/{id}/quiz` | Generate weekly quiz |
| POST | `/weekly/{id}/quiz/submit` | Submit quiz, run evaluator |
| GET | `/weekly/{id}/tasks` | Get current week's tasks |
| GET | `/weekly/{id}/score` | Get latest weekly evaluation |

---

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- A free API key from [Groq](https://console.groq.com) (or OpenAI / HuggingFace / local Ollama)
- A GitHub Personal Access Token (for commit verification)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # fill in your keys
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                     # runs on http://localhost:3000
```

### Environment Variables

Create `backend/.env`:

```env
LLM_PROVIDER=groq               # groq | openai | ollama | huggingface

GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.3-70b-versatile

OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o

HF_API_KEY=your_key_here
HF_MODEL=mistralai/Mistral-7B-Instruct-v0.3

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

GITHUB_TOKEN=your_github_pat_here
```

---

## How the Student Flow Works

1. **Setup** — Enter project name, description, known tech stack, GitHub repo URL, and timeline (start/end date)
2. **Prerequisites** — The agent identifies what you are missing and teaches each concept. After each concept, a 5-question quiz must be passed to continue
3. **Approach** — Write your own plan for the project. The agent analyses it and generates a personalised roadmap
4. **Roadmap Review** — Review the week-by-week plan before starting
5. **Weekly Work** — Each week gives you 5 daily tasks. Complete them, push to GitHub, pass the weekly quiz, and the agent evaluates your week
6. **Score** — Each week is scored from 0 to 10 based on GitHub submission and quiz performance. The agent adjusts difficulty accordingly

---

## Scoring

| Scenario | Raw Score | Display (0-10) |
|---|---|---|
| Submitted + 5/5 quiz | +5 | 10 |
| Submitted + 3/5 quiz | +3 | 8 |
| Submitted + 0/5 quiz | 0 | 5 |
| Not submitted + good quiz | -2 | 3 |
| Not submitted + 0/5 quiz | -5 | 0 |

---

## LLM Provider Switching

Change one line in `.env` to switch providers — no code changes needed:

```env
LLM_PROVIDER=groq         # fast, free tier, recommended for development
LLM_PROVIDER=openai       # highest quality
LLM_PROVIDER=ollama       # fully local, no API costs
LLM_PROVIDER=huggingface
```

---

## Architecture Notes

- **State machine pattern** — all session data lives in a single `AgentState` TypedDict that flows through nodes. Each node returns `{**state, "field": new_value}` — immutable updates only.
- **No framework lock-in** — nodes follow the LangGraph design pattern but are called imperatively from FastAPI routes, making the HTTP request boundary the natural control point.
- **Robust JSON parsing** — `utils/parser.py` handles LLM output that has trailing commas, missing commas, unclosed brackets, or markdown fences. Optional LLM repair fallback for completely broken outputs.
- **Provider-agnostic LLM** — `services/llm.py` returns a LangChain `BaseChatModel`. All nodes call `get_llm()` — swap the model without touching node code.

---

## Known Limitations

- Session data is in-memory — restarts wipe all sessions (production: use Redis)
- GitHub completion check compares only the last 2 commits
- No authentication — any client with a session ID can access it
- Synchronous LLM calls block the server under high concurrency

---

## License

MIT
