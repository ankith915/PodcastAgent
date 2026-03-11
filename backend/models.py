from pydantic import BaseModel


class ApiKeys(BaseModel):
    openai: str
    elevenlabs: str
    firecrawl: str


class ConvertRequest(BaseModel):
    url: str
    language: str
    api_keys: ApiKeys


class ConvertResponse(BaseModel):
    audio_base64: str
    summary: str
    language: str
