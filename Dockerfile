# ── Build: the static export (out/) ───────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Build-time env vars (baked into the pages and the client bundle). NEXT_PUBLIC_*
# is frozen at build time, so the backend URL must be set here — and must be
# https:// to avoid Mixed Content when the site is served over HTTPS.
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
# Web Push: the public half of the backend's VAPID pair. Empty: no Web Push,
# the service worker only checks for messages while it runs.
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_SOURCE_URL=$NEXT_PUBLIC_SOURCE_URL
ENV NEXT_PUBLIC_FALLBACK_LOCALE=$NEXT_PUBLIC_FALLBACK_LOCALE
ENV NEXT_PUBLIC_SCROLL_TUNING=$NEXT_PUBLIC_SCROLL_TUNING
ENV NEXT_PUBLIC_WEEK_ROLLOVER=$NEXT_PUBLIC_WEEK_ROLLOVER
ENV NEXT_STALE_DYNAMIC=$NEXT_STALE_DYNAMIC
ENV NEXT_STALE_STATIC=$NEXT_STALE_STATIC
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_API_KEY=$NEXT_PUBLIC_API_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_DEBUG_API=$NEXT_PUBLIC_DEBUG_API
ENV NEXT_PUBLIC_API_BACKEND_URL=$NEXT_PUBLIC_API_BACKEND_URL

# Everything else the build reads (.env.example). Passed only when set: an
# ARG that is not given stays unset, so the defaults in the code apply.
# LEGAL_ENTITY_NAME is required: the privacy notice names the controller.
ARG LEGAL_ENTITY_NAME
ARG LEGAL_OPERATOR_NAME
ARG LEGAL_CONTACT_EMAIL
ARG LEGAL_PRIVACY_EMAIL
ARG LEGAL_ADDRESS_LINE_1
ARG LEGAL_ADDRESS_LINE_2
ARG LEGAL_REPRESENTATIVE
ARG LEGAL_VAT_ID
ARG LEGAL_COMPANY_REGISTER
ARG LEGAL_REA_NUMBER
ARG LEGAL_PEC
ARG NEXT_PUBLIC_GA_ID
ARG NEXT_PUBLIC_SUPPORT_URL
ARG NEXT_PUBLIC_COMMENT_MAX_LENGTH
ARG NEXT_PUBLIC_WORD_FILTER_BLOCK
ARG NEXT_PUBLIC_WORD_FILTER_ALLOW
ARG MENSA_API_URL
ARG MENSA_API_KEY
ARG GOOGLE_SITE_VERIFICATION
ARG BING_SITE_VERIFICATION
ARG INDEXNOW_KEY
ARG CONTENT_SIGNALS

RUN npm run build

# The web server falls back to the same language as the pages (lib/i18n/locale.ts).
RUN case "$NEXT_PUBLIC_FALLBACK_LOCALE" in de|it|en) lang="$NEXT_PUBLIC_FALLBACK_LOCALE" ;; *) lang=en ;; esac \
    && sed -i "s/__FALLBACK_LOCALE__/$lang/g" deploy/nginx.conf

# ── Serve: nginx, unprivileged, nothing but files ─────────────────────────────
FROM nginxinc/nginx-unprivileged:1.28-alpine AS runner
COPY --from=builder /app/deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/deploy/nginx-headers.conf /etc/nginx/pokyh/headers.conf
COPY --from=builder /app/out /usr/share/nginx/html
# Same port as before, so the tunnel / proxy in front stays as it is.
EXPOSE 3011
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:3011/de/ || exit 1
