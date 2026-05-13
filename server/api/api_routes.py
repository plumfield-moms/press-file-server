from fastapi import APIRouter, HTTPException, status, UploadFile, File, Depends, Header
from fastapi.responses import FileResponse
from typing import List, Annotated
from server.types import User, Proof
from server.database.db import get_user
from server.filesystem.main import (
    get_all_proofs, 
    find_proof, 
    advance_proof, 
    check_permissions,
    STAGES
)

router = APIRouter(prefix="/api")

def get_current_user(
    x_user_email: Annotated[str | None, Header()] = None,
    cf_access_authenticated_user_email: Annotated[str | None, Header()] = None
) -> User:
    email = cf_access_authenticated_user_email or x_user_email
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing auth headers")
    
    user = get_user(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"User {email} not found")
    return user

@router.get("/me", response_model=User)
def me(user: User = Depends(get_current_user)):
    return user

@router.get("/proofs", response_model=List[Proof])
def list_proofs(user: User = Depends(get_current_user)):
    all_proofs = get_all_proofs()
    results = []
    for p in all_proofs:
        can_up, can_down = check_permissions(user.role, user.username, p["stage"])
        results.append(Proof(
            id=p["id"], 
            stage=p["stage"], 
            can_upload=can_up, 
            can_download=can_down
        ))
    return results

@router.get("/proofs/{proof_id}", response_model=Proof)
def get_proof_details(proof_id: str, user: User = Depends(get_current_user)):
    location = find_proof(proof_id)
    if not location:
        raise HTTPException(status_code=404, detail="Proof not found")
    
    _, stage = location
    can_up, can_down = check_permissions(user.role, user.username, stage)
    return Proof(id=proof_id, stage=stage, can_upload=can_up, can_download=can_down)

@router.post("/proofs/{proof_id}/upload")
async def upload_proof(
    proof_id: str,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user)
):
    location = find_proof(proof_id)
    current_stage = location[1] if location else "ed"
    
    can_up, _ = check_permissions(user.role, user.username, current_stage)
    if not can_up:
        raise HTTPException(
            status_code=403, 
            detail=f"User {user.username} not authorized to upload at stage {current_stage}"
        )

    next_stage = advance_proof(proof_id, file)
    return {"message": "Success", "stage": next_stage}

@router.get("/proofs/{proof_id}/download")
async def download_proof(
    proof_id: str,
    user: User = Depends(get_current_user)
):
    location = find_proof(proof_id)
    if not location:
        raise HTTPException(status_code=404, detail="Proof not found")
    
    path, stage = location
    _, can_down = check_permissions(user.role, user.username, stage)
    
    if not can_down:
        raise HTTPException(status_code=403, detail="Not authorized to download at this stage")

    return FileResponse(
        path=path,
        filename=f"{proof_id}.pdf",
        media_type="application/pdf"
    )
