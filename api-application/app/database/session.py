from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config.settings import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_size=20,       # default 5, increase to suit load
    max_overflow=20,    # default 10, how many extra temporary connections
    pool_timeout=60,    # default 30, seconds to wait for a connection
    pool_pre_ping=True
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()
