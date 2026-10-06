# Multi-stage Dockerfile for Rotana Clinic Backend (NestJS + Prisma)
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Generate Prisma Client
COPY prisma ./prisma/
RUN npx prisma generate

# Build NestJS application
COPY . .
RUN npm run build

# Runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy generated Prisma engine and compiled dist artifacts
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 4000

# Run as non-privileged user for clinical data safety
USER node

CMD ["node", "dist/main"]
