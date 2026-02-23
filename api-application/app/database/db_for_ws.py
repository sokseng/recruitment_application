from contextlib import contextmanager
from app.database.session import SessionLocal

@contextmanager
def get_db_ws():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()