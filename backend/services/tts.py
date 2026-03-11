from elevenlabs import ElevenLabs

from backend.config import LANGUAGE_CONFIG, TTS_MODEL


def generate_audio(text: str, language: str, elevenlabs_key: str) -> bytes:
    """Convert text to speech using ElevenLabs and return raw audio bytes."""
    voice_id = LANGUAGE_CONFIG.get(language, {}).get("voice_id", "JBFqnCBsd6RMkjVDRZzb")

    client = ElevenLabs(api_key=elevenlabs_key)

    audio_generator = client.text_to_speech.convert(
        text=text,
        voice_id=voice_id,
        model_id=TTS_MODEL,
    )

    audio_chunks = []
    for chunk in audio_generator:
        if chunk:
            audio_chunks.append(chunk)
    return b"".join(audio_chunks)
