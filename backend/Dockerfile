FROM python:3.13-alpine AS builder

WORKDIR /app

RUN apk add --no-cache \
    gcc \
    musl-dev \
    libjpeg-turbo-dev \
    libpng-dev \
    libwebp-dev \
    zlib-dev

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.13-alpine

WORKDIR /app

RUN apk add --no-cache \
    ffmpeg \
    libjpeg-turbo \
    libpng \
    libwebp

COPY --from=builder /install /usr/local

COPY . .

RUN mkdir -p /tmp/thumbnails

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
