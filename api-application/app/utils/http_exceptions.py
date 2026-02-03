from fastapi import HTTPException

def http_error(status_code: int, code: str, message: str):
    """
    Standard HTTP error response helper
    """
    raise HTTPException(
        status_code=status_code,
        detail={
            "code": code,
            "message": message
        }
    )


def bad_request(code: str, message: str):
    http_error(400, code, message)


def not_found(code: str, message: str):
    http_error(404, code, message)


def unauthorized(code: str, message: str):
    http_error(401, code, message)


def forbidden(code: str, message: str):
    http_error(403, code, message)
