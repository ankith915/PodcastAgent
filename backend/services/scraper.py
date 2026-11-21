from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.firecrawl import FirecrawlTools

from backend.config import LANGUAGE_CONFIG


def scrape_and_summarize(url: str, language: str, openai_key: str, firecrawl_key: str) -> str:
    """Scrape a blog URL and return a conversational summary in the target language."""
    lang_label = LANGUAGE_CONFIG.get(language, {}).get("label", "English")

    # per-request keys: pass them to the clients, not process env —
    # concurrent requests would swap each other's keys.
    agent = Agent(
        name="Blog Summarizer",
        model=OpenAIChat(id="gpt-4o", api_key=openai_key),
        tools=[FirecrawlTools(api_key=firecrawl_key)],
        instructions=[
            f"Scrape the blog URL and create a concise, engaging summary (max 2000 characters) suitable for a podcast.",
            f"Write the summary in {lang_label}.",
            "The summary should be conversational and capture the main points.",
        ],
    )

    response = agent.run(f"Scrape and summarize this blog for a podcast: {url}")
    summary = response.content if hasattr(response, "content") else str(response)
    return summary
