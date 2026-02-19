#!/bin/bash

set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
STAGING_DIR="${SCRIPT_DIR}/.staging"

# Parse arguments
mode="${1:-basic}"
skip_build=false
shift || true

while [[ $# -gt 0 ]]; do
    case "$1" in
        --skip-build) skip_build=true; shift ;;
        *) echo "Unknown option: $1" >&2; exit 1 ;;
    esac
done

# Validate mode
case "${mode}" in
    basic|jpeg|server) ;;
    *) echo "Invalid mode: ${mode}. Use: basic, jpeg, server" >&2; exit 1 ;;
esac

# Required tarballs
packages=(
    ag-charts-types
    ag-charts-locale
    ag-charts-core
    ag-charts-community
    ag-charts-enterprise
    ag-charts-server-side
)

# Verify all tarballs exist
echo ">>> Checking tarballs..."
for pkg in "${packages[@]}"; do
    tgz="${REPO_ROOT}/dist/packages/${pkg}.tgz"
    if [[ ! -f "${tgz}" ]]; then
        echo "Missing tarball: ${tgz}" >&2
        echo "Run: yarn nx pack ${pkg}" >&2
        exit 1
    fi
done

# Assemble staging directory
echo ">>> Assembling staging directory..."
rm -rf "${STAGING_DIR}"
mkdir -p "${STAGING_DIR}/packages"

# Copy tarballs
for pkg in "${packages[@]}"; do
    cp "${REPO_ROOT}/dist/packages/${pkg}.tgz" "${STAGING_DIR}/packages/"
done

# Generate package.json with file: tarball references
cat > "${STAGING_DIR}/package.json" <<'PACKAGE_EOF'
{
  "name": "ag-charts-server-side-example-docker",
  "private": true,
  "type": "module",
  "dependencies": {
    "ag-charts-types": "file:./packages/ag-charts-types.tgz",
    "ag-charts-locale": "file:./packages/ag-charts-locale.tgz",
    "ag-charts-core": "file:./packages/ag-charts-core.tgz",
    "ag-charts-community": "file:./packages/ag-charts-community.tgz",
    "ag-charts-enterprise": "file:./packages/ag-charts-enterprise.tgz",
    "ag-charts-server-side": "file:./packages/ag-charts-server-side.tgz",
    "express": "^4.21.0"
  },
  "devDependencies": {
    "tsx": "^4.0.0",
    "@types/express": "^4.17.0",
    "@types/node": "^22.0.0",
    "typescript": "~5.6.0"
  }
}
PACKAGE_EOF

# Copy example sources, tsconfig, and Dockerfile
cp -R "${SCRIPT_DIR}/../examples" "${STAGING_DIR}/examples"
cp "${SCRIPT_DIR}/../tsconfig.json" "${STAGING_DIR}/tsconfig.json"
cp "${SCRIPT_DIR}/Dockerfile" "${STAGING_DIR}/Dockerfile"

# Ensure output directory exists on host for volume mount
mkdir -p "${SCRIPT_DIR}/../output"

# Build Docker image
echo ">>> Building Docker image..."
docker build -t ag-charts-ssr-example "${STAGING_DIR}"

# Select command and run options based on mode
case "${mode}" in
    basic)
        echo ">>> Running basic render..."
        docker run --rm \
            -v "${SCRIPT_DIR}/../output:/app/output" \
            ag-charts-ssr-example \
            npx tsx examples/01-basic-render.ts
        ;;
    jpeg)
        echo ">>> Running JPEG render..."
        docker run --rm \
            -v "${SCRIPT_DIR}/../output:/app/output" \
            ag-charts-ssr-example \
            npx tsx examples/02-jpeg-output.ts
        ;;
    server)
        container_name="ag-charts-ssr-server-$$"
        cleanup() {
            echo ""
            echo ">>> Stopping container..."
            docker rm -f "${container_name}" > /dev/null 2>&1 || true
        }
        trap cleanup EXIT INT TERM

        echo ">>> Starting Express server on port 3000..."
        # Run in background + wait so that bash can handle signals immediately.
        # Bash defers trap execution while a foreground process is running, but
        # the `wait` builtin returns as soon as a trapped signal arrives,
        # allowing the cleanup handler to fire and remove the container.
        docker run --rm \
            --name "${container_name}" \
            -v "${SCRIPT_DIR}/../output:/app/output" \
            -p 3000:3000 \
            ag-charts-ssr-example \
            npx tsx examples/03-express-server.ts &
        wait $! || true
        ;;
esac
