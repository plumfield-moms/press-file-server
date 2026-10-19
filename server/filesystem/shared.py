import os
from pathlib import Path

PROOF_DIR = Path(__file__).parent.parent.parent / "proofs"

if os.getenv("ENV") == "localhost":
    VAULT = Path(__file__).parent.parent.parent / "vault"
else:
    VAULT = Path("/Volumes/Plumfield/.press-file-server/vault")
