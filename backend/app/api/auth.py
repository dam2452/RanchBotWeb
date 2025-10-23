from fastapi import APIRouter, HTTPException, Response, Depends, status, Form
from app.models.user import UserLogin, User, UserSession
from app.services.ranchbot_api import api_client
from app.core.sessions import session_store
from app.core.config import settings
from app.core.dependencies import get_current_user
import base64
import json

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/login")
async def login(
    response: Response,
    login: str = Form(...),
    password: str = Form(...)
):
    """Login user and create session"""
    try:
        print(f"Attempting login for user: {login}")
        # Authenticate with RanchBot API
        auth_response = await api_client.authenticate(login, password)
        print(f"Auth response: {auth_response}")

        if not auth_response or "access_token" not in auth_response:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

        token = auth_response["access_token"]

        # Decode JWT to get user info (simple base64 decode, not verification)
        try:
            jwt_parts = token.split('.')
            if len(jwt_parts) >= 2:
                payload = json.loads(base64.b64decode(jwt_parts[1] + '=='))
                user_id = payload.get('user_id', 0)
                username = payload.get('username', login)
            else:
                user_id = 0
                username = login
        except Exception:
            user_id = 0
            username = login

        # Create session
        user_session = UserSession(
            user_id=user_id,
            username=username,
            jwt_token=token
        )

        session_id = session_store.create_session(
            user_session,
            max_age=settings.session_max_age
        )

        # Set session cookie
        response.set_cookie(
            key="session_id",
            value=session_id,
            max_age=settings.session_max_age,
            httponly=True,
            samesite="lax"
        )

        return {
            "status": "success",
            "user": {
                "id": user_id,
                "username": username
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Login error: {e}")
        print(f"Traceback: {traceback.format_exc()}")

        error_msg = str(e)
        if "Rate limit" in error_msg or "Too many" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=error_msg
            )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )


@router.get("/logout")
async def logout(
    response: Response,
    user: UserSession = Depends(get_current_user)
):
    """Logout user and destroy session"""
    response.delete_cookie(key="session_id")
    return {"status": "success", "message": "Logged out"}


@router.post("/logout-all")
async def logout_all(
    login: str = Form(...),
    password: str = Form(...)
):
    """Logout from all sessions by revoking all refresh tokens"""
    try:
        result = await api_client.logout_all_sessions(login, password)
        return {
            "status": "success",
            "message": result.get("message", "Logged out from all sessions"),
            "revoked_count": result.get("revoked_count", 0)
        }
    except Exception as e:
        error_msg = str(e)
        if "401" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to logout from all sessions: {error_msg}"
        )


@router.get("/user")
async def get_user(user: UserSession = Depends(get_current_user)):
    """Get current user info"""
    return {
        "status": "success",
        "user": {
            "id": user.user_id,
            "username": user.username,
            "email": ""
        }
    }
