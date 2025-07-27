import asyncio
from google.adk import Agent
from google.adk.runners import InMemoryRunner
from google.adk.tools import AgentTool
from google.adk.sessions import Session
from google.genai import types

import os
from dotenv import load_dotenv

import sys
sys.path.append(".")
# Import the centralized client and callbacks
from callback_logging import (
    cloud_logging_client, log_query_to_model, log_model_response
)
from llm_auditor.agent import llm_auditor

# 1. Load environment variables from the agent directory's .env file
load_dotenv()
google_genai_use_vertexai = os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "1")
model_name = os.getenv("MODEL")

# Conditionally validate required environment variables for a more robust startup.
missing_vars = []
if not model_name:
    missing_vars.append("MODEL")

if google_genai_use_vertexai.lower() in ("true", "1", "yes"):
    if not os.getenv("GOOGLE_CLOUD_PROJECT"):
        missing_vars.append("GOOGLE_CLOUD_PROJECT")
    if not os.getenv("GOOGLE_CLOUD_LOCATION"):
        missing_vars.append("GOOGLE_CLOUD_LOCATION")

if missing_vars:
    raise ValueError(
        f"Missing required environment variables: {', '.join(missing_vars)}. "
        "Please export them or add them to a .env file before running the script."
    )

# 5. Prepare a function to package a user's message as
# genai.types.Content, run it asynchronously, and iterate
# through the response
async def run_prompt(
    runner: InMemoryRunner, session: Session, user_id: str, new_message: str
):
    content = types.Content(
        role="user", parts=[types.Part.from_text(text=new_message)]
    )
    print(f"** user: {new_message}")
    async for event in runner.run_async(
        user_id=user_id,
        session_id=session.id,
        new_message=content,
    ):
        if not event.content.parts:
            continue
        # An event can have multiple parts (e.g., text and tool output)
        for part in event.content.parts:
            if part.text:
                print(f"** {event.author}: {part.text}")
            elif part.tool_code and part.tool_code.outputs:
                print(f"** tool output ({event.author}): {part.tool_code.outputs}")

# Create an async main function
async def main():

    # 2. Set or load other variables
    app_name = 'my_agent_app'
    user_id_1 = 'user1'

    # 3. Define Your Agent
    root_agent = Agent(
        # This agent will now act as an orchestrator that uses the
        # llm_auditor as a specialized, fact-checking tool.
        model=model_name,
        name="fact_checking_assistant",
        instruction=(
            "You are a fact-checking assistant. To answer the user's query, "
            "you MUST call the 'llm_auditor' tool. Pass the user's exact "
            "query to the 'llm_auditor' tool."
        ),
        before_model_callback=log_query_to_model,
        after_model_callback=log_model_response,
        tools=[AgentTool(agent=llm_auditor)],
    )

    # 3. Create a Runner
    runner = InMemoryRunner(
        agent=root_agent,
        app_name=app_name,
    )

    # 4. Create a session
    my_session = await runner.session_service.create_session(
        app_name=app_name, user_id=user_id_1
    )

    # 6. Get the query from the command line, or use a default.
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
    else:
        print("Usage: python3 app_agent/agent.py <your question here>")
        query = "What is the capital of France?"

    await run_prompt(runner, my_session, user_id_1, query)

    # 7. Close the logging client at the end of the application
    cloud_logging_client.close()

if __name__ == "__main__":
    asyncio.run(main())