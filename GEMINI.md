# Plumfield Press Foundational Mandates

This document contains the core architectural and design rules for the Plumfield Press Review System. These mandates take absolute precedence over any other instructions.

## 1. Filesystem-Driven Workflow (STRICT)

The system is strictly driven by the presence of files in the `/proofs` directory.

### Workflow Stages
1.  **Admin (Manual):** Places `{id}.pdf`. This is the ONLY way a proof is created.
2.  **Ed:** Downloads `{id}.pdf`, uploads revised file saved as `{id}.ed.pdf`.
3.  **Diane:** Downloads `{id}.ed.pdf`, uploads revised file saved as `{id}.diane.pdf`.
4.  **Sara:** Downloads `{id}.diane.pdf`, uploads revised file saved as `{id}.sara.pdf`.
5.  **Kristi (tarpfarmer):** Downloads `{id}.sara.pdf`, uploads revised file saved as `{id}.kristi.pdf`.
6.  **Diane (2nd Pass):** Downloads `{id}.kristi.pdf`, uploads revised file saved as `{id}.done.pdf`.

### Critical Rules
- **Final File:** Diane produces the final `{id}.done.pdf` during her 2nd pass.
- **Discovery:** New proofs are detected ONLY from `{id}.pdf` files. Draft files (`{id}.ed.draft.pdf`) and revision files are explicitly ignored.
- **Stage Derivation:** 
    - `{id}.done.pdf` exists → stage = "done"
    - `{id}.kristi.pdf` exists → stage = "diane-2"
    - `{id}.sara.pdf` exists → stage = "kristi"
    - `{id}.diane.pdf` exists → stage = "sara"
    - `{id}.ed.pdf` exists → stage = "diane"
    - Otherwise → stage = "ed"
- **SQLite Role:** Stores ONLY metadata (`id`, `book_title`, timestamps). It must NOT store the current stage or file state.
- **Resets:** Deleting a file (e.g., `{id}.done.pdf`) must automatically revert the stage in the UI without database changes.

## 2. Design System

All UI components must adhere to these aesthetic rules:

### Visual Identity
- **Background:** `#f9ddab` (Paper)
- **Primary Accent:** `#77183c` (Plum Red)
- **Secondary Accent:** `#9e2a56` (Plum Light)
- **Typography:**
    - **Headers:** `Playfair Display` (Serif)
    - **Body:** `Assistant` (Sans)

### Implementation
- Use Tailwind CSS v4 variables (e.g., `bg-paper`, `text-plum`, `font-serif`).
- Maintain a "literary" feel with high-contrast serif headers and clean sans-serif body text.
