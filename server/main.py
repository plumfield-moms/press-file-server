from fastapi import FastAPI
import os
from server.api.api_routes import router as api_router

PORT = os.getenv("PORT")
PROOFS_DIR = os.getenv("PROOFS_DIR")
ED_EMAIL = os.getenv("ED_EMAIL")
DIANE_EMAIL = os.getenv("DIANE_EMAIL")
SARA_EMAIL = os.getenv("SARA_EMAIL")

app = FastAPI()
app.include_router(api_router)


@app.get("/")
def read_root():
    return {"Hello": "World"}
