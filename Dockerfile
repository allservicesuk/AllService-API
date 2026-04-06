# AllServices — ALS Marketing UK Ltd
# Copyright (c) 2026. All rights reserved.
# Developer: linkst
#
# Multi-stage container image that builds the API with pnpm, prunes to prod deps, and runs via pm2-runtime.

FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN pnpm exec prisma generate --schema=src/prisma/schema.prisma
RUN pnpm build
RUN pnpm prune --prod

FROM node:22-alpine AS runtime
RUN apk add --no-cache wget tini \
    && addgroup -g 1001 -S nodejs \
    && adduser -S -u 1001 -G nodejs nodejs
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --chown=nodejs:nodejs ecosystem.config.js ./ecosystem.config.js
USER nodejs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --quiet --spider http://localhost:3000/v1/health || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["npx", "pm2-runtime", "ecosystem.config.js"]
