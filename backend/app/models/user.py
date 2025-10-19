from pydantic import BaseModel, EmailStr
from typing import Optional


class User(BaseModel):
    id: int
    username: str
    email: Optional[str] = None


class UserLogin(BaseModel):
    login: str
    password: str


class UserSession(BaseModel):
    user_id: int
    username: str
    jwt_token: str
