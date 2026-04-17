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
# Direct commits (e.g. product-specific content) can be added to ag-dev-prompts
# independently. These are rebased on top of the synced history automatically.
# Direct commits are identified by not having a matching SHA in the filtered
# ag-shared output. The sync tag "ag-shared-sync" tracks the last synced point.
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
SYNC_TAG="ag-shared-sync"
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

# --- Step 1: Clone ag-shared and extract prompts/ ----------------------------

echo "Cloning ag-shared ($BRANCH)..."
git clone --single-branch --branch "$BRANCH" "$SOURCE_URL" "$WORK_DIR/ag-shared" --quiet
cd "$WORK_DIR/ag-shared"
SOURCE_HEAD=$(git rev-parse HEAD)
SOURCE_SHORT=$(git rev-parse --short HEAD)
echo "Source HEAD: $SOURCE_SHORT ($(git log -1 --format='%s' HEAD))"

echo "Extracting prompts/ with git filter-repo..."
git filter-repo --subdirectory-filter prompts/ --force --quiet 2>&1

# Remove files that are delivered via project settings, not the plugin.
# These exist in ag-shared/prompts/ for the rulesync system but would conflict
# or be redundant when loaded as a plugin alongside the project config.
EXCLUDE_FILES=(.mcp.json .claude-settings.json .cursor-worktrees.json hooks)
EXCLUDED=()
for f in "${EXCLUDE_FILES[@]}"; do
    if [ -e "$f" ]; then
        git rm -rf --quiet "$f"
        EXCLUDED+=("$f")
    fi
done
if [ ${#EXCLUDED[@]} -gt 0 ]; then
    git commit --quiet -m "Exclude project-level config from plugin: ${EXCLUDED[*]}"
fi

# Reorganise into the multi-plugin layout based on
# .claude-plugin/plugin-assignments.json: each skill/agent/command/guide is
# moved into plugins/<name>/ and per-plugin plugin.json files are generated.
if [ -f .claude-plugin/plugin-assignments.json ]; then
    echo "Reorganising into multi-plugin layout..."
    SCRIPT_DIR="$(dirname "$(realpath "$0" 2>/dev/null || echo "$0")")"
    python3 "$SCRIPT_DIR/reorganize-to-plugins.py" --root .
    if [ -n "$(git status --porcelain)" ]; then
        git commit --quiet -m "Reorganise into multi-plugin layout"
    fi
else
    echo "WARNING: plugin-assignments.json not found — skipping multi-plugin reorganisation"
fi

FILTERED_HEAD=$(git rev-parse HEAD)
FILTERED_SHORT=$(git rev-parse --short HEAD)
FILTERED_COUNT=$(git rev-list --count HEAD)
echo "Extracted $FILTERED_COUNT commits (filtered HEAD: $FILTERED_SHORT)"

# Report plugin structure — count per-plugin manifests under plugins/
PLUGIN_COUNT=$(find plugins -maxdepth 3 -name plugin.json 2>/dev/null | wc -l | tr -d ' ')
MARKETPLACE_VERSION=$(python3 -c "import json; print(json.load(open('.claude-plugin/plugin-assignments.json'))['version'])" 2>/dev/null || echo "unknown")
if [ "$PLUGIN_COUNT" -gt 0 ]; then
    echo "Plugin structure: $PLUGIN_COUNT plugins (v$MARKETPLACE_VERSION) ✓"
else
    echo "WARNING: no per-plugin plugin.json files found"
fi

# --- Step 2: Clone plugin repo and detect direct commits --------------------

echo ""
echo "Fetching plugin repo..."
git clone "$REMOTE_URL" "$WORK_DIR/plugin" --quiet 2>/dev/null || {
    # Fresh repo — no direct commits to rebase
    echo "Plugin repo is empty — initial push."
    cd "$WORK_DIR/ag-shared"
    git remote add plugin "$REMOTE_URL"
    if $DRY_RUN; then
        echo "DRY RUN — would push $FILTERED_COUNT commits"
        exit 0
    fi
    git tag "$SYNC_TAG"
    git push plugin HEAD:"$BRANCH" --tags 2>&1
    echo "✓ Initial sync complete. $FILTERED_COUNT commits."
    exit 0
}

cd "$WORK_DIR/plugin"

# Find direct commits: everything after the sync tag (if it exists)
DIRECT_COMMITS=()
if git rev-parse "$SYNC_TAG" &>/dev/null; then
    SYNC_BASE=$(git rev-parse "$SYNC_TAG")
    PLUGIN_HEAD=$(git rev-parse HEAD)
    if [ "$SYNC_BASE" != "$PLUGIN_HEAD" ]; then
        # Collect direct commit SHAs (oldest first) between sync tag and HEAD
        DIRECT_COMMITS=()
        while IFS= read -r c; do DIRECT_COMMITS+=("$c"); done < <(git rev-list --reverse "${SYNC_TAG}..HEAD")
        echo "Found ${#DIRECT_COMMITS[@]} direct commit(s) to rebase"
    else
        echo "No direct commits (HEAD matches sync tag)"
    fi
else
    # No sync tag — treat all plugin commits as potentially direct
    # Check if the filtered HEAD exists in the plugin repo
    if git merge-base --is-ancestor "$FILTERED_HEAD" HEAD 2>/dev/null; then
        # Filtered HEAD is an ancestor — everything after it is direct
        DIRECT_COMMITS=()
        while IFS= read -r c; do DIRECT_COMMITS+=("$c"); done < <(git rev-list --reverse "${FILTERED_HEAD}..HEAD")
        echo "Found ${#DIRECT_COMMITS[@]} direct commit(s) (no sync tag, inferred from history)"
    else
        echo "No sync tag and histories diverge — will force-sync"
        DIRECT_COMMITS=()
    fi
fi

# --- Step 3: Dry run output --------------------------------------------------

if $DRY_RUN; then
    echo ""
    echo "--- DRY RUN ---"
    echo "Synced commits:  $FILTERED_COUNT (from ag-shared)"
    echo "Direct commits:  ${#DIRECT_COMMITS[@]} (to rebase on top)"
    echo ""
    echo "Recent synced:"
    git -C "$WORK_DIR/ag-shared" log --oneline -5
    if [ ${#DIRECT_COMMITS[@]} -gt 0 ]; then
        echo ""
        echo "Direct commits to rebase:"
        for sha in "${DIRECT_COMMITS[@]}"; do
            git log --oneline -1 "$sha"
        done
    fi
    exit 0
fi

# --- Step 4: Rebase direct commits on filtered history -----------------------

cd "$WORK_DIR/ag-shared"
git remote add plugin "$REMOTE_URL"

if [ ${#DIRECT_COMMITS[@]} -gt 0 ]; then
    echo ""
    echo "Rebasing ${#DIRECT_COMMITS[@]} direct commit(s) on top of synced history..."

    # Fetch the plugin repo's direct commits into the filtered repo
    git fetch plugin "$BRANCH" --quiet

    # Cherry-pick direct commits onto filtered HEAD
    for sha in "${DIRECT_COMMITS[@]}"; do
        SUBJECT=$(git -C "$WORK_DIR/plugin" log --format='%s' -1 "$sha")
        if git cherry-pick "$sha" --quiet 2>/dev/null; then
            echo "  ✓ $SUBJECT"
        else
            echo "  ✗ CONFLICT: $SUBJECT — aborting cherry-pick"
            git cherry-pick --abort
            echo ""
            echo "Manual resolution needed. Run:"
            echo "  git clone $REMOTE_URL /tmp/plugin-fix"
            echo "  cd /tmp/plugin-fix && git rebase <synced-sha>"
            exit 1
        fi
    done
    FINAL_HEAD=$(git rev-parse --short HEAD)
    echo "Rebase complete (HEAD: $FINAL_HEAD)"
fi

# --- Step 5: Tag sync point and push ----------------------------------------

# Tag the filtered HEAD (before direct commits) as the sync point
git tag -f "$SYNC_TAG" "$FILTERED_HEAD"

PUSH_ARGS=("--force" "plugin" "HEAD:$BRANCH" "--tags")
echo "Pushing to $REMOTE_URL..."

if git push "${PUSH_ARGS[@]}" 2>&1; then
    TOTAL_COUNT=$(git rev-list --count HEAD)
    echo ""
    echo "✓ Sync complete."
    echo "  Source:   ag-shared $SOURCE_SHORT"
    echo "  Synced:   $FILTERED_COUNT commits"
    echo "  Direct:   ${#DIRECT_COMMITS[@]} commits (rebased)"
    echo "  Total:    $TOTAL_COUNT commits"
else
    echo ""
    echo "✗ Push failed."
    exit 1
fi
