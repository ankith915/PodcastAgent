import asyncio
import base64
import logging

from fastapi import APIRouter, HTTPException

from backend.config import LANGUAGE_CONFIG
from backend.models import ConvertRequest, ConvertResponse
from backend.services.pipeline import convert_blog_to_podcast

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/api/convert", response_model=ConvertResponse)
async def convert(request: ConvertRequest):
    try:
        # sync pipeline takes 30-60s, keep it off the event loop.
        summary, audio_bytes = await asyncio.to_thread(
            convert_blog_to_podcast, str(request.url), request.language, request.api_keys
        )
    except Exception:
        logger.exception("Blog-to-podcast conversion failed")
        raise HTTPException(
            status_code=502, detail="Conversion failed. Please try again later."
        ) from None

    audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
    return ConvertResponse(
        audio_base64=audio_base64,
        summary=summary,
        language=request.language,
    )


@router.get("/api/health")
async def health():
    return {"status": "ok"}


@router.get("/api/languages")
async def languages():
    return [
        {"code": code, "label": info["label"]}
        for code, info in LANGUAGE_CONFIG.items()
    ]
