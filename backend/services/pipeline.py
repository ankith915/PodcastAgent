from backend.models import ApiKeys
from backend.services.scraper import scrape_and_summarize
from backend.services.tts import generate_audio


def convert_blog_to_podcast(url: str, language: str, api_keys: ApiKeys) -> tuple[str, bytes]:
    """Run the full blog-to-podcast pipeline: scrape, summarize, then generate audio."""
    summary = scrape_and_summarize(url, language, api_keys.openai, api_keys.firecrawl)
    audio_bytes = generate_audio(summary, language, api_keys.elevenlabs)
    return summary, audio_bytes
