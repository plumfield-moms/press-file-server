#!/bin/bash

set -e

# -----------------------------
# Resolve repo root (LaunchAgent safe)
# -----------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# -----------------------------
# Load environment variables safely
# -----------------------------
if [ -f server/.env ]; then
  set -a
  source server/.env
  set +a
fi

# -----------------------------
# Required env vars
# -----------------------------
if [ -z "$TUNNEL_TOKEN" ]; then
  echo "Error: TUNNEL_TOKEN is not set in server/.env"
  exit 1
fi

if [ -z "$ED_EMAIL" ] || [ -z "$DIANE_EMAIL" ] || [ -z "$GRETA_EMAIL" ] || [ -z "$SARA_EMAIL"]; then
  echo "Error: ED_EMAIL or DIANE_EMAIL is not set in server/.env"
  exit 1
fi

if [ -z "$PROOFS_DIR" ]; then
  echo "Error: PROOFS_DIR is not set in server/.env"
  exit 1
fi

# -----------------------------
# Symlink / mount readiness check
# -----------------------------
# We wait for the proofs directory to exist (handles external drive + symlink cases)

echo "Checking proofs directory availability: $PROOFS_DIR"

ATTEMPTS=0
MAX_ATTEMPTS=30

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
  if [ -d "$PROOFS_DIR" ]; then
    echo "Proofs directory is available."
    break
  fi

  echo "Waiting for proofs volume/symlink to become available... ($ATTEMPTS)"
  sleep 2
  ATTEMPTS=$((ATTEMPTS + 1))

done

if [ ! -d "$PROOFS_DIR" ]; then
  echo "Error: PROOFS_DIR is not available after waiting: $PROOFS_DIR"
  exit 1
fi

# -----------------------------
# Start system
# -----------------------------

echo "Starting Plumfield Press Review System..."

# Run everything concurrently (LaunchAgent safe)
pnpm concurrently \
  "pnpm start" \
  "cloudflared tunnel run --token $TUNNEL_TOKEN"
