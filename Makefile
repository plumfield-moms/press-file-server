
export:
	uv export --format requirements-txt -o requirements.txt --no-hashes
dev:
	trap 'kill 0; wait' INT TERM EXIT; \
	uv run python -m server.main & \
	(cd client && pnpm dev) & \
	wait