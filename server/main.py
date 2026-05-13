from fastapi import FastAPI
import os
from contextlib import asynccontextmanager
from server.api.api_routes import router as api_router
from server.database.db import db_setup
from server.database.notifications import init_notifications_db
from server.filesystem.main import get_proofs_dir

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Databases
    db_setup()
    init_notifications_db()
    # Ensure Proofs directory exists
    get_proofs_dir()
    yield

app = FastAPI(lifespan=lifespan)
app.include_router(api_router)

@app.get("/")
def read_root():
    return {"status": "running", "workflow": "folder-based"}
