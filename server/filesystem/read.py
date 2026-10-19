from fastapi import HTTPException, status

from server.filesystem.shared import PROOF_DIR, VAULT


def file_path(proof_id: str):
    path = PROOF_DIR / f"{proof_id}.pdf"
    if path.is_file():
        return path
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File {proof_id}.pdf does not exist",
        )


def store_path(store_id: str):
    path = VAULT / f"{store_id}.pdf"
    if path.is_file():
        return path
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File {store_id}.pdf does not exist",
        )
