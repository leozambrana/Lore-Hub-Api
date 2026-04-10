# Estágio 1: Build
FROM node:20-slim AS builder

# Instalar dependências necessárias para o Prisma no Linux
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npm run build

# Estágio 2: Runner (Imagem final mais leve)
FROM node:20-slim AS runner

RUN apt-get update && apt-get install -y openssl

WORKDIR /app

# Copiamos apenas o que é essencial para rodar o app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

# O comando de inicialização
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]