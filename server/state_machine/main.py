import uuid
from pathlib import Path

from fastapi import UploadFile

from server.database.db import get_file, insert_file
from server.filesystem.write import write_file

PROOFS_DIR = Path(__file__).parent.parent / "proofs"

ORDER = ["kristi", "ed", "diane", "sara", "greta", "done"]


def get_next_stage(current: str) -> str:
    """Returns the next stage for a given stage

    :param current: the current stage of the file
    :type current: str
    :returns: the next stage based on the current stage
    :rtype: str

    """
    if current not in ORDER:
        raise ValueError(f"{current} is not a valid stage")
    if current == "done":
        return "done"
    current_index = ORDER.index(current)
    return ORDER[current_index + 1]


def next_file_stage(proof_id: str) -> str:
    """Returns the next stage for a given file id

    :param proof_id: the UUID of the file
    :type proof_id: str
    :returns:  the next stage of for the file
    :rtype: str
    :raises ValueError: Returns a value error if the file is not registered in the database

    """
    state = get_file(proof_id)
    if state:
        return get_next_stage(state.stage)
    raise ValueError(f"{proof_id} is not a proof registered in the database")


def current_file_stage(proof_id: str) -> str:
    """Returns the current stage for a given file id

    :param  proof_id: the UUID of the file
    :type proof_id: str
    :returns: the current stage of the file
    :rtype: str
    :raises ValueError: Returns a value error if the file is not registered in the database

    """
    state = get_file(proof_id)
    if state:
        return state.stage
    raise ValueError(f"{proof_id} is not a proof registered in the database")


async def create_new_proof(title: str, file: UploadFile):
    """Creates and Registers a new proof in the system

    :param title: The title of the book
    :type title: str
    :param file: the FastAPI file object
    :type file: UploadFile
    :returns: None
    """
    FILE_ID = str(uuid.uuid4())
    insert_file(FILE_ID, title, ORDER[0])
    await write_file(file, FILE_ID)