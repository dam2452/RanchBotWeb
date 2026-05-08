class Endpoints:
    SEARCH = "sz"
    SEARCH_PHRASE = "szf"
    SEARCH_SEMANTIC_FRAMES = "sensklatki"
    SEARCH_WITH_FILTERS = "kf"
    VIDEO_BY_INDEX = "w"
    VIDEO_ADJUST = "ad"
    CLIP_SAVE = "z"
    CLIP_SAVE_BY_INDEX = "zn"
    CLIP_DELETE = "uk"
    CLIP_LIST = "mk"
    CLIP_SEND = "wys"
    FRAME = "klatka"
    FRAME_ALT = "frame"
    FRAME_SHORT = "kl"
    CLIP_THUMBNAIL = "kk"
    FILTERS = "f"
    SERIES = "serial"
    SEASONS = "p"
    EPISODES = "odcinki"
    OBJECTS = "obj"
    EMOTIONS = "e"
    KLUCZ = "klucz"
    SUBSCRIPTION = "sub"
    BATCH = "batch"

    AUTH_LOGIN = "/auth/login"
    AUTH_LOGOUT_ALL = "/auth/logout-all"
    AUTH_REGISTER = "/auth/register"
    AUTH_FORGOT_PASSWORD = "/auth/forgot-password"
    AUTH_RESET_PASSWORD = "/auth/reset-password"
    AUTH_LINK_TELEGRAM = "/auth/link-telegram"
    AUTH_ATTACH_CREDENTIALS = "/auth/attach-credentials"
    AUTH_CHANGE_PASSWORD = "/auth/change-password"

    ALLOWED: frozenset = frozenset({
        SEARCH, SEARCH_PHRASE, SEARCH_SEMANTIC_FRAMES, SEARCH_WITH_FILTERS,
        VIDEO_BY_INDEX, VIDEO_ADJUST, CLIP_SAVE, CLIP_SAVE_BY_INDEX,
        CLIP_DELETE, CLIP_LIST, CLIP_SEND, FRAME, FRAME_ALT, FRAME_SHORT,
        CLIP_THUMBNAIL, FILTERS, SERIES, SEASONS, EPISODES, OBJECTS, EMOTIONS,
        KLUCZ, SUBSCRIPTION, BATCH,
        AUTH_LOGIN, AUTH_LOGOUT_ALL, AUTH_REGISTER, AUTH_FORGOT_PASSWORD,
        AUTH_RESET_PASSWORD, AUTH_LINK_TELEGRAM, AUTH_ATTACH_CREDENTIALS,
        AUTH_CHANGE_PASSWORD,
    })
