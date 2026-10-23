# Plumfield Press Proof Review System

A local-first, multi-stage editorial workflow for reviewing book manuscript PDFs.

## Repository layout

The application consists of a Python backend and a Vite/React frontend:

```text
.
├── client/                 # React, TypeScript, Vite, Tailwind CSS, and shadcn/ui
│   └── src/
├── proofs/                 # Working proof PDFs
├── server/
│   ├── api/                # FastAPI routes for authentication and proof operations
│   ├── database/           # SQLite state and vault metadata
│   ├── filesystem/         # Proof and vault file access
│   ├── server_mcp/         # Live FastMCP server
│   ├── state_machine/      # Review-stage progression
│   ├── vault/              # Vault routes
│   └── main.py             # FastAPI application entry point
├── vault/                  # Finalized manuscripts retained for long-term access
└── Makefile
```

`server/server_mcp/` is the active MCP implementation. The deprecated top-level
`mcp-server/` directory is not part of the running application.

## Review workflow

An administrator creates a proof by uploading a PDF and a book title. The server
assigns a UUID and stores the working file as `{id}.pdf`. Each review submission
replaces that working PDF and advances it to the next stage:

1. **Admin** creates the proof.
2. **Kristi** reviews it (`kristi`).
3. **Ed** reviews it (`ed`).
4. **Diane** reviews it (`diane`).
5. **Sara** reviews it (`sara`).
6. **Greta** reviews it (`greta`).
7. **Done** marks the final stage (`done`).

Proof metadata and the current stage are stored in SQLite at
`server/database/state.sqlite`. The working PDF files live in `proofs/`.

> TODO: Add email notifications for proof status updates

## Vault

The vault is a place to store finished manuscripts. Once a book is completed, the final pdf is stored on an external drive (`/Volumes/Plumfield/.press-file-server/vault`).

An admin uploads a pdf with the book's title to the server, where it is given a UUID and written to the external location. the UUID is store in the `vault` table in `server/database/state.sqlite`. Anyone can download the finished file - only an admin can overwrite it with a new version.

In dev mode vault stores are written to `vault/` instead so development doesn't need to wrangle mounted volume issues.

> TODO: Add support for .af files so we can archive the Affinity file for the book

## Requirements

- Python 3.14 or newer
- `uv`
- Node.js 22 or newer
- `pnpm`
- `cloudflared` for non-localhost deployment

## Configuration

Create or update `server/.env` with the required runtime settings:

```env
ENV=localhost
TUNNEL_TOKEN=your_cloudflare_tunnel_token
```

`ENV=localhost` enables the development login and does not start Cloudflare
Tunnel. In production, authentication is based on the
`cf-access-authenticated-user-email` or `x-user-email` request header. The
authorized reviewer accounts and roles are currently defined in
`server/users.py`.

## Installation and development

Install the Python and frontend dependencies:

```bash
uv sync
cd client
pnpm install
cd ..
```

Start both services in development mode:

```bash
make dev
```

This runs the FastAPI server and the Vite development server concurrently.
Alternatively, start them separately:

```bash
uv run python -m server.main
cd client && pnpm dev
```

The development endpoints are:

- Frontend: <http://localhost:5173>
- FastAPI application: <http://localhost:3001>
- REST API: <http://localhost:3001/api>
- MCP HTTP application: mounted at <http://localhost:3001/api>

The frontend is served from the built `dist/` directory when running the
FastAPI application outside Vite.

## Startup

After configuring `server/.env` and activating the virtual environment, run:

```bash
python3 -m server.main
```

Outside localhost mode, the application starts the Cloudflare Tunnel from the
backend using `TUNNEL_TOKEN`.

## Useful commands

```bash
make dev       # Run the backend and frontend development servers
make lint      # Run Biome and Ruff checks/formatting
make export    # Export uv dependencies to requirements.txt
```

Frontend-specific commands can be run from `client/`:

```bash
pnpm build
pnpm lint
pnpm preview
```
