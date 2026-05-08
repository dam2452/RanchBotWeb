from app.core.dependencies import (
    get_auth_service,
    get_current_user,
    get_proxy_service,
)
from app.models.user import UserSession
from app.services.auth_service import AuthService
from app.services.proxy_service import ProxyService
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


class RedeemKeyBody(BaseModel):
    key: str = Field(..., min_length=1, max_length=128)


class ChangePasswordBody(BaseModel):
    old_password: str = Field(..., min_length=8, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)


class ForgotPasswordBody(BaseModel):
    username: str = Field(..., min_length=1, max_length=64)


class ResetPasswordBody(BaseModel):
    username: str = Field(..., min_length=1, max_length=64)
    code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8, max_length=128)


@router.post("/login")
async def login(
    response: Response,
    login: str = Form(...),
    password: str = Form(...),
    auth_svc: AuthService = Depends(get_auth_service),
):
    return await auth_svc.login(login, password, response)


@router.post("/register")
async def register(
    data: RegisterBody,
    response: Response,
    auth_svc: AuthService = Depends(get_auth_service),
):
    return await auth_svc.register(data.username, data.password, data.full_name, response)


@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPasswordBody,
    auth_svc: AuthService = Depends(get_auth_service),
):
    return await auth_svc.forgot_password(data.username)


@router.post("/reset-password")
async def reset_password(
    data: ResetPasswordBody,
    auth_svc: AuthService = Depends(get_auth_service),
):
    return await auth_svc.reset_password(data.username, data.code, data.new_password)


@router.post("/link-telegram")
async def link_telegram(
    user: UserSession = Depends(get_current_user),
    auth_svc: AuthService = Depends(get_auth_service),
):
    return await auth_svc.link_telegram(user.jwt_token, user.username)


@router.post("/redeem-key")
async def redeem_key(
    data: RedeemKeyBody,
    user: UserSession = Depends(get_current_user),
    proxy_svc: ProxyService = Depends(get_proxy_service),
):
    return await proxy_svc.call_json("klucz", [data.key], user.jwt_token)


@router.post("/change-password")
async def change_password(
    data: ChangePasswordBody,
    user: UserSession = Depends(get_current_user),
    auth_svc: AuthService = Depends(get_auth_service),
):
    return await auth_svc.change_password(
        user.jwt_token, user.username, data.old_password, data.new_password,
    )


@router.get("/logout")
async def logout(
    response: Response,
    _: UserSession = Depends(get_current_user),
):
    response.delete_cookie(key="session_id")
    return {"status": "success", "message": "Logged out"}


@router.post("/logout-all")
async def logout_all(
    login: str = Form(...),
    password: str = Form(...),
    auth_svc: AuthService = Depends(get_auth_service),
):
    return await auth_svc.logout_all(login, password)


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
