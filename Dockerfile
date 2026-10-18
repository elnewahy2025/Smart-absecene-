# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Build stage — compile the client bundle (dist/) and the server bundle (server.js)
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Render automatically translates service environment variables into Docker build
# arguments. Vite inlines every VITE_* value at build time, so each one must be
# declared here or it is baked in as empty.
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID
ARG VITE_FIREBASE_FIRESTORE_DATABASE_ID
ARG VITE_FIREBASE_OAUTH_CLIENT_ID
ARG VITE_FIREBASE_RECAPTCHA_SITE_KEY
ARG VITE_PLATFORM_OWNER_EMAIL
ARG VITE_PLATFORM_OWNER_EMAILS
ARG VITE_DEFAULT_TENANT_ID
ARG VITE_USE_FIREBASE_EMULATOR=false
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET \
    VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID \
    VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID \
    VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID \
    VITE_FIREBASE_FIRESTORE_DATABASE_ID=$VITE_FIREBASE_FIRESTORE_DATABASE_ID \
    VITE_FIREBASE_OAUTH_CLIENT_ID=$VITE_FIREBASE_OAUTH_CLIENT_ID \
    VITE_FIREBASE_RECAPTCHA_SITE_KEY=$VITE_FIREBASE_RECAPTCHA_SITE_KEY \
    VITE_PLATFORM_OWNER_EMAIL=$VITE_PLATFORM_OWNER_EMAIL \
    VITE_PLATFORM_OWNER_EMAILS=$VITE_PLATFORM_OWNER_EMAILS \
    VITE_DEFAULT_TENANT_ID=$VITE_DEFAULT_TENANT_ID \
    VITE_USE_FIREBASE_EMULATOR=$VITE_USE_FIREBASE_EMULATOR

RUN npm run build

# ---------------------------------------------------------------------------
# Runtime stage — Node + system Chromium (for PDF) + production dependencies
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium \
      ca-certificates \
      fonts-liberation \
      fonts-noto-core \
      fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/src/config ./src/config

RUN chown -R node:node /app
USER node

EXPOSE 5050
CMD ["node", "server.js"]
