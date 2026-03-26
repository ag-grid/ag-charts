---
root: false
targets: ['*']
description: 'Docker usage patterns for AG Charts examples and SSR'
globs: ['**/.docker/**', '**/Dockerfile', '**/docker-compose*']
---

# Docker Guide

## Signal Handling with Nx

Nx `run-commands` converts all received signals (SIGINT, SIGTERM, SIGHUP) to SIGTERM when forwarding to child processes. Bash defers trap execution while a foreground process is running. This combination means cleanup traps never fire for long-running `docker run` commands.

**Pattern**: run `docker run` in the background and use `wait` so the trap fires immediately:

```bash
container_name="my-container-$$"
cleanup() {
    docker rm -f "${container_name}" > /dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

docker run --rm --name "${container_name}" ... &
wait $! || true
```

-   The `wait` builtin returns immediately when a trapped signal arrives, unlike waiting on a foreground process.
-   `|| true` prevents `set -e` from exiting before the trap runs.
-   Named containers allow `docker rm -f` to target the correct container.
-   Known Nx issue: nrwl/nx#23585.
