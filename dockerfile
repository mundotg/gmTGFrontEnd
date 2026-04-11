# 1. Instalação de dependências
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2. Builder
FROM node:24-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# IMPORTANTE: No next.config.js, deves ter 'output: "standalone"'
RUN npm run build

# 3. Runner (O ambiente de execução igual à Vercel)
FROM node:24-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
# Variável para o teu backend no Render
ENV VITE_API_URL=https://gmtgbackend.onrender.com 

RUN groupadd -g 1001 nodejs
RUN useradd -u 1001 nextjs -g nodejs

# Copia apenas o necessário do build standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]