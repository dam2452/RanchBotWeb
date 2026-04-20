from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class Clip(BaseModel):
    id: str
    name: str
    created_at: datetime
    duration: Optional[float] = None


class ClipCreate(BaseModel):
    name: str


class ClipOperationRequest(BaseModel):
    clip_name: str
