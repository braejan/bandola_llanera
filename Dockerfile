# syntax=docker/dockerfile:1.7

# ---------- builder ----------
FROM node:22-alpine AS builder
WORKDIR /app

# Install full deps (incl. devDeps for the build)
COPY package.json package-lock.json ./
RUN npm ci

# Build the Qwik production bundle (client + static SSG + server entry)
COPY . .
RUN npm run build

# ---------- runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app

# wget is needed by the docker-compose healthcheck to probe the served page.
# It is not in the default node:alpine image, so install it explicitly.
RUN apk add --no-cache wget

# Install production-only deps (smaller node_modules)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built artifacts from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Run as the non-root 'node' user (uid 1000, ships with the node:alpine image)
USER node

ENV PORT=4173
ENV HOST=0.0.0.0
EXPOSE 4173

CMD ["node", "./server/entry.preview.js"]
