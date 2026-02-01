# ================================
# Stage 1: Install dependencies
# ================================
FROM node:24-alpine AS deps

WORKDIR /app

# Copy only package files first (better Docker cache)
COPY package*.json ./

# IMPORTANT:
# We disable postinstall scripts here because Prisma schema is not copied yet.
# Running "prisma generate" now would fail.
RUN npm ci --ignore-scripts


# ================================
# Stage 2: Build the application
# ================================
FROM node:24-alpine AS build

WORKDIR /app

# Reuse installed dependencies from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the full project source code (including Prisma schema)
COPY . .

# Generate Prisma Client AFTER schema is available
RUN npx prisma generate

# Build NestJS application (outputs to /dist)
RUN npm run build


# ================================
# Stage 3: Production runtime image
# ================================
FROM node:24-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

# Copy only what is required to run the app
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Copy Prisma files required for migrations/runtime
COPY --from=build /app/prisma ./prisma

# If you use Prisma v7 config file, include it as well
COPY --from=build /app/prisma.config.ts ./prisma.config.ts

# Render provides PORT automatically, but
