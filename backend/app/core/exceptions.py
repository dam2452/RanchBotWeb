class RanchBotAPIError(Exception):
    status_code: int = 500

    def __init__(self, detail: str, status_code: int | None = None) -> None:
        self.detail = detail
        if status_code is not None:
            self.status_code = status_code
        super().__init__(detail)


class RanchBotAuthError(RanchBotAPIError):
    status_code = 401


class RanchBotRateLimitError(RanchBotAPIError):
    status_code = 429


class RanchBotConflictError(RanchBotAPIError):
    status_code = 409


class RanchBotNotFoundError(RanchBotAPIError):
    status_code = 404
