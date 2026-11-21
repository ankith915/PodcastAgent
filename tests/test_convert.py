"""Tests for /api/convert. The pipeline is mocked, so no real API calls."""

import base64
import threading
import time

from fastapi.testclient import TestClient

from backend.main import app
from backend.models import ApiKeys

client = TestClient(app)

VALID_PAYLOAD = {
    "url": "https://example.com/some-blog-post",
    "language": "en",
    "api_keys": {"openai": "sk-test", "elevenlabs": "el-test", "firecrawl": "fc-test"},
}


def test_health():
    assert client.get("/api/health").json() == {"status": "ok"}


def test_languages_lists_all_supported():
    codes = {item["code"] for item in client.get("/api/languages").json()}
    assert codes == {"en", "es", "hi", "zh", "ar", "ta", "te", "kn", "bn"}


def test_convert_rejects_invalid_url():
    payload = {**VALID_PAYLOAD, "url": "not-a-url"}
    assert client.post("/api/convert", json=payload).status_code == 422


def test_convert_rejects_unsupported_language():
    payload = {**VALID_PAYLOAD, "language": "xx"}
    response = client.post("/api/convert", json=payload)
    assert response.status_code == 422


def test_convert_rejects_empty_api_key():
    payload = {**VALID_PAYLOAD, "api_keys": {**VALID_PAYLOAD["api_keys"], "openai": ""}}
    assert client.post("/api/convert", json=payload).status_code == 422


def test_convert_success(monkeypatch):
    def fake_pipeline(url, language, api_keys):
        assert url == VALID_PAYLOAD["url"]
        assert language == "en"
        assert isinstance(api_keys, ApiKeys)
        return "A short summary.", b"fake-mp3-bytes"

    monkeypatch.setattr("backend.routes.convert.convert_blog_to_podcast", fake_pipeline)
    response = client.post("/api/convert", json=VALID_PAYLOAD)
    assert response.status_code == 200
    body = response.json()
    assert body["summary"] == "A short summary."
    assert body["language"] == "en"
    assert base64.b64decode(body["audio_base64"]) == b"fake-mp3-bytes"


def test_convert_failure_returns_generic_502(monkeypatch):
    def failing_pipeline(url, language, api_keys):
        raise RuntimeError("ElevenLabs exploded with secret details")

    monkeypatch.setattr("backend.routes.convert.convert_blog_to_podcast", failing_pipeline)
    response = client.post("/api/convert", json=VALID_PAYLOAD)
    assert response.status_code == 502
    assert "ElevenLabs exploded" not in response.text
    assert response.json()["detail"] == "Conversion failed. Please try again later."


def test_convert_does_not_block_health_endpoint(monkeypatch):
    """A slow conversion shouldn't stall other requests."""
    started = threading.Event()

    def slow_pipeline(url, language, api_keys):
        started.set()
        time.sleep(3)
        return "summary", b"audio"

    monkeypatch.setattr("backend.routes.convert.convert_blog_to_podcast", slow_pipeline)

    result = {}

    def do_convert():
        result["response"] = client.post("/api/convert", json=VALID_PAYLOAD)

    thread = threading.Thread(target=do_convert)
    thread.start()
    assert started.wait(timeout=5)

    start = time.monotonic()
    health = client.get("/api/health")
    elapsed = time.monotonic() - start
    assert health.status_code == 200
    assert elapsed < 1.5, f"health check took {elapsed:.2f}s while a conversion ran"

    thread.join(timeout=10)
    assert result["response"].status_code == 200
