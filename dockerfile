FROM node:24-slim AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci


FROM node:24-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# As variáveis NEXT_PUBLIC_* são lidas pelo BROWSER, por isso o Next injecta-as
# literalmente no bundle durante o `next build` — não são lidas em runtime.
# Passá-las como ARG é a única forma de as controlar a partir do compose; sem
# isto, ficava fixado o que estivesse no .env copiado para a imagem.
#
# ⚠️ O valor tem de ser alcançável a partir do BROWSER, não de dentro da rede
# do Docker. `http://backend:8000` só resolve entre contentores e daria
# ERR_NAME_NOT_RESOLVED no separador do utilizador.
ARG NEXT_PUBLIC_BACKEND_URL=http://localhost:8000/
ARG NEXT_PUBLIC_BACKEND_AUTH_URL=http://localhost:8000/auth

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
