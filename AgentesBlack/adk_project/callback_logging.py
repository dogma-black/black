import logging
import google.cloud.logging

from google.adk.agents.callback_context import CallbackContext
from google.adk.models import LlmResponse, LlmRequest

# Create a single, reusable client instance.
cloud_logging_client = google.cloud.logging.Client()
cloud_logging_client.setup_logging()

def log_query_to_model(callback_context: CallbackContext, llm_request: LlmRequest):
    if llm_request.contents and llm_request.contents[-1].role == 'user':
         # Ensure the first part of the user's message has text before logging.
         if llm_request.contents[-1].parts and llm_request.contents[-1].parts[0].text:
            last_user_message = llm_request.contents[-1].parts[0].text
            logging.info(f"[query to {callback_context.agent_name}]: " + last_user_message)

def log_model_response(callback_context: CallbackContext, llm_response: LlmResponse):
    if llm_response.content and llm_response.content.parts:
        for part in llm_response.content.parts:
            if part.text:
                logging.info(f"[response from {callback_context.agent_name}]: " + part.text)
            elif part.function_call:
                # Log the function name and its arguments for better debugging.
                args_str = str(part.function_call.args)
                logging.info(f"[function call from {callback_context.agent_name}]: {part.function_call.name}({args_str})")
