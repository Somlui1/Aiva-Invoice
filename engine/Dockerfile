# -----------------------------------------------------------------------------
# System A Invoice Matching Engine - Production Dockerfile
# -----------------------------------------------------------------------------
FROM python:3.11-slim AS runner

WORKDIR /engine

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/engine/src

# Install system dependencies (curl for healthchecks, MuPDF rendering libraries)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    libmupdf-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python runtime dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy engine configuration, schemas, demo sandbox dataset, and application source
COPY config ./config
COPY schemas ./schemas
COPY sandbox_data ./sandbox_data
COPY src ./src

# Create cache directory and non-root application user
RUN mkdir -p /engine/cache && \
    useradd -u 1001 appuser && \
    chown -R appuser:appuser /engine

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://127.0.0.1:8080/health/ready || exit 1

CMD ["python", "-m", "system_a.cli", "flow-serve", "--host", "0.0.0.0", "--port", "8080"]
