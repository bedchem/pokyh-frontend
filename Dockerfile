FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Build-time env vars (baked into the client bundle). NEXT_PUBLIC_* is frozen at
# build time, so the backend URL must be set here — and must be https:// to avoid
# Mixed Content when the app is served over HTTPS.
ARG NEXT_PUBLIC_API_KEY
ARG NEXT_PUBLIC_SITE_URL=https://pokyh.com
ARG NEXT_PUBLIC_DEBUG_API=false
ARG NEXT_PUBLIC_API_BACKEND_URL=https://api.pokyh.com
# Optional tuning, empty = the defaults in the code (see .env.example).
ARG NEXT_PUBLIC_SOURCE_URL
ARG NEXT_PUBLIC_FALLBACK_LOCALE
ARG NEXT_PUBLIC_SCROLL_TUNING
ARG NEXT_PUBLIC_WEEK_ROLLOVER
ARG NEXT_STALE_DYNAMIC
ARG NEXT_STALE_STATIC
ENV NEXT_PUBLIC_SOURCE_URL=$NEXT_PUBLIC_SOURCE_URL
ENV NEXT_PUBLIC_FALLBACK_LOCALE=$NEXT_PUBLIC_FALLBACK_LOCALE
ENV NEXT_PUBLIC_SCROLL_TUNING=$NEXT_PUBLIC_SCROLL_TUNING
ENV NEXT_PUBLIC_WEEK_ROLLOVER=$NEXT_PUBLIC_WEEK_ROLLOVER
ENV NEXT_STALE_DYNAMIC=$NEXT_STALE_DYNAMIC
ENV NEXT_STALE_STATIC=$NEXT_STALE_STATIC
ENV NEXT_PUBLIC_API_KEY=$NEXT_PUBLIC_API_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_DEBUG_API=$NEXT_PUBLIC_DEBUG_API
ENV NEXT_PUBLIC_API_BACKEND_URL=$NEXT_PUBLIC_API_BACKEND_URL

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3011
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
USER appuser
# Keep the standalone server on the same port published by docker-compose.yml.
CMD ["node", "server.js"]
