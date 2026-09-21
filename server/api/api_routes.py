import warnings

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from pydantic import ValidationError

from server.database.db import get_all_files, update_proof
from server.filesystem.main import (
    advance_proof,
    check_permissions,
    find_proof,
    find_txt,
    save_docx,
)
from server.filesystem.read import file_path
from server.filesystem.write import write_file
from server.state_machine.main import (
    create_new_proof,
    current_file_stage,
    next_file_stage,
)
from server.types import Proof, User
from server.users import CurrentUser, get_current_user

router = APIRouter(prefix="/api")


@router.get("/me", response_model=User)
def me(user: User = Depends(get_current_user)):  # noqa: B008
    return user


@router.post("/new")
async def create_proof(user: CurrentUser, title: str = Form(...), file: UploadFile = File(...), ):  # noqa: B008
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail=f"{user.email} is not authorized to create proofs")
    try:
        await create_new_proof(title, file)
    except Exception as e:  # noqa: BLE001
        print("[PROOF CREATION] Error creating proof:")
        print(f"[PROOF CREATION]\t{e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.get("/proofs", response_model=list[Proof])
def list_proofs(user: CurrentUser):
    files = get_all_files()
    if not files:
        return []
    resp: list[Proof] = []
    for file in files:
        can_edit = file.stage == user.username
        resp.append(Proof(id=file.filepath, stage=file.stage, title=file.title, can_edit=can_edit))
    return resp


@router.post("/proofs/{proof_id}/update")
async def handle_update_proof(user: CurrentUser, proof_id: str, proof_json: str = Form(...),
                              file: UploadFile = File(None), ):  # noqa: B008
    try:
        proof = Proof.model_validate_json(proof_json)
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=e.errors())
    if user.username != current_file_stage(proof_id):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="You are not authorized to edit this proof at this stage")
    next_stage = next_file_stage(proof_id)
    await write_file(file, proof_id)
    update_proof(proof_id=proof_id, notes=proof.notes or "", title=proof.title, stage=next_stage)


@router.get("/proofs/{proof_id}/download")
async def download_proof(proof_id: str, user: CurrentUser):
    location = file_path(proof_id)
    return FileResponse(
        path=location, filename=f"{proof_id}.pdf", media_type="application/pdf"
    )



@router.post("/proofs/{proof_id}")
async def upload_proof(
        proof_id: str, file: UploadFile = File(...), user: User = Depends(get_current_user)  # noqa: B008
):
    warnings.warn("No longer used. Use `handle_update_proof()` instead", DeprecationWarning,2)
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

@router.post("/proofs/{proof_id}/notes")
async def upload_notes(
        proof_id: str, file: UploadFile = File(...), user: User = Depends(get_current_user)  # noqa: B008
):
    # Only Ed can upload docx notes
    warnings.warn("Notes are now part of the database object", DeprecationWarning,2)
    if user.username != "ed" and user.role != "admin":
        raise HTTPException(status_code=403, detail="Only Ed can upload notes")

    save_docx(proof_id, file)
    return {"message": "Notes uploaded successfully"}

@router.get("/proofs/{proof_id}/txt")
async def download_txt(proof_id: str, user: User = Depends(get_current_user)):  # noqa: B008
    warnings.warn("Notes are now part of the database object", DeprecationWarning,2)
    path = find_txt(proof_id)
    if not path:
        raise HTTPException(status_code=404, detail="Plaintext notes not found")

    return FileResponse(
        path=path,
        filename=f"{proof_id}.txt",
        media_type="text/plain",
    )