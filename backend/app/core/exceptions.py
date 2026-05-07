class RanchBotAPIError(Exception):
    status_code: int = 500

    def __init__(self, detail: str) -> None:
        self.detail = detail
        super().__init__(detail)


class RanchBotAuthError(RanchBotAPIError):
    status_code = 401


class RanchBotRateLimitError(RanchBotAPIError):
    status_code = 429


class RanchBotConflictError(RanchBotAPIError):
    status_code = 409


class RanchBotNotFoundError(RanchBotAPIError):
    status_code = 404
