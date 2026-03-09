FROM python:3.11

WORKDIR /app

# Copy requirements first for caching
COPY requirements.txt .

# Upgrade pip
RUN python -m pip install --upgrade pip
RUN python -m pip install --no-cache-dir --use-deprecated=legacy-resolver -r requirements.txt

# Copy project files
COPY . .

# Start the API
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]