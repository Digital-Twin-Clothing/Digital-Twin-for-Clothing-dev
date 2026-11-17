FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
# The app pipeline passes the commit SHA so the page can show which build is live.
ARG COMMIT_SHA=local
ENV NODE_ENV=production \
    HOSTNAME="0.0.0.0" \
    PORT=8080 \
    COMMIT_SHA=$COMMIT_SHA
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
# Run as the unprivileged "node" user that the base image provides, not root.
USER node
EXPOSE 8080
CMD ["node", "server.js"]
