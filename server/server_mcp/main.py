from typing import Literal

from fastmcp import FastMCP
from server.database.db import get_all_files
from server.types import State

mcp = FastMCP("Plumfield Press File Server")

@mcp.tool(name="fetch_all_proof_states")
def fetch_all_state()-> Literal["No proofs found"] | str:
    proof_states = get_all_files()
    if not proof_states:
        return "No proofs found"
    rows = []
    for state in proof_states:
        rows.append(
            f"- Proof: {state.title}: {state.stage}"
        )
    return f"Current Proofs: {len(rows)}\n" + "\n".join(rows)

mcp_app = mcp.http_app()