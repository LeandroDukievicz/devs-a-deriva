# ── Build ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Inlined at build time by Astro (PUBLIC_* vars)
ARG PUBLIC_DASHBOARD_URL=https://dashboard.devsaderiva.com.br
ENV PUBLIC_DASHBOARD_URL=$PUBLIC_DASHBOARD_URL

RUN npm run build

# ── Serve ────────────────────────────────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
