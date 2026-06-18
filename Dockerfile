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
ENV NEXT_PUBLIC_API_KEY=$NEXT_PUBLIC_API_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_DEBUG_API=$NEXT_PUBLIC_DEBUG_API
ENV NEXT_PUBLIC_API_BACKEND_URL=$NEXT_PUBLIC_API_BACKEND_URL

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Standalone server.js reads these env vars to pick host/port
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
USER appuser
EXPOSE 3001
CMD ["node", "server.js"]
