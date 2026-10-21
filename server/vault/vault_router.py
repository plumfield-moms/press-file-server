from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from server.database.db import insert_vault_store, list_vault_stores, update_vault_store
from server.filesystem.write import write_store
from server.users import CurrentUser

router = APIRouter(
    prefix="/vault",
)


@router.post("/new")
async def create_new_store(
    user: CurrentUser,
    title: str = Form(...),
    file: UploadFile = File(...),
):
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"{user.email} is not authorized to create proofs",
        )
    storeId = str(uuid4())
    try:
        await write_store(file, storeId)
        insert_vault_store(storeId, title)
    except Exception as e:
        print("[STORE CREATION] Error creating store:")
        print(f"[STRORE CREATION]\t{e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.get("/list")
def list_all_stores(user: CurrentUser):
    return list_vault_stores()


@router.post("/{store_id}/update")
async def update_store(
    store_id: str,
    user: CurrentUser,
    title: str = Form(...),
    file: UploadFile = File(...),
):
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"{user.email} is not authorized to create proofs",
        )

    try:
        await write_store(file, store_id)
        update_vault_store(store_id)
    except Exception as e:
        print("[STORE CREATION] Error creating store:")
        print(f"[STRORE CREATION]\t{e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
