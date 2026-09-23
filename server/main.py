import os
import subprocess
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI

from server.api.api_routes import router as api_router
from server.database.db import state_db_setup
from server.server_mcp.main import mcp_app

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
CLOUDFLARED = "/opt/homebrew/bin/cloudflared"
DEV = True
TOKEN = os.getenv("TUNNEL_TOKEN") or ""
DEV = os.getenv("ENV") == "localhost"

if not TOKEN and not DEV:
    raise RuntimeError("Missing TUNNEL_TOKEN")

@asynccontextmanager
async def lifespan(app: FastAPI):
    if DEV: print("INFO:\tUsing DEV mode without Cloudflare")
    state_db_setup()
    cloudflared = None
    if not DEV: cloudflared = subprocess.Popen([CLOUDFLARED, "tunnel", "run", "--token", TOKEN])  # noqa: ASYNC220
    try:
        yield
    finally:
        if cloudflared:
            cloudflared.terminate()
            try:
                cloudflared.wait(timeout=10)
            except subprocess.TimeoutExpired:
                cloudflared.kill()
app = FastAPI(lifespan=lifespan)
app.include_router(api_router)
app.mount("/mcp", mcp_app)

app.frontend("/", directory="dist")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)