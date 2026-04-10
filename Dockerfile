# Estágio 1: Build
FROM node:20-slim AS builder

# Instalar dependências necessárias para o Prisma no Linux
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# 1. Instala as dependências
RUN npm install

# 2. GERA O CLIENTE DO PRISMA
RUN npx prisma generate

# 3. Copia o resto do código
COPY . .

# 4. Agora o build vai funcionar porque o PrismaClient já existe
RUN npm run build

# Estágio 2: Runner
FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]