from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from pathlib import Path
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from server.api.api_routes import router as api_router
from server.database.db import db_setup
from server.database.notifications import init_notifications_db
from server.filesystem.main import get_proofs_dir
import subprocess

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
CLOUDFLARED = "/opt/homebrew/bin/cloudflared"
TOKEN = os.getenv("TUNNEL_TOKEN") or ""
if not TOKEN:

    raise RuntimeError("Missing TUNNEL_TOKEN")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Databases
    db_setup()
    init_notifications_db()
    # Ensure Proofs directory exists
    get_proofs_dir()
    cloudflared = subprocess.Popen([CLOUDFLARED, "tunnel", "run", "--token", TOKEN])
    try:
        yield
    finally:
        cloudflared.terminate()
        try:
            cloudflared.wait(timeout=10)
        except subprocess.TimeoutExpired:
            cloudflared.kill()


app = FastAPI(lifespan=lifespan)

# Include API routes first so they take precedence
app.include_router(api_router)

# Serve Frontend static files
client_dist = Path(__file__).parent.parent / "client" / "dist"

if client_dist.exists():
    # Mount the assets/static files
    app.mount("/assets", StaticFiles(directory=client_dist / "assets"), name="assets")

    # Catch-all route to serve index.html for SPA routing
    @app.get("/{rest_of_path:path}")
    async def serve_frontend(rest_of_path: str):
        # If the path looks like an API call, we let FastAPI return 404 naturally
        if rest_of_path.startswith("api/"):
            return {"detail": "Not Found"}

        index_file = client_dist / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        return {"detail": "Frontend build not found"}

else:

    @app.get("/")
    def read_root():
        return {
            "status": "running",
            "warning": "Frontend build (client/dist) not found",
        }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
