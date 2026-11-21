from pydantic import BaseModel, Field, HttpUrl, field_validator

from backend.config import LANGUAGE_CONFIG


class ApiKeys(BaseModel):
    openai: str = Field(min_length=1)
    elevenlabs: str = Field(min_length=1)
    firecrawl: str = Field(min_length=1)


class ConvertRequest(BaseModel):
    url: HttpUrl
    language: str
    api_keys: ApiKeys

    @field_validator("language")
    @classmethod
    def language_must_be_supported(cls, value: str) -> str:
        if value not in LANGUAGE_CONFIG:
            supported = ", ".join(sorted(LANGUAGE_CONFIG))
            raise ValueError(f"unsupported language '{value}'; supported: {supported}")
        return value


class ConvertResponse(BaseModel):
    audio_base64: str
    summary: str
    language: str
