from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional, Annotated

class State(BaseModel):
    filepath: str
    stage: str
    title: str

class Roles(Enum):
    USER = "user"
    ADMIN = "admin"

class User(BaseModel):
    email: str
    username: str
    role: str
    name: str | None = None



class CFHeaders(BaseModel):
    cf_email: str | None = Field(None, alias="cf-access-authenticated-user-email")
    x_email: str | None = Field(None, alias="x-user-email")

    @property
    def email(self) -> str | None:
        return self.cf_email or self.x_email

class Proof(BaseModel):
    id: str
    stage: str
    notes: str | None = None
    title: str
    can_edit: bool | None = None