from langchain_core.messages import HumanMessage, SystemMessage
from app.agents.state import AgentState
from app.utils.parser import extract_json
from app.services.llm import get_llm
import logging

logger = logging.getLogger(__name__)


class TaskGeneratorNode:

    SYSTEM_PROMPT = (
        "Respond ONLY with a valid JSON array. "
        "No explanation, no markdown, no text outside the array."
    )

    PROMPT = """You are a patient coding mentor creating a simple, beginner-friendly weekly plan.

Project: {project_name} — {project_description}
GitHub repo (already exists — do NOT ask to create one): {repo_url}

Week {week_number}: {theme}
Goal (what the student can show/run by Friday): {goal}
Topics needed to reach the goal: {topics}
Deliverable (working feature to push): {deliverable}
Difficulty: {difficulty}
Previous week score: {previous_score} (below 0 = student is struggling, keep it simpler)
Already mastered (do not re-teach): {mastered}

YOUR JOB: Break the week's deliverable into 5 daily tasks (Monday–Friday) that progressively build toward it.
Think of it as assembling the feature piece by piece — each day the student has something small but working.

Day 1 → set up the file/folder structure for this week's feature inside the existing repo.
Day 2–4 → build the feature step by step (UI, logic, data, connections — whatever the deliverable needs).
Day 5 → finish, test manually, and push the completed deliverable to GitHub.

WRITING RULES — follow every rule strictly:
1. Write for a beginner who is doing this for the first time.
2. Title: 5–8 words, plain English (e.g. "Add the login form to homepage").
3. Description: 1 sentence — what the student builds today and why it moves the project forward.
4. Steps: exactly 4 steps. Each step = one specific action.
   - Start with a verb: Open, Create, Run, Write, Add, Update, Copy, Delete, Test.
   - Name the exact file, folder, command, or function (e.g. "Create src/components/LoginForm.jsx").
   - Never bundle two actions into one step.
   - No abstract words like "implement", "integrate", "configure", "set up" — replace with the actual action.
5. estimated_hours: 1 or 2 only.
6. Never mention creating a new GitHub repository.
7. All strings must be on a single line — no newlines inside any value.

Return ONLY this JSON array, nothing else:
[
  {{
    "day": 1,
    "title": "<5–8 word plain English title>",
    "description": "<1 sentence: what is built today and why it matters>",
    "steps": ["<verb + specific action>", "<verb + specific action>", "<verb + specific action>", "<verb + specific action>"],
    "submission": {{
      "github_folder": "<subfolder in repo>",
      "filename": "<exact filename>",
      "commit_message": "<feat/fix/chore: short message>"
    }},
    "estimated_hours": 1
  }}
]"""

    def __init__(self):
        self.llm = get_llm(max_tokens=1400)

    def run(self, state: AgentState) -> AgentState:
        roadmap = state.get("roadmap")
        if not roadmap:
            raise ValueError("TaskGeneratorNode: roadmap missing.")

        current_week = state.get("current_week", 1)
        weeks        = roadmap.get("weeks", [])
        if current_week > len(weeks):
            logger.warning("TaskGeneratorNode: current_week exceeds roadmap.")
            return state

        w      = weeks[current_week - 1]
        p      = state["project"]
        passed = [r["concept"] for r in state.get("quiz_results", []) if r.get("passed")]
        prev   = state.get("weekly_score")

        prompt = self.PROMPT.format(
            project_name=p.get("name", ""),
            project_description=p.get("description", ""),
            repo_url=state.get("repo_url", ""),
            week_number=w["week_number"],
            theme=w["theme"],
            goal=w["goal"],
            topics=", ".join(w["topics"]),
            deliverable=w["deliverable"],
            difficulty=w.get("difficulty", "medium"),
            previous_score=str(prev) if prev is not None else "N/A (first week)",
            mastered=", ".join(passed) if passed else "None",
        )
        logger.info(f"TaskGeneratorNode: generating tasks for week {current_week}")
        response = self.llm.invoke([
            SystemMessage(content=self.SYSTEM_PROMPT),
            HumanMessage(content=prompt),
        ])

        logger.debug(f"RAW TASK OUTPUT:\n{response.content[:1000]}")

        tasks = extract_json(response.content)

        # 🔥 Normalize output
        if isinstance(tasks, dict):
            if "tasks" in tasks:
                tasks = tasks["tasks"]
            elif "data" in tasks:
                tasks = tasks["data"]
            else:
                tasks = [tasks]

        if not isinstance(tasks, list):
            raise ValueError("TaskGeneratorNode: expected JSON array")

        if len(tasks) != 5:
            logger.warning(f"Expected 5 tasks, got {len(tasks)}")

        logger.info(f"TaskGeneratorNode: {len(tasks)} tasks generated")
        return {**state, "weekly_tasks": tasks}