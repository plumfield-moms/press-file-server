from fastapi import APIRouter, HTTPException, status, UploadFile, File, Depends, Header
from fastapi.responses import FileResponse
from typing import List, Annotated
from server.types import User, Proof
from server.database.db import get_user
from server.filesystem.main import (
    get_all_proofs,
    find_proof,
    find_docx,
    find_txt,
    save_docx,
    advance_proof,
    check_permissions,
    STAGES,
)
import os

router = APIRouter(prefix="/api")


def get_current_user(
    x_user_email: Annotated[str | None, Header()] = None,
    cf_access_authenticated_user_email: Annotated[str | None, Header()] = None,
) -> User:
    email = cf_access_authenticated_user_email or x_user_email
    print(f"[LOGIN] login attempt for email {email}")

    # Dev Mode: Auto-admin if no headers are present
    if not email and os.getenv("DEV_MODE") == "true":
        return User(
            email="masarikfamilymichael@gmail.com", username="michael", role="admin"
        )

    if not email:
        print("[LOGIN] BLOCKED login - missing email.")
        print("[LOGIN] Headers:")
        print(f"[LOGIN]\tx_user_email: {x_user_email}")
        print(
            f"[LOGIN]\tcf_access_authenticated_user_email: {cf_access_authenticated_user_email}"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing auth headers"
        )

    user = get_user(email)
    if not user:
        print(f"[LOGIN] BLOCKED login for {email}: invaild user")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=f"User {email} not found"
        )
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
        has_notes = find_docx(p["id"]) is not None
        has_txt = find_txt(p["id"]) is not None
        results.append(
            Proof(
                id=p["id"],
                stage=p["stage"],
                can_upload=can_up,
                can_download=can_down,
                has_notes=has_notes,
                has_txt=has_txt,
            )
        )
    return results


@router.get("/proofs/{proof_id}", response_model=Proof)
def get_proof_details(proof_id: str, user: User = Depends(get_current_user)):
    location = find_proof(proof_id)
    if not location:
        raise HTTPException(status_code=404, detail="Proof not found")

    _, stage = location
    can_up, can_down = check_permissions(user.role, user.username, stage)
    has_notes = find_docx(proof_id) is not None
    has_txt = find_txt(proof_id) is not None
    return Proof(
        id=proof_id,
        stage=stage,
        can_upload=can_up,
        can_download=can_down,
        has_notes=has_notes,
        has_txt=has_txt,
    )


@router.post("/proofs/{proof_id}/upload")
async def upload_proof(
    proof_id: str, file: UploadFile = File(...), user: User = Depends(get_current_user)
):
    location = find_proof(proof_id)
    current_stage = location[1] if location else "ed"

    can_up, _ = check_permissions(user.role, user.username, current_stage)
    if not can_up:
        raise HTTPException(
            status_code=403,
            detail=f"User {user.username} not authorized to upload at stage {current_stage}",
        )

    next_stage = advance_proof(proof_id, file)
    return {"message": "Success", "stage": next_stage}


@router.get("/proofs/{proof_id}/download")
async def download_proof(proof_id: str, user: User = Depends(get_current_user)):
    location = find_proof(proof_id)
    if not location:
        raise HTTPException(status_code=404, detail="Proof not found")

    path, stage = location
    _, can_down = check_permissions(user.role, user.username, stage)

    if not can_down:
        raise HTTPException(
            status_code=403, detail="Not authorized to download at this stage"
        )

    return FileResponse(
        path=path, filename=f"{proof_id}.pdf", media_type="application/pdf"
    )


@router.post("/proofs/{proof_id}/notes")
async def upload_notes(
    proof_id: str, file: UploadFile = File(...), user: User = Depends(get_current_user)
):
    # Only Ed can upload docx notes
    if user.username != "ed" and user.role != "admin":
        raise HTTPException(status_code=403, detail="Only Ed can upload notes")

    save_docx(proof_id, file)
    return {"message": "Notes uploaded successfully"}


@router.get("/proofs/{proof_id}/notes")
async def download_notes(proof_id: str, user: User = Depends(get_current_user)):
    path = find_docx(proof_id)
    if not path:
        raise HTTPException(status_code=404, detail="Notes not found")

    # Simple rule: anyone with access to the proof can see the notes
    return FileResponse(
        path=path,
        filename=f"{proof_id}.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )


@router.get("/proofs/{proof_id}/txt")
async def download_txt(proof_id: str, user: User = Depends(get_current_user)):
    path = find_txt(proof_id)
    if not path:
        raise HTTPException(status_code=404, detail="Plaintext notes not found")

    return FileResponse(
        path=path,
        filename=f"{proof_id}.txt",
        media_type="text/plain",
    )
