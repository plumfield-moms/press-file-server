from pathlib import Path
import os
import sqlite3
from server.types import User
from functools import wraps
from contextlib import contextmanager

DB_PATH = Path(__file__).with_name("users.sqlite")
if DB_PATH.exists():
    DB_PATH.unlink()
ED_EMAIL = os.getenv("ED_EMAIL")
DIANE_EMAIL = os.getenv("DIANE_EMAIL")
SARA_EMAIL = os.getenv("SARA_EMAIL")
MICHAEL_EMAIL = "masarikfamilymichael@gmail.com"
USERS = [
    (ED_EMAIL, "ed", "user"),
    (DIANE_EMAIL, "diane", "user"),
    (SARA_EMAIL, "sara", "user"),
    (MICHAEL_EMAIL, "michael", "admin"),
]


@contextmanager
def db_conn():
    conn = sqlite3.connect(DB_PATH)
    try:
        yield conn
        conn.commit()
    except:
        conn.rollback()
        raise
    finally:
        conn.close()


def db_setup():
    with db_conn() as conn:
        conn.execute(
            "CREATE TABLE users IF NOT EXISTS(email PRIMARY KEY, username TEXT, role TEXT);"
        )
        cursor = conn.cursor()
        cursor.executemany("REPLACE INTO users VALUES (?,?,?)", USERS)
        conn.commit()
        conn.close()


def get_user(email: str) -> User | None:
    with db_conn() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT email, username, role FROM users WHERE email = ?", (email,)
        )
        user = cursor.fetchone()
        conn.close()
        if user:
            return User(email=user[0], username=user[1], role=user[2])
