FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_EXTRA_INDEX_URL="https://download.pytorch.org/whl/cpu"

WORKDIR /app

RUN apt-get update && \
  apt-get install -y --no-install-recommends ffmpeg libsndfile1 ca-certificates && \
  rm -rf /var/lib/apt/lists/*

COPY services/voice/web_agent/requirements.txt ./requirements.txt
RUN pip install -r requirements.txt

COPY services/voice/web_agent/backend ./backend

EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
