from fastapi import HTTPException, status

from server.filesystem.constants import PROOF_DIR


def file_path(proof_id: str):
    path = PROOF_DIR / f"{proof_id}.pdf"
    if path.is_file():
        return path
    else:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"File {proof_id}.pdf does not exist")