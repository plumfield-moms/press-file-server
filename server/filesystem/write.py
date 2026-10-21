import os

import anyio
from fastapi import (
    HTTPException,
    UploadFile,
    status,
)

from server.filesystem.shared import PROOF_DIR, VAULT


async def write_file(file: UploadFile, file_id: str) -> None:
    tmp = PROOF_DIR.joinpath(f"{file_id}.tmp.pdf")
    try:
        async with await anyio.open_file(tmp, "wb") as f:
            while chunk := await file.read(1024 * 1024):
                await f.write(chunk)
        os.replace(tmp, PROOF_DIR.joinpath(f"{file_id}.pdf"))
    except Exception as e:
        tmp.unlink(missing_ok=True)
        print(f"[WRITE FILE] ERROR: unable to write file. {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to write file",
        )


async def write_store(file: UploadFile, store_id: str):
    tmp = VAULT.joinpath(f"{store_id}.tmp.pdf")
    try:
        async with await anyio.open_file(tmp, "wb") as f:
            while chunk := await file.read(1024 * 1024):
                await f.write(chunk)
        os.replace(tmp, VAULT.joinpath(f"{store_id}.pdf"))
    except Exception as e:
        tmp.unlink(missing_ok=True)
        print(f"[WRITE FILE] ERROR: unable to write file. {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to write file",
        )
