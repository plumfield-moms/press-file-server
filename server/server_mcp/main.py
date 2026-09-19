from fastmcp import FastMCP
from server.database.db import get_all_files
from server.types import State

mcp = FastMCP("Plumfield Press File Server")

@mcp.tool(name="fetch_all_proof_states")
def fetch_all_state():
    proof_states = get_all_files()
    if not proof_states:
        return "No proofs found"
    rows = []
    for state in proof_states:
        rows.append(
            f"- Proof: {state.title}: {state.owner}"
        )
    return f"Current Proofs: {len(rows)}\n" + "\n".join(rows)

mcp_app = mcp.http_app()