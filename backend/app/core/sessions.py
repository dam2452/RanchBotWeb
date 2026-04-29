from datetime import (
    datetime,
    timedelta,
)
import secrets

from app.models.user import UserSession


class SessionStore:
    def __init__(self):
        self._sessions: dict[str, UserSession] = {}
        self._expiry: dict[str, datetime] = {}

    def create_session(self, user_session: UserSession, max_age: int = 86400) -> str:
        session_id = secrets.token_urlsafe(32)
        self._sessions[session_id] = user_session
        self._expiry[session_id] = datetime.now() + timedelta(seconds=max_age)
        return session_id

    def get_session(self, session_id: str) -> UserSession | None:
        if session_id not in self._sessions:
            return None
        if datetime.now() > self._expiry.get(session_id, datetime.now()):
            self.delete_session(session_id)
            return None
        return self._sessions[session_id]

    def delete_session(self, session_id: str) -> None:
        self._sessions.pop(session_id, None)
        self._expiry.pop(session_id, None)

    def cleanup_expired(self) -> None:
        now = datetime.now()
        expired = [sid for sid, expiry in self._expiry.items() if now > expiry]
        for sid in expired:
            self.delete_session(sid)


session_store = SessionStore()
