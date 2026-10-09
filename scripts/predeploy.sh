#!/bin/sh
# Render pre-deploy step (render.yaml): runs before each release goes live.
# Both commands are safe to repeat.
set -e
pnpm --filter @workspace/db run migrate
pnpm --filter @workspace/api-server run seed:questions
