# Plumfield Press Proof Review System

A local-first, two-person editorial workflow system for book manuscripts.

## Project Structure

- `/server`: Node.js + Express + Better-SQLite3
- `/client`: React + TypeScript + Vite + Tailwind + React Query
- `/proofs`: Local storage for PDFs and SQLite database

## Setup

1. **Install dependencies:**
   ```bash
   pnpm run install-all
   ```

2. **Run the system:**
   ```bash
   pnpm run dev
   ```

3. **Access the app:**
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:3001](http://localhost:3001)

## Workflow

1. **Upload**: Create a new proof by uploading the original manuscript.
2. **Ed's Review**: Ed claims the proof, uploads an edited version. Stage moves to `diane`.
3. **Diane's Review**: Diane claims the proof, uploads her version. Stage moves to `done`.
4. **Finalization**: The system automatically creates a `.done.pdf` version upon Diane's final upload.

## Security

In production, Cloudflare Zero Trust handles authentication and passes the identity via the `x-user` header. For local development, use the "Switch User" feature in the UI to simulate `ed` or `diane`.

## Constraints Followed

- Simple flat directory storage in `/proofs`.
- No versioning or complex file trees.
- Single SQLite table for state.
- Header-based user identification.
- No Redux or heavy abstractions.
