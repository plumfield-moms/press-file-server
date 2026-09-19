import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

from dotenv import load_dotenv

from server.types import User, State

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
USER_DB_PATH = Path(__file__).with_name("users.sqlite")
STATE_DB_PATH = Path(__file__).with_name("state.sqlite")
if USER_DB_PATH.exists():
    USER_DB_PATH.unlink()
ED_EMAIL = os.getenv("ED_EMAIL")
DIANE_EMAIL = os.getenv("DIANE_EMAIL")
SARA_EMAIL = os.getenv("SARA_EMAIL")
missing_emails = []
if ED_EMAIL == None:
    missing_emails.append("Ed")
if DIANE_EMAIL == None:
    missing_emails.append("Diane")
if SARA_EMAIL == None:
    missing_emails.append("Sara")
if len(missing_emails) > 0:
    print(
        f"[DATABASE] ERROR: the following users are missing from the user database:\n{missing_emails}"
    )

MICHAEL_EMAIL = "masarikfamilymichael@gmail.com"
USERS = [
    (ED_EMAIL, "ed", "user"),
    (DIANE_EMAIL, "diane", "user"),
    (SARA_EMAIL, "sara", "user"),
    (MICHAEL_EMAIL, "michael", "admin"),
    ("tarpfarmer@gmail.com", "kristi", "user"),
]


@contextmanager
def user_db_con():
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
def state_db_con():
    conn = sqlite3.connect(STATE_DB_PATH)
    try:
        yield conn
        conn.commit()
    except:
        conn.rollback()
        raise
    finally:
        conn.close()


def user_db_setup():
    with user_db_con() as conn:
        conn.execute(
            "CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, username TEXT, role TEXT);"
        )
        cursor = conn.cursor()
        cursor.executemany("INSERT OR REPLACE INTO users VALUES (?,?,?)", USERS)

def state_db_setup():
    with user_db_con() as conn:
        conn.execute(
            "CREATE TABLE IF NOT EXISTS state (filepath TEXT PRIMARY KEY, title TEXT, owner TEXT);"
        )


def get_user(email: str) -> User | None:
    with user_db_con() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT email, username, role FROM users WHERE email = ?", (email,)
        )
        user = cursor.fetchone()
        # conn.close()
        if user:
            return User(email=user[0], username=user[1], role=user[2])
        return None

def get_all_files():
    with state_db_con() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT filepath, title, owner from state")
        states = cursor.fetchall()
        if states:
            final = []
            for state in states:
                final.append(State(filepath=state[0], title=state[1], owner=state[2]))
            return final
        return None