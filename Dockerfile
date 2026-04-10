# Estágio de Build
FROM node:20-slim AS builder
RUN apt-get update && apt-get install -y openssl python3 make g++ 

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
# No Prisma 7, o generate é crucial antes do build
RUN npx prisma generate

COPY . .
RUN npm run build

# Estágio de Runtime
FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y openssl
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

EXPOSE 3001

# O comando que une migração e execução
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]