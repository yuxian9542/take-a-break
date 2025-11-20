FROM node:18-alpine AS base
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && apk add --no-cache libc6-compat

WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY services/api/package.json services/api/package.json
COPY packages ./packages
COPY infra/firebase ./infra/firebase

# Pre-fetch dependencies for faster, repeatable installs
RUN pnpm fetch --prod --filter @take-a-break/api...

# Bring in the full workspace for the build
COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @take-a-break/api... build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/package.json ./
COPY --from=deps /app/services/api/dist ./services/api/dist
COPY --from=deps /app/services/api/package.json ./services/api/package.json
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/infra/firebase ./infra/firebase

RUN pnpm install --frozen-lockfile --prod --filter @take-a-break/api...

EXPOSE 3333
CMD ["node", "services/api/dist/server.js"]
