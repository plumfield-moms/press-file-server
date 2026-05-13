from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from server.types import CFHeaders
from server.database.db import get_user

router = APIRouter(prefix="/api")


@router.get("/me")
def me(headers: CFHeaders):
    user = get_user(email=headers.x_user_email)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return user


@router.get("/upload")
def upload(
    headers: CFHeaders,
    filename: str = Form(...),
    file: UploadFile = File(...),
):
    pass
