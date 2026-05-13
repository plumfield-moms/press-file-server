from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional

class Roles(Enum):
    USER = "user"
    ADMIN = "admin"

class User(BaseModel):
    email: str
    username: str
    role: str 

class CFHeaders(BaseModel):
    cf_email: Optional[str] = Field(None, alias="cf-access-authenticated-user-email")
    x_email: Optional[str] = Field(None, alias="x-user-email")

    @property
    def email(self) -> str | None:
        return self.cf_email or self.x_email

class Proof(BaseModel):
    id: str
    stage: str
    can_upload: bool = False
    can_download: bool = False
