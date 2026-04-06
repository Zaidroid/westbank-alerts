FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

# Copy static data files if they exist
COPY data/known_checkpoints.json ./data/known_checkpoints.json 2>/dev/null || true
COPY data/checkpoint_directory.json ./data/checkpoint_directory.json 2>/dev/null || true

# Create runtime directories (will be overridden by fly.io volume mount for /data)
RUN mkdir -p /data /data/session

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
