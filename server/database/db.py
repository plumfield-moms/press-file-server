import sqlite3
import warnings
from contextlib import contextmanager
from logging import warning
from pathlib import Path
from sqlite3 import Connection
from typing import Any, Generator

from server.types import State, User
from server.users import USERS

BASE_DIR = Path(__file__).resolve().parent.parent
USER_DB_PATH = Path(__file__).with_name("users.sqlite")
STATE_DB_PATH = Path(__file__).with_name("state.sqlite")

db_users = [(v["email"], k, v["role"]) for k, v in USERS.items()]




@contextmanager
def user_db_con() -> Generator[Connection, Any]:
    warnings.warn("This database is no longer used. Use the USERS object instead", DeprecationWarning,2)
    conn = sqlite3.connect(USER_DB_PATH)
    try:
        yield conn
        conn.commit()
    except:
        conn.rollback()
        raise
    finally:
        conn.close()

@contextmanager
def state_db_con() -> Generator[Connection, Any]:
    """Creates a managed connection to the state db

    :returns: A database connection
    :rtype: Generator[Connection, Any]

    """
    conn = sqlite3.connect(STATE_DB_PATH)
    try:
        yield conn
        conn.commit()
    except:
        conn.rollback()
        raise
    finally:
        conn.close()


def user_db_setup() -> None:
    warnings.warn("This database is no longer used. Use the USERS object instead",DeprecationWarning,2)
    with user_db_con() as conn:
        conn.execute(
            "CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, username TEXT, role TEXT);"
        )
        cursor = conn.cursor()
        cursor.executemany("INSERT OR REPLACE INTO users VALUES (?,?,?)", db_users)

def state_db_setup() -> None:
    """Initial Database setup"""
    with state_db_con() as conn:
        conn.execute(
            "CREATE TABLE IF NOT EXISTS state (filepath TEXT PRIMARY KEY, title TEXT, owner TEXT,notes TEXT);"
        )


# def get_user(email: str) -> User | None:
#     with user_db_con() as conn:
#         cursor = conn.cursor()
#         cursor.execute(
#             "SELECT email, username, role FROM users WHERE email = ?;", (email,)
#         )
#         user = cursor.fetchone()
#         # conn.close()
#         if user:
#             return User(email=user[0], username=user[1], role=user[2])
#         return None

def get_all_files() -> list[State] | None:
    """Lists all proofs in the database
    :returns: Returns a list of all proofs, or None if there aren't any
    :rtype: list[State] | None
    """
    with state_db_con() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT filepath, title, state, notes from state;")
        states = cursor.fetchall()
        if states:
            final = []
            for state in states:
                final.append(State(filepath=state[0], title=state[1], stage=state[2], notes=state[3]))
            return final
        return None

def get_file(proof_id: str)->State | None:
    """Gets the current state for a given proof
    :param proof_id: The proof ID to look up
    :type proof_id: str
    :returns: A state object for the proof, or None if it doesn't exist
    :rtype: State | None
    """

    with state_db_con() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT title, state, notes from state WHERE filepath= ?",(proof_id,))
        state = cursor.fetchone()
        if state:
            return State(title=state[0], stage=state[1], filepath=proof_id, notes=state[2])
        return None

def insert_file(proof_id: str, title: str, stage: str):
    """Adds a new proof to the state db

    :param proof_id: The UUID of the proof
    :type proof_id: str
    :param title: The title of the proof
    :type title: str
    :param stage: The stage of the current file
    :type stage: str
    """
    with state_db_con() as conn:
        cursor = conn.cursor()
        cursor.execute("INSERT OR IGNORE INTO state (filepath, title, state) VALUES (?,?,?);", (proof_id, title, stage))

def update_proof(proof_id: str, notes: str, title: str, stage: str):
    """Updates a proof in the state db

    :param proof_id: The UUID of the proof
    :type proof_id: str
    :param notes: Notes tied to the proof
    :type notes: str
    :param title: The title of the proof
    :type title: str
    :param stage: The current stage of the proof
    :type stage: str
    """
    with state_db_con() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
                       INSERT INTO state (filepath, title, notes, state)
                       VALUES (?, ?, ?, ?)
                       ON CONFLICT(filepath) DO UPDATE SET
                                                           title = excluded.title,
                                                           notes = excluded.notes,
                                                           state = excluded.state;
                       """,
            (proof_id, title, notes, stage),
        )