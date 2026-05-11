from langchain_core.messages import HumanMessage, SystemMessage
from app.agents.state import AgentState
from app.utils.parser import extract_json
from app.services.llm import get_llm
import logging

logger = logging.getLogger(__name__)


class StackIdentifierNode:
    """
    Automatically identifies the technologies the student still needs to learn
    to build the project — based on the project description and their known stack.
    Runs once at session start, before PrerequisiteNode.
    """

    SYSTEM_PROMPT = (
        "Respond ONLY with a valid JSON object. "
        "No explanation, no markdown, no text outside the JSON."
    )

    PROMPT = """You are a senior software engineer reviewing a student project.

Project: {project_name}
Description: {project_description}
Student already knows: {known_stack}

Identify the technologies, frameworks, libraries, and concepts that:
1. Are genuinely required to build this project end-to-end.
2. The student does NOT already know (not listed in their known stack).

Rules:
- Return 3–6 items only — the most essential missing pieces.
- Be specific (e.g. "Express.js" not "backend framework", "JWT authentication" not "auth").
- Do not include anything already in the student's known stack.
- All strings on a single line.

Return ONLY this JSON:
{{
  "unknown_stack": ["<technology>", "<technology>", "<technology>"]
}}"""

    def __init__(self):
        self.llm = get_llm(max_tokens=300)

    def run(self, state: AgentState) -> AgentState:
        project = state["project"]
        known   = state.get("known_stack", [])

        prompt = self.PROMPT.format(
            project_name=project.get("name", ""),
            project_description=project.get("description", ""),
            known_stack=", ".join(known) if known else "None",
        )

        logger.info("StackIdentifierNode: identifying unknown stack")
        response = self.llm.invoke([
            SystemMessage(content=self.SYSTEM_PROMPT),
            HumanMessage(content=prompt),
        ])

        result       = extract_json(response.content)
        unknown_stack = result.get("unknown_stack", [])

        if not isinstance(unknown_stack, list):
            unknown_stack = []

        logger.info(f"StackIdentifierNode: identified → {unknown_stack}")
        return {**state, "unknown_stack": unknown_stack}
