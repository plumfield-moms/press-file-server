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

1. **Admin (Manual)**: Places `{id}.pdf` in the `/proofs` directory.
2. **Ed's Review**: Ed downloads the manuscript and uploads `{id}.ed.pdf`. Stage moves to `diane`.
3. **Diane's Review**: Diane downloads Ed's version and uploads `{id}.diane.pdf`. Stage moves to `sara`.
4. **Sara's Review**: Sara downloads Diane's version and uploads `{id}.done.pdf`. Stage moves to `done`.

## Security

In production, Cloudflare Zero Trust handles authentication and passes the identity via the `cf-access-authenticated-user-email` header. The system maps authorized emails to specific internal roles (ed, diane, sara).

## Constraints Followed

- Simple flat directory storage in `/proofs`.
- No versioning or complex file trees.
- Single SQLite table for state.
- Header-based user identification.
- No Redux or heavy abstractions.
