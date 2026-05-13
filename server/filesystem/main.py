from dataclasses import dataclass
from fastapi import UploadFile
from server.main import PROOFS_DIR
from pathlib import Path
import shutil


@dataclass(frozen=True)
class Step:
    next_step: str | None
    user: str


ADMINS = {"michael"}


WORKFLOW = {
    "ed": Step("diane", "ed"),
    "diane": Step("kristi", "diane"),
    "kristi": Step("sara", "kristi"),
    "sara": Step("diane_2", "sara"),
    "diane_2": Step(None, "diane"),
}


def get_next_step(step: str) -> str | None:
    return WORKFLOW[step].next_step


def allowed_users(step: str) -> set[str]:
    return {WORKFLOW[step].user, *ADMINS}


def update_file(filename: str, current_step: str, file: UploadFile):

    if not PROOFS_DIR:

        raise Exception("Missing Proofs Dir var")

    next_step = get_next_step(current_step)

    # If workflow is complete

    if not next_step:

        final_path = Path(PROOFS_DIR) / "done" / filename

        with final_path.open("wb") as buffer:

            shutil.copyfileobj(file.file, buffer)

        return

    # Normalize filename (important)

    safe_name = Path(filename).name

    dest = Path(PROOFS_DIR) / next_step / safe_name

    # Ensure folder exists

    dest.parent.mkdir(parents=True, exist_ok=True)

    # Write file

    with dest.open("wb") as buffer:

        shutil.copyfileobj(file.file, buffer)
