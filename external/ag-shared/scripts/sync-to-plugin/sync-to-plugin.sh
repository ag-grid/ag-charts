#!/bin/bash
# sync-to-plugin.sh — Sync ag-shared/prompts/ → ag-dev-prompts plugin repo
#
# Extracts the prompts/ subdirectory from the ag-shared repo with full commit
# history using git filter-repo, then pushes to the ag-dev-prompts plugin repo.
#
# git filter-repo --subdirectory-filter produces deterministic output: the same
# input commits always produce the same filtered SHAs. This means subsequent
# runs only add new commits and git push works as a fast-forward — no force
# needed unless the source history has been rebased.
#
# Prerequisites:
#   - git-filter-repo installed (brew install git-filter-repo)
#   - Push access to the plugin repo
#
# Usage:
#   sync-to-plugin.sh                              # Sync to default remote
#   sync-to-plugin.sh --dry-run                    # Show what would be pushed
#   sync-to-plugin.sh --force                      # Force-push (if source rebased)
#   sync-to-plugin.sh --branch b13.2.0             # Sync a specific branch
#   AG_PLUGIN_REMOTE=<url> sync-to-plugin.sh       # Override remote URL
#   AG_SHARED_REMOTE=<url> sync-to-plugin.sh       # Override source URL

set -euo pipefail

# --- Configuration -----------------------------------------------------------

REMOTE_URL="${AG_PLUGIN_REMOTE:-git@github.com:ag-grid/ag-dev-prompts.git}"
SOURCE_URL="${AG_SHARED_REMOTE:-https://github.com/ag-grid/ag-shared.git}"
BRANCH="${AG_PLUGIN_BRANCH:-latest}"
DRY_RUN=false
FORCE=false

# --- Argument parsing ---------------------------------------------------------

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --branch)
            BRANCH="$2"
            shift 2
            ;;
        --help|-h)
            sed -n '2,/^[^#]/s/^# \{0,\}//p' "$0"
            exit 0
            ;;
        *)
            echo "Unknown option: $1 (use --help for usage)"
            exit 1
            ;;
    esac
done

# --- Preflight checks --------------------------------------------------------

if ! command -v git-filter-repo &>/dev/null; then
    echo "ERROR: git-filter-repo is not installed."
    echo "Install with: brew install git-filter-repo"
    exit 1
fi

# --- Work directory -----------------------------------------------------------

WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

echo "=== Syncing ag-shared/prompts/ → ag-dev-prompts ==="
echo "Source:  $SOURCE_URL (branch: $BRANCH)"
echo "Target:  $REMOTE_URL (branch: $BRANCH)"
echo ""

# --- Step 1: Clone ag-shared -------------------------------------------------

echo "Cloning ag-shared ($BRANCH)..."
git clone --single-branch --branch "$BRANCH" "$SOURCE_URL" "$WORK_DIR/ag-shared" --quiet
cd "$WORK_DIR/ag-shared"
SOURCE_HEAD=$(git rev-parse HEAD)
SOURCE_SHORT=$(git rev-parse --short HEAD)
echo "Source HEAD: $SOURCE_SHORT ($(git log -1 --format='%s' HEAD))"

# --- Step 2: Extract prompts/ with full history -------------------------------

echo "Extracting prompts/ with git filter-repo..."
git filter-repo --subdirectory-filter prompts/ --force --quiet 2>&1

FILTERED_HEAD=$(git rev-parse HEAD)
FILTERED_SHORT=$(git rev-parse --short HEAD)
COMMIT_COUNT=$(git rev-list --count HEAD)
echo "Extracted $COMMIT_COUNT commits (filtered HEAD: $FILTERED_SHORT)"

# --- Step 3: Validate plugin structure ----------------------------------------

if [ -f .claude-plugin/plugin.json ]; then
    PLUGIN_VERSION=$(python3 -c "import json; print(json.load(open('.claude-plugin/plugin.json'))['version'])" 2>/dev/null || echo "unknown")
    echo "Plugin structure present (v$PLUGIN_VERSION) ✓"
else
    echo "WARNING: .claude-plugin/plugin.json not found"
    echo "  Plugin validation will fail until infrastructure files are added to ag-shared/prompts/"
fi

# --- Step 4: Push to plugin repo ---------------------------------------------

git remote add plugin "$REMOTE_URL"

if $DRY_RUN; then
    echo ""
    echo "--- DRY RUN ---"
    echo "Would push $COMMIT_COUNT commits to $REMOTE_URL ($BRANCH)"
    echo ""
    echo "Recent commits:"
    git log --oneline -10
    if [ "$COMMIT_COUNT" -gt 10 ]; then
        echo "... and $((COMMIT_COUNT - 10)) more"
    fi
    exit 0
fi

PUSH_ARGS=("plugin" "HEAD:$BRANCH")
if $FORCE; then
    PUSH_ARGS=("--force" "${PUSH_ARGS[@]}")
    echo "Force-pushing to $REMOTE_URL..."
else
    echo "Pushing to $REMOTE_URL..."
fi

if git push "${PUSH_ARGS[@]}" 2>&1; then
    echo ""
    echo "✓ Sync complete."
    echo "  Source:  ag-shared $SOURCE_SHORT"
    echo "  Plugin:  ag-dev-prompts $FILTERED_SHORT"
    echo "  Commits: $COMMIT_COUNT"
else
    echo ""
    echo "✗ Push failed."
    echo ""
    echo "  If ag-shared history was rebased, re-run with --force:"
    echo "    $0 --force"
    echo ""
    echo "  If the plugin repo doesn't exist yet, create it on GitHub first:"
    echo "    gh repo create ag-grid/ag-dev-prompts --private"
    exit 1
fi
