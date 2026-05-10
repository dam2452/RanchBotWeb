from datetime import (
    datetime,
    timedelta,
    timezone,
)

from app.core.config import settings
from app.models.user import UserSession
from jose import (
    JWTError,
    jwt,
)

_ALGORITHM = "HS256"


def encode_session(user_session: UserSession, max_age: int) -> str:
    expire = datetime.now(tz=timezone.utc) + timedelta(seconds=max_age)
    payload = {
        "user_id": user_session.user_id,
        "username": user_session.username,
        "jwt_token": user_session.jwt_token,
        "exp": expire,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=_ALGORITHM)


def decode_session(token: str) -> UserSession | None:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[_ALGORITHM])
        return UserSession(
            user_id=payload["user_id"],
            username=payload["username"],
            jwt_token=payload["jwt_token"],
        )
    except (JWTError, KeyError):
        return None
