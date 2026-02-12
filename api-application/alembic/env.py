from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

import os
import sys
from dotenv import load_dotenv

# -------------------------------------------------
# Alembic Config
# -------------------------------------------------
config = context.config

# -------------------------------------------------
# Setup logging
# -------------------------------------------------
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# -------------------------------------------------
# Add project root to sys.path
# -------------------------------------------------
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

# -------------------------------------------------
# Load .env
# -------------------------------------------------
load_dotenv(os.path.join(BASE_DIR, ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env")

config.set_main_option("sqlalchemy.url", DATABASE_URL)

# -------------------------------------------------
# Import Base and models
# -------------------------------------------------
from app.database.session import Base
from app.models import * #import all models


target_metadata = Base.metadata


# ==================================================
# Offline mode
# ==================================================
def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


# ==================================================
# Online mode
# ==================================================
def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()