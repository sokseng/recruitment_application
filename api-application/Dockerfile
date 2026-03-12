##FROM python:3.11

##WORKDIR /app

# Copy requirements first for caching
##COPY requirements.txt .

# Upgrade pip
##RUN python -m pip install --upgrade pip
##RUN python -m pip install --no-cache-dir --use-deprecated=legacy-resolver -r requirements.txt

# Copy project files
##COPY . .

# Start the API
##CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies required by many packages
# RUN apt-get update && apt-get install -y \
#     build-essential \
#     gcc \
#     libffi-dev \
#     libssl-dev \
#     libcairo2-dev \
#     libpango1.0-dev \
#     libjpeg-dev \
#     libxml2-dev \
#     libxslt1-dev \
#     zlib1g-dev \
#     curl \
#     git \
#     && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["gunicorn","app.main:app","-k","uvicorn.workers.UvicornWorker","-w","1","--bind","0.0.0.0:8000"]
