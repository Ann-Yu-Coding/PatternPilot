# Production image for Render (see docs/deploy.md).
# One Node process serves the built website and the API from one origin.
# Debian (glibc), not Alpine: pnpm-workspace.yaml excludes musl binaries.
FROM node:24-bookworm-slim

ENV CI=true COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile

# The Vite config requires PORT and BASE_PATH at build time; PORT is unused by the build.
RUN PORT=5173 BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/patternpilot run build \
 && pnpm --filter @workspace/api-server run build

# Dev dependencies stay installed: Render's pre-deploy step runs drizzle-kit migrate and the tsx seed.
ENV NODE_ENV=production \
    PORT=5000 \
    STATIC_DIR=/app/artifacts/patternpilot/dist/public
EXPOSE 5000
CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
