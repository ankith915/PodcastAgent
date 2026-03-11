# PodcastAgent

## Project Overview
A Chrome extension + FastAPI backend that converts blog posts into podcast audio. Users click the extension while browsing any blog, select a language, and get AI-generated audio. Supports 9 languages.

## Tech Stack
- **Language:** Python 3.10, JavaScript (Chrome Extension)
- **Backend:** FastAPI + Uvicorn
- **AI Agent Framework:** Agno
- **LLM:** OpenAI GPT-4o
- **Web Scraping:** Firecrawl
- **Text-to-Speech:** ElevenLabs (multilingual v2 model, voice ID: JBFqnCBsd6RMkjVDRZzb)
- **Extension:** Chrome Manifest V3 with Side Panel API
- **Legacy UI:** Streamlit (kept as fallback in `blog_to_podcast_agent.py`)

## Project Structure
```
PodcastAgent/
├── blog_to_podcast_agent.py       # Legacy Streamlit app (unchanged)
├── requirements.txt               # Python dependencies
├── backend/
│   ├── main.py                    # FastAPI app, CORS config
│   ├── config.py                  # Language-voice mapping (9 languages)
│   ├── models.py                  # Pydantic request/response schemas
│   ├── services/
│   │   ├── scraper.py             # Agno agent + Firecrawl scraping
│   │   ├── tts.py                 # ElevenLabs TTS generation
│   │   └── pipeline.py            # Orchestrates scrape → summarize → TTS
│   └── routes/
│       └── convert.py             # API endpoints: /api/convert, /api/health, /api/languages
├── extension/
│   ├── manifest.json              # Chrome Manifest V3
│   ├── background.js              # Service worker (opens side panel)
│   ├── sidepanel.html/css/js      # Side panel UI and logic
│   ├── options.html/js            # API key settings page
│   └── icons/                     # Extension icons
└── scripts/
    └── run_server.bat             # Starts backend on localhost:8000
```

## Architecture
```
Chrome Extension (Side Panel)  →  POST /api/convert  →  FastAPI (localhost:8000)
                                                            ├── Firecrawl API
                                                            ├── OpenAI GPT-4o
                                                            └── ElevenLabs TTS
```

## Supported Languages
English, Spanish, Hindi, Mandarin Chinese, Arabic, Tamil, Telugu, Kannada, Bengali

## Commands
```bash
# Install dependencies (using short path for Windows long path workaround)
pip install -r requirements.txt --target C:\pylibs

# Start the backend
PYTHONPATH=C:/pylibs python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000

# Or use the batch script
scripts\run_server.bat

# Legacy Streamlit app
PYTHONPATH=C:/pylibs python -m streamlit run blog_to_podcast_agent.py
```

## API Endpoints
- `POST /api/convert` — Convert blog URL to podcast audio (accepts url, language, api_keys)
- `GET /api/health` — Health check
- `GET /api/languages` — List supported languages

## Chrome Extension Setup
1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" → select the `extension/` folder
4. API keys are configured in the extension's options page

## Development Notes
- No test suite currently exists
- API keys stored in `chrome.storage.local`, passed to backend per-request
- `.env` file exists but is empty; do not commit secrets
- Packages installed to `C:\pylibs` due to Windows long path limitation (no admin)
- Remote: https://github.com/ankith915/PodcastAgent.git
