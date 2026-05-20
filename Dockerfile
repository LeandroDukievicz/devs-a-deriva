# ── Build ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Inlined at build time by Vite (PUBLIC_* vars)
ARG PUBLIC_DASHBOARD_URL=https://dashboard.devsaderiva.com.br
ARG PUBLIC_COMMIT_SHA=local
ENV PUBLIC_DASHBOARD_URL=$PUBLIC_DASHBOARD_URL
ENV PUBLIC_COMMIT_SHA=$PUBLIC_COMMIT_SHA

RUN npm run build

# ── Serve ────────────────────────────────────────────────────────────────────
# @astrojs/node standalone bundles server + client assets into dist/.
# dist/server/entry.mjs starts an HTTP server that handles both static files
# (from dist/client/) and SSR pages.
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist

ENV HOST=0.0.0.0
ENV PORT=4321

EXPOSE 4321

CMD ["node", "dist/server/entry.mjs"]
