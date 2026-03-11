import base64

from fastapi import APIRouter, HTTPException

from backend.config import LANGUAGE_CONFIG
from backend.models import ConvertRequest, ConvertResponse
from backend.services.pipeline import convert_blog_to_podcast

router = APIRouter()


@router.post("/api/convert", response_model=ConvertResponse)
async def convert(request: ConvertRequest):
    try:
        summary, audio_bytes = convert_blog_to_podcast(
            request.url, request.language, request.api_keys
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

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
