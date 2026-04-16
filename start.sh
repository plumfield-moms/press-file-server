#!/bin/bash

# Load .env if it exists
if [ -f server/.env ]; then
  export $(cat server/.env | xargs)
fi

# Check for required env vars
if [ -z "$TUNNEL_TOKEN" ]; then
  echo "Error: TUNNEL_TOKEN is not set in server/.env"
  exit 1
fi

if [ -z "$ED_EMAIL" ] || [ -z "$DIANE_EMAIL" ]; then
  echo "Error: ED_EMAIL or DIANE_EMAIL is not set in server/.env"
  exit 1
fi

echo "Starting Plumfield Press Review System..."

# Run everything concurrently
# Note: We use 'cloudflared tunnel run' which requires TUNNEL_TOKEN
pnpm concurrently \
  "pnpm run server" \
  "pnpm run client" \
  "cloudflared tunnel run --token $TUNNEL_TOKEN"
