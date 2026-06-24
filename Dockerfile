# ── Build ────────────────────────────────────────────────────────────────────
FROM public.ecr.aws/docker/library/node:22-alpine AS builder

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
# @astrojs/node standalone outputs dist/server/entry.mjs + dist/client/.
# The entry point imports external packages (piccolore, clsx, unstorage, etc.)
# that Vite marks as external — they must be resolved from node_modules at runtime.
FROM public.ecr.aws/docker/library/node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

ENV HOST=0.0.0.0
ENV PORT=4321

EXPOSE 4321

CMD ["node", "dist/server/entry.mjs"]
