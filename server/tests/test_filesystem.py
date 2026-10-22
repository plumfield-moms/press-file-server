import importlib
from pathlib import Path

from pytest import MonkeyPatch


def test_local_vault_path(monkeypatch: MonkeyPatch):

    monkeypatch.setenv("ENV", "localhost")
    from server.filesystem.shared import VAULT

    assert VAULT == Path(__file__).parent.parent.parent / "vault"


def test_prod_vault_path(monkeypatch: MonkeyPatch):
    monkeypatch.delenv("ENV", raising=False)
    from server.filesystem import shared

    importlib.reload(shared)

    assert shared.VAULT == Path("/Volumes/Plumfield/.press-file-server/vault")
