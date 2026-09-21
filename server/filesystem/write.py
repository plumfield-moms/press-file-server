import anyio
from fastapi import (
    HTTPException,
    UploadFile,
    status,
)

from server.filesystem.constants import PROOF_DIR


async def write_file(file: UploadFile, file_id: str) -> None:
    try:
        async with await anyio.open_file(PROOF_DIR.joinpath(f"{file_id}.pdf"), "ab") as f:
            while chunk := await file.read(1024 * 1024):
                await f.write(chunk)
    except Exception as e:  # noqa: BLE001
        print(f"[WRITE FILE] ERROR: unable to write file. {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to write file")