from pydantic import BaseModel


class User(BaseModel):
    id: int
    username: str
    email: str | None = None


class UserLogin(BaseModel):
    login: str
    password: str


class UserSession(BaseModel):
    user_id: int
    username: str
    jwt_token: str
