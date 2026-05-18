# Use Node.js 22 LTS
FROM node:22-slim AS build

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
RUN npm ci

# Build the app
COPY . .
RUN npm run build

# Production stage
FROM node:22-slim AS production

WORKDIR /app

# Copy built app and dependencies
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./
COPY --from=build /app/src ./src

# Expose the port Next.js runs on
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "run", "start"]
