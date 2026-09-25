# Plumfield Press Proof Review System

A local-first, multi-stage editorial workflow system for book manuscripts.

## System Architecture

- **/server**: Python (FastAPI + FastMCP + SQLite3 + Uvicorn)
  - `/server/api`: REST API endpoints for user authentication, proof creation, listing, downloading, and updating.
  - `/server/state_machine`: Stage progression and workflow state machine logic.
  - `/server/database`: SQLite database connection and state persistence (`state.sqlite`).
  - `/server/filesystem`: Storage and file reading/writing handlers for manuscript PDFs.
  - `/server/server_mcp`: FastMCP endpoint exposing proof state tools for AI agents mounted at `/mcp`.
- **/client**: React 19 + TypeScript + Vite + Tailwind CSS v4 + React Query + Shadcn UI
  - Interactive proof review dashboard featuring stage columns and active proof editing.
- **/proofs**: Local directory storage for PDF manuscript proofs.

## Review Workflow

Proofs progress through a sequential multi-stage review order:

1. **Admin (Manual / Dashboard)**: Uploads or registers a new proof (`{id}.pdf`).
2. **Kristi**: Stage `kristi`
3. **Ed**: Stage `ed`
4. **Diane**: Stage `diane`
5. **Sara**: Stage `sara`
6. **Greta**: Stage `greta`
7. **Done**: Stage `done` (Final review complete)

## Requirements & Environment Configuration

- **Python**: `>=3.14` (managed with `uv` or standard Python virtual environment)
- **Node.js & Package Manager**: Node >=22, `pnpm`
- **Environment File**: `server/.env`

Example `server/.env`:
```env
ENV=localhost
PROOFS_DIR="/path/to/proofs"
TUNNEL_TOKEN=your_cloudflare_tunnel_token
GMAIL_TOKEN=some_token_from_google
```

## Setup & Running

1. **Install dependencies:**
   ```bash
   pnpm run install-all
   ```

2. **Run in Development Mode:**
   ```bash
   make dev
   # or
   pnpm run dev
   ```

3. **Access the application:**
   - Frontend (Vite Dev): [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:3001](http://localhost:3001)
   - FastMCP Endpoint: [http://localhost:3001/mcp](http://localhost:3001/mcp)

4. **Production Deployment / LaunchAgent:**
   Execute `./start.sh` to run the system with Cloudflare Tunnel integration.

## Useful Commands

- `make dev`: Starts the FastAPI server (`uv run python -m server.main`) and Vite client (`pnpm dev`) concurrently.
- `make export`: Exports Python dependencies to `requirements.txt` via `uv`.

## Security & Authentication

In production, Cloudflare Zero Trust handles authentication by passing the user's email via the `cf-access-authenticated-user-email` (or `x-user-email`) HTTP header. The backend maps authorized emails to specific internal user roles (`admin` or `user`) and review stages. In local development (`ENV=localhost`), authentication automatically uses dev admin credentials.