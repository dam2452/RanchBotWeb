from datetime import datetime

from pydantic import BaseModel


class Clip(BaseModel):
    id: str
    name: str
    created_at: datetime
    duration: float | None = None


class ClipCreate(BaseModel):
    name: str


class ClipOperationRequest(BaseModel):
    clip_name: str
