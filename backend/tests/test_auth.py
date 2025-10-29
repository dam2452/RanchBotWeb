import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from app.main import app


client = TestClient(app)


@pytest.mark.asyncio
async def test_login_success():
    """Test successful login"""
    mock_auth_response = {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6InRlc3R1c2VyIn0.test"
    }

    with patch('app.services.ranchbot_api.api_client.authenticate', new_callable=AsyncMock) as mock_auth:
        mock_auth.return_value = mock_auth_response

        response = client.post(
            "/auth/login",
            data={"login": "testuser", "password": "testpass"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "user" in data
        assert "session_id" in response.cookies


@pytest.mark.asyncio
async def test_login_with_rate_limit_auto_recovery():
    """Test login with rate limit triggers auto-logout and retry"""
    mock_auth_response = {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6InRlc3R1c2VyIn0.test"
    }

    with patch('app.services.ranchbot_api.api_client.authenticate', new_callable=AsyncMock) as mock_auth, \
         patch('app.services.ranchbot_api.api_client.logout_all_sessions', new_callable=AsyncMock) as mock_logout:

        mock_auth.side_effect = [
            Exception("Rate limit: Too many active refresh tokens. Please log out from other sessions."),
            mock_auth_response
        ]
        mock_logout.return_value = {"message": "Logged out from all sessions", "revoked_count": 5}

        response = client.post(
            "/auth/login",
            data={"login": "testuser", "password": "testpass"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert mock_logout.called
        assert mock_auth.call_count == 2


@pytest.mark.asyncio
async def test_login_invalid_credentials():
    """Test login with invalid credentials"""
    with patch('app.services.ranchbot_api.api_client.authenticate', new_callable=AsyncMock) as mock_auth:
        mock_auth.return_value = None

        response = client.post(
            "/auth/login",
            data={"login": "testuser", "password": "wrongpass"}
        )

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data


@pytest.mark.asyncio
async def test_logout_all_sessions():
    """Test logout from all sessions"""
    mock_logout_response = {
        "message": "Logged out from all sessions",
        "revoked_count": 5
    }

    with patch('app.services.ranchbot_api.api_client.logout_all_sessions', new_callable=AsyncMock) as mock_logout:
        mock_logout.return_value = mock_logout_response

        response = client.post(
            "/auth/logout-all",
            data={"login": "testuser", "password": "testpass"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["revoked_count"] == 5


@pytest.mark.asyncio
async def test_get_user_authenticated():
    """Test getting current user info when authenticated"""
    with patch('app.core.dependencies.get_current_user') as mock_get_user:
        from app.models.user import UserSession
        mock_user = UserSession(user_id=1, username="testuser", jwt_token="test_token")
        mock_get_user.return_value = mock_user

        response = client.get("/auth/user")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["user"]["username"] == "testuser"
