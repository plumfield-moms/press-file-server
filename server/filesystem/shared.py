import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

PROOF_DIR = Path(__file__).parent.parent.parent / "proofs"

if os.getenv("ENV") == "localhost":
    VAULT = Path(__file__).parent.parent.parent / "vault"
else:
    VAULT = Path("/Volumes/Plumfield/.press-file-server/vault")
