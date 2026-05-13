from pathlib import Path
import shutil
from fastapi import UploadFile
import os

# Define workflow order
STAGES = ["ed", "diane", "sara", "kristi", "diane_2", "done"]

# Map stages to the role allowed to move them to the next stage
STAGE_OWNERS = {
    "ed": "ed",
    "diane": "diane",
    "sara": "sara",
    "kristi": "kristi",
    "diane_2": "diane",
    "done": None
}

def get_proofs_dir() -> Path:
    path = os.getenv("PROOFS_DIR", "./proofs")
    p = Path(path)
    p.mkdir(parents=True, exist_ok=True)
    for stage in STAGES:
        (p / stage).mkdir(exist_ok=True)
    return p

def find_proof(proof_id: str) -> tuple[Path, str] | None:
    """Locates a proof file and returns its path and current stage."""
    base = get_proofs_dir()
    for stage in STAGES:
        path = base / stage / f"{proof_id}.pdf"
        if path.exists():
            return path, stage
    return None

def get_all_proofs():
    """Lists all proofs by scanning the folder structure."""
    base = get_proofs_dir()
    proofs = []
    seen_ids = set()
    
    # Scan stages in reverse to prioritize 'later' versions if duplicates somehow exist
    for stage in reversed(STAGES):
        for file in (base / stage).glob("*.pdf"):
            proof_id = file.stem
            if proof_id not in seen_ids:
                proofs.append({"id": proof_id, "stage": stage})
                seen_ids.add(proof_id)
    return proofs

def check_permissions(user_role: str, username: str, stage: str) -> tuple[bool, bool]:
    """Returns (can_upload, can_download) for a given user and stage."""
    if user_role == "admin":
        return True, True
    
    owner = STAGE_OWNERS.get(stage)
    can_upload = (username == owner and stage != "done")
    
    # Download rule: owner of current stage or it is finalized
    can_download = (username == owner or stage == "done")
    
    return can_upload, can_download

def advance_proof(proof_id: str, file: UploadFile):
    """Moves a proof to the next stage folder."""
    location = find_proof(proof_id)
    if not location:
        # If not found, assume it's a new proof starting at 'ed'
        current_stage = "ed"
        old_path = None
    else:
        old_path, current_stage = location

    try:
        idx = STAGES.index(current_stage)
        if idx >= len(STAGES) - 1:
            return current_stage # Already at 'done'
            
        next_stage = STAGES[idx + 1]
        base = get_proofs_dir()
        new_path = base / next_stage / f"{proof_id}.pdf"
        
        with new_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        if old_path and old_path != new_path:
            old_path.unlink()
            
        return next_stage
    except ValueError:
        return current_stage
