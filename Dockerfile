# Imagen basada en Debian (glibc), no Alpine: better-sqlite3 usa un binario
# nativo prebuilt que coincide con glibc: en Alpine (musl) tendría que
# compilarse desde cero y es más frágil. Usamos la misma base en build y
# runtime para que ese binario nativo sea compatible.

FROM node:22-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build


FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/next.config.ts ./next.config.ts

# Carpeta para el archivo de SQLite -- monta un volumen aquí en producción
# (ver docker-compose.yml) para que los datos sobrevivan a un redeploy.
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data /app

USER nextjs
EXPOSE 3000

# Aplica migraciones pendientes contra el volumen montado antes de arrancar.
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
