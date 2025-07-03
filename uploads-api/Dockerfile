FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache \
    ffmpeg \
    vips-dev \
    build-base \
    python3 \
    make \
    g++

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p /app/uploads/videos /app/uploads/photos /app/uploads/thumbnails

EXPOSE 3001

CMD ["node", "server.js"]

