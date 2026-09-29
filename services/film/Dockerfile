# VOLO / odyssee film backend (Node + FFmpeg)
FROM node:20-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm config set registry https://mirrors.cloud.tencent.com/npm/ \
    && npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=3000
ENV UPLOAD_DIR=/data/uploads

RUN mkdir -p /data/uploads

EXPOSE 3000

CMD ["node", "server.js"]
