import sqlite3
import os
from pathlib import Path
from contextlib import contextmanager

DB_PATH = Path(os.getenv("NOTIFICATIONS_DB", "notifications.sqlite"))

@contextmanager
def db_conn():
    conn = sqlite3.connect(DB_PATH)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_notifications_db():
    """Ensure the notifications table exists."""
    with db_conn() as conn:
        conn.execute(
            "CREATE TABLE IF NOT EXISTS ed_notifications (proof_id TEXT PRIMARY KEY, notified INTEGER DEFAULT 0);"
        )

def is_ed_notified(proof_id: str) -> bool:
    with db_conn() as conn:
        res = conn.execute("SELECT notified FROM ed_notifications WHERE proof_id = ?", (proof_id,)).fetchone()
        return bool(res[0]) if res else False

def mark_ed_notified(proof_id: str):
    with db_conn() as conn:
        conn.execute("INSERT OR REPLACE INTO ed_notifications (proof_id, notified) VALUES (?, 1)", (proof_id,))
