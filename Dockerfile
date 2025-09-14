# Multi-stage Dockerfile for Varuni Backoffice (Next.js)
# Optimized for Azure App Service container deployment

# ---------- Base image ----------
FROM node:20-slim AS base
WORKDIR /app

# ---------- Dependencies layer ----------
FROM base AS deps
COPY package.json package-lock.json .npmrc ./
RUN npm ci --legacy-peer-deps

# ---------- Build layer ----------
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- Runtime layer ----------
FROM node:20-slim AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# Install only production deps for smaller runtime image
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copy build output and required runtime assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Copy environment file for proper configuration
COPY --from=builder /app/envstandin ./envstandin

# gRPC proto files are loaded from process.cwd()/src/lib/grpc/protos at runtime
COPY --from=builder /app/src/lib/grpc/protos ./src/lib/grpc/protos

# Default port for Next.js; Azure injects PORT env var at runtime
ENV PORT=3000
EXPOSE 3000

# Lightweight healthcheck without adding curl/wget
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Bind to all interfaces and use Azure's PORT if provided
CMD ["sh","-c","npm run start -- -H 0.0.0.0 -p ${PORT:-3000}"]


