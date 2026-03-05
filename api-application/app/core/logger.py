import logging
import os
from logging.handlers import RotatingFileHandler
from app.config.settings import settings

# Get log directory from settings
LOG_DIR = settings.LOG_DIR

# Create folder if not exists
os.makedirs(LOG_DIR, exist_ok=True)

log_file = os.path.join(LOG_DIR, "error.log")

handler = RotatingFileHandler(
    log_file,
    maxBytes=10 * 1024 * 1024,  # 10MB
    backupCount=10
)

formatter = logging.Formatter(
    "%(asctime)s --> %(levelname)s --> %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
)

handler.setFormatter(formatter)

logger = logging.getLogger("app_logger")
logger.setLevel(logging.ERROR)
logger.addHandler(handler)