from pydantic import BaseModel
from enum import Enum


class Roles(Enum):
    USER = "user"
    ADMIN = "admin"


class User(BaseModel):
    email: str
    username: str
    role: Roles


class CFHeaders(BaseModel):
    cf_access_authenticated_user_mail: str
    x_user_email: str
