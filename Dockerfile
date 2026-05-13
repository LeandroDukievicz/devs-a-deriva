# ── Build ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Inlined at build time by Astro (PUBLIC_* vars)
ARG PUBLIC_DASHBOARD_URL=https://dashboard.devsaderiva.com.br
ARG PUBLIC_COMMIT_SHA=local
ENV PUBLIC_DASHBOARD_URL=$PUBLIC_DASHBOARD_URL
ENV PUBLIC_COMMIT_SHA=$PUBLIC_COMMIT_SHA

RUN npm run build

# ── Serve ────────────────────────────────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
