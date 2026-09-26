FROM node:24-slim AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM node:24-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Declaração dos argumentos sem valor padrão (fallback).
# Isto obriga o Docker a usar as variáveis passadas pelo Dokploy nos "Build Arguments".
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_BACKEND_AUTH_URL

# Passagem dos argumentos para o ambiente de compilação
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}
ENV NEXT_PUBLIC_BACKEND_AUTH_URL=${NEXT_PUBLIC_BACKEND_AUTH_URL}

RUN npm run build

FROM node:24-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd -r nodejs
RUN useradd -r -g nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node","server.js"]