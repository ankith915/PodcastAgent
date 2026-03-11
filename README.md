# Blog to Podcast - Chrome Extension

> Convert any blog post into a podcast episode with one click. Powered by AI.

A Chrome extension with a FastAPI backend that scrapes blog content, generates a conversational summary using GPT-4o, and converts it to natural-sounding audio using ElevenLabs. Supports **9 languages** including English, Hindi, Tamil, Telugu, Kannada, Bengali, Spanish, Mandarin Chinese, and Arabic.

---

## Demo

1. Browse to any blog post
2. Click the extension icon — side panel opens
3. Select your language
4. Click **"Convert to Podcast"**
5. Listen or download the MP3

---

## Architecture

```
┌─────────────────────────┐
│   Chrome Extension      │
│   (Side Panel UI)       │
│                         │
│  - Auto-detects blog URL│
│  - Language selector    │
│  - Audio player         │
│  - Download MP3         │
└───────────┬─────────────┘
            │ POST /api/convert
            ▼
┌─────────────────────────┐
│   FastAPI Backend       │
│   (localhost:8000)      │
│                         │
│  ┌───────────────────┐  │
│  │ Firecrawl API     │  │  ← Scrapes blog content
│  └───────┬───────────┘  │
│          ▼              │
│  ┌───────────────────┐  │
│  │ OpenAI GPT-4o     │  │  ← Summarizes in target language
│  └───────┬───────────┘  │
│          ▼              │
│  ┌───────────────────┐  │
│  │ ElevenLabs TTS    │  │  ← Generates natural speech audio
│  └───────────────────┘  │
└─────────────────────────┘
```

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Python 3.10, FastAPI, Uvicorn |
| AI Agent | Agno Framework |
| LLM | OpenAI GPT-4o |
| Web Scraping | Firecrawl |
| Text-to-Speech | ElevenLabs (Multilingual v2) |
| Extension | Chrome Manifest V3, Side Panel API |
| Frontend | Vanilla HTML/CSS/JS |

---

## Supported Languages

| Language | Code |
|----------|------|
| English | en |
| Spanish | es |
| Hindi | hi |
| Mandarin Chinese | zh |
| Arabic | ar |
| Tamil | ta |
| Telugu | te |
| Kannada | kn |
| Bengali | bn |

---

## Prerequisites

### 1. Python 3.10+

Download from [python.org](https://www.python.org/downloads/)

### 2. API Keys (all free tiers available)

#### OpenAI API Key
1. Go to [platform.openai.com](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to **API Keys** → **Create new secret key**
4. Copy and save the key

#### ElevenLabs API Key
1. Go to [elevenlabs.io](https://elevenlabs.io/)
2. Sign up for a free account
3. Click your profile icon → **Profile + API key**
4. Copy the API key

#### Firecrawl API Key
1. Go to [firecrawl.dev](https://www.firecrawl.dev/)
2. Sign up for a free account
3. Go to **Dashboard** → **API Keys**
4. Create and copy a new key

### 3. Google Chrome
Required for the extension. Any recent version works.

---

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/ankith915/PodcastAgent.git
cd PodcastAgent
```

### Step 2: Install Python Dependencies

```bash
pip install -r requirements.txt
```

> **Windows Long Path Issue?** If you get an error about long file paths, run:
> ```bash
> pip install -r requirements.txt --target C:\pylibs
> ```
> Then set `PYTHONPATH=C:\pylibs` before running the server.

### Step 3: Start the Backend Server

```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Or on Windows, use the convenience script:
```bash
scripts\run_server.bat
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

Verify it works:
```bash
curl http://127.0.0.1:8000/api/health
# → {"status":"ok"}
```

### Step 4: Load the Chrome Extension

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select the `extension/` folder from this project
5. The extension icon should appear in your toolbar

### Step 5: Configure API Keys

1. Click the extension icon to open the side panel
2. Click the **gear icon** (top-right) to open Settings
3. Enter your **OpenAI**, **ElevenLabs**, and **Firecrawl** API keys
4. Click **Save**
5. Click **Test Connection** to verify the backend is reachable

---

## Usage

1. Make sure the backend server is running (`python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000`)
2. Navigate to any blog post in Chrome
3. Click the **Blog to Podcast** extension icon — the side panel opens
4. The blog URL is auto-detected
5. Select your desired **language** from the dropdown
6. Click **"Convert to Podcast"**
7. Wait for processing (typically 30-60 seconds)
8. **Listen** using the built-in audio player or **download** the MP3

---

## Project Structure

```
PodcastAgent/
├── backend/
│   ├── main.py                  # FastAPI app with CORS
│   ├── config.py                # Language-voice mapping
│   ├── models.py                # Pydantic request/response schemas
│   ├── services/
│   │   ├── scraper.py           # Blog scraping + AI summarization
│   │   ├── tts.py               # Text-to-speech generation
│   │   └── pipeline.py          # Orchestrates the full pipeline
│   └── routes/
│       └── convert.py           # API endpoints
│
├── extension/
│   ├── manifest.json            # Chrome Manifest V3
│   ├── background.js            # Service worker
│   ├── sidepanel.html/css/js    # Side panel UI
│   ├── options.html/js          # API key settings
│   └── icons/                   # Extension icons
│
├── scripts/
│   └── run_server.bat           # Windows startup script
│
├── blog_to_podcast_agent.py     # Legacy Streamlit app
├── requirements.txt             # Python dependencies
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/languages` | List supported languages |
| `POST` | `/api/convert` | Convert blog URL to podcast audio |

### POST /api/convert

**Request:**
```json
{
  "url": "https://blog.example.com/post",
  "language": "en",
  "api_keys": {
    "openai": "sk-...",
    "elevenlabs": "...",
    "firecrawl": "fc-..."
  }
}
```

**Response:**
```json
{
  "audio_base64": "<base64-encoded MP3>",
  "summary": "The blog discusses...",
  "language": "en"
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend status shows red | Make sure the server is running on port 8000 |
| "API keys not configured" | Open Settings (gear icon) and enter all 3 keys |
| URL not auto-detected | Reload the extension at `chrome://extensions` |
| Windows long path error | Use `pip install -r requirements.txt --target C:\pylibs` |
| Conversion takes too long | Some blogs are very long — try a shorter post |
| Audio sounds wrong language | Make sure you selected the correct language before converting |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

## Acknowledgments

- [Agno](https://github.com/agno-agi/agno) — AI agent framework
- [OpenAI](https://openai.com/) — GPT-4o language model
- [ElevenLabs](https://elevenlabs.io/) — Text-to-speech API
- [Firecrawl](https://www.firecrawl.dev/) — Web scraping API
- Original concept inspired by [awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps)
