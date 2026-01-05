import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from dotenv import load_dotenv

# ✅ Load .env from project root
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
load_dotenv(os.path.join(BASE_DIR, '.env'))

# ✅ Add project path to sys.path so imports like "app.models" work
sys.path.append(BASE_DIR)

# ✅ Import Base and all models
from app.database.session import Base
import app.models.user_model
import app.models.audit_trace_model
import app.models.forgot_password_model
import app.models.global_setting_model

# ✅ Alembic Config object
config = context.config

# ✅ Load DATABASE_URL from .env
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env file")

config.set_main_option("sqlalchemy.url", DATABASE_URL)

# ✅ Setup logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ✅ Set metadata for autogenerate
target_metadata = Base.metadata


# ==========================================================
#   Offline and Online Migration Modes
# ==========================================================
def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
