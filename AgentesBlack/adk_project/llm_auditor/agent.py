# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""LLM Auditor for verifying & refining LLM-generated answers using the web."""

from google.adk.agents import SequentialAgent

import sys
sys.path.append("..")
# Ensure logging is configured by importing the centralized client.
from callback_logging import cloud_logging_client
from .sub_agents.critic import critic_agent
from .sub_agents.reviser import reviser_agent

llm_auditor = SequentialAgent(
    name='llm_auditor',
    description=(
        'Use this tool to verify and correct a factual statement. '
        'Input should be a single statement or a question-answer pair to be fact-checked. '
        'The tool will evaluate the statement, use the web to verify its accuracy, '
        'and return a corrected version if necessary.'
    ),
    sub_agents=[critic_agent, reviser_agent],
)

# Expose the llm_auditor as the root_agent for the ADK framework to discover.
root_agent = llm_auditor
