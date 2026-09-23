from enum import Enum

from pydantic import BaseModel


class State(BaseModel):
    filepath: str
    stage: str
    title: str
    notes: str | None = None

class Roles(Enum):
    USER = "user"
    ADMIN = "admin"

class User(BaseModel):
    email: str
    username: str
    role: str
    name: str | None = None


class Proof(BaseModel):
    id: str
    stage: str
    notes: str | None = None
    title: str
    can_edit: bool | None = None