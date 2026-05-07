from app.core.dependencies import get_current_user
from app.models.user import UserSession
from app.services.auth_service import auth_service
from fastapi import (
    APIRouter,
    Depends,
    Form,
    Response,
)
from pydantic import (
    BaseModel,
    Field,
)

router = APIRouter(prefix="/auth", tags=["authentication"])


class RegisterBody(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str | None = None


class ForgotPasswordBody(BaseModel):
    username: str = Field(..., min_length=1, max_length=64)


class ResetPasswordBody(BaseModel):
    username: str = Field(..., min_length=1, max_length=64)
    code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8, max_length=128)


@router.post("/login")
async def login(response: Response, login: str = Form(...), password: str = Form(...)):
    return await auth_service.login(login, password, response)


@router.post("/register")
async def register(data: RegisterBody, response: Response):
    return await auth_service.register(data.username, data.password, data.full_name, response)


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordBody):
    return await auth_service.forgot_password(data.username)


@router.post("/reset-password")
async def reset_password(data: ResetPasswordBody):
    return await auth_service.reset_password(data.username, data.code, data.new_password)


@router.post("/link-telegram")
async def link_telegram(user: UserSession = Depends(get_current_user)):
    return await auth_service.link_telegram(user.jwt_token, user.username)


@router.get("/logout")
async def logout(response: Response, _: UserSession = Depends(get_current_user)):
    response.delete_cookie(key="session_id")
    return {"status": "success", "message": "Logged out"}


@router.post("/logout-all")
async def logout_all(login: str = Form(...), password: str = Form(...)):
    return await auth_service.logout_all(login, password)


@router.get("/user")
async def get_user(user: UserSession = Depends(get_current_user)):
    return {
        "status": "success",
        "user": {
            "id": user.user_id,
            "username": user.username,
            "email": "",
            "telegram_linked": user.user_id > 0,
        },
    }
