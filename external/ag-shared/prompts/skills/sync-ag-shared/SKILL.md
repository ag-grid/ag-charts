---
targets: ['*']
name: sync-ag-shared
description: 'Sync ag-shared subrepo changes across ag-charts, ag-grid, and ag-studio repos'
invocable: user-only
---

# Sync ag-shared Subrepo Across AG Repos

Orchestrate syncing `external/ag-shared/` changes from the current repo to all other AG repos that consume the subrepo. This handles the full `git subrepo push` / `pull` cycle, companion changes, and cross-linked PRs.

## Help

If the user provides a command option of `help`:

-   Explain how to use this skill.
-   Explain the prerequisites and what will happen.
-   DO NOT proceed, exit the skill immediately after these steps.

## Prerequisites

-   Git CLI, GitHub CLI (`gh`), and `yarn` must be available.
-   `git subrepo` must be installed (`git subrepo --version`).
-   Must be on a **feature branch** (not `latest`, `main`, or `master`).
-   Working tree must be **clean** (`git status --porcelain` is empty).
-   The current repo must have `external/ag-shared/.gitrepo`.

## STEP 1: Gather State

Collect all context needed to plan the sync.

### 1a. Identify Source Repo

```bash
# Resolve the real repo root (worktrees resolve to actual repo location)
REPO_GIT_DIR=$(git rev-parse --git-common-dir)
SOURCE_ROOT=$(dirname "$REPO_GIT_DIR")

# Current branch
SOURCE_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Repo name (for display)
SOURCE_REPO=$(basename "$SOURCE_ROOT")
```

Validate:

-   `SOURCE_BRANCH` is not `latest`, `main`, or `master`.
-   `git status --porcelain` is empty.
-   `external/ag-shared/.gitrepo` exists.

If any validation fails, report the issue and **STOP**.

### 1b. Discover Destination Repos

Destination repos are **siblings** of the source repo root. Look for directories at the same level that contain `external/ag-shared/.gitrepo`.

```bash
PARENT_DIR=$(dirname "$SOURCE_ROOT")
for dir in "$PARENT_DIR"/*/; do
    if [ "$dir" != "$SOURCE_ROOT/" ] && [ -f "${dir}external/ag-shared/.gitrepo" ]; then
        echo "Found destination: $dir"
    fi
done
```

Collect the list of destination repos. Typical destinations are two of `ag-charts`, `ag-grid` and `ag-studio`, but discover dynamically.

### 1c. Validate Destinations

For each destination repo:

-   Check it has a clean working tree.
-   Check it is on `latest` or a feature branch.
-   Run `git fetch origin` to ensure it is up to date.

If any destination has uncommitted changes, default to stashing all changes and continuing - but ask the user to confirm.

## STEP 2: Analyse Source Changes

Use a sub-agent (Task tool, `subagent_type: Explore`) to analyse changes on the source branch:

```bash
# Changes inside ag-shared
git diff latest...HEAD -- external/ag-shared/

# Changes outside ag-shared
git diff latest...HEAD -- ':!external/ag-shared/'

# Commit log
git log --oneline latest...HEAD
```

The sub-agent should produce:

1.  **Change summary** — what files changed in `external/ag-shared/` and why.
2.  **Companion change predictions** — based on the ag-shared changes, what companion changes are likely needed in each destination repo. For example:
    -   New/renamed skills may need symlink updates in `.rulesync/`.
    -   Changed rule globs may need `.claude/settings.json` updates.
    -   Script changes may need `package.json` or CI updates.
    -   Setup-prompts changes need `setup-prompts.sh` re-run in each repo.

## STEP 3: Present Plan and Confirm

Display to the user:

```
## ag-shared Sync Plan

**Source:** <SOURCE_REPO> @ <SOURCE_BRANCH>
**Destinations:** <list of destination repos>

### Changes in ag-shared
<summary from step 2>

### Changes outside ag-shared
<summary from step 2>

### Predicted Companion Changes
<per-destination predictions from step 2>

### Steps
1. Push ag-shared from <SOURCE_REPO>
2. Create sync/<SOURCE_BRANCH> branches in each destination
3. Pull ag-shared in each destination
4. Apply companion changes in each destination
5. Verify all repos
6. Push branches and create cross-linked PRs
```

Use `AskUserQuestion` to confirm before proceeding. The user may want to adjust the plan or skip certain destinations.

## STEP 4: Push Source ag-shared

From the source repo working directory:

```bash
cd "$SOURCE_ROOT"
yarn subrepo push ag-shared
```

This pushes the `external/ag-shared/` content to the shared remote. If this fails, report the error and **STOP**.

## STEP 5: Create Sync Branches and Pull

For each destination repo:

```bash
cd "<DEST_ROOT>"

# Fetch latest
git fetch origin

# Create sync branch from origin/latest
git checkout -b "sync/${SOURCE_BRANCH}" origin/latest

# Pull ag-shared updates
yarn subrepo pull ag-shared

# Verify the pull succeeded
git subrepo status ag-shared
```

If `subrepo pull` fails in any repo, report the error and **STOP** — ask the user how to proceed.

## STEP 6: Apply Companion Changes

For each destination repo, launch a **sub-agent** (Task tool, `subagent_type: general-purpose`) to apply predicted companion changes. Provide the sub-agent with:

-   The destination repo path.
-   The change summary from Step 2.
-   The predicted companion changes for this specific repo.
-   Instructions to replicate patterns from the source repo.

Common companion tasks:

-   Run `./external/ag-shared/scripts/setup-prompts/setup-prompts.sh` to regenerate `.claude/` from `.rulesync/`.
-   Update `.rulesync/` symlinks if skills/rules were added, renamed, or removed.
-   Update product-specific configurations if ag-shared scripts changed.
-   Run verification: `./external/ag-shared/scripts/setup-prompts/verify-rulesync.sh`.

### Iterative Push/Pull (if needed)

If companion changes modify files inside `external/ag-shared/` (rare but possible):

1.  Commit the changes in the destination repo.
2.  `yarn subrepo push ag-shared` from the destination.
3.  Go back to the source repo and other destinations: `yarn subrepo pull ag-shared`.
4.  Re-verify.

**Cap iterations at 3.** If changes still bounce after 3 rounds, stop and ask the user.

## STEP 7: Verify

For each repo (source + all destinations):

```bash
# Check subrepo status
git subrepo status ag-shared

# Verify clean working tree
git status --porcelain

# Run rulesync verification if available
if [ -f "./external/ag-shared/scripts/setup-prompts/verify-rulesync.sh" ]; then
    ./external/ag-shared/scripts/setup-prompts/verify-rulesync.sh
fi
```

Report any issues. All repos must have clean working trees and passing verification.

## STEP 8: Commit, Push, and Create PRs

### 8a. Push All Branches

For the source repo (if not already pushed):

```bash
cd "$SOURCE_ROOT"
git push -u origin "$SOURCE_BRANCH"
```

For each destination repo:

```bash
cd "<DEST_ROOT>"
git push -u origin "sync/${SOURCE_BRANCH}"
```

### 8b. Create Cross-Linked PRs

Create a PR in each repo. All PRs should reference each other.

First, create all PRs:

```bash
# Source repo PR (if not already created)
cd "$SOURCE_ROOT"
SOURCE_PR_URL=$(gh pr create --base latest --title "<title>" --body "$(cat <<'EOF'
## Summary
<change summary>

## Cross-repo PRs
- Destination PRs will be linked after creation

## Test plan
- [ ] Verify ag-shared sync completed in all repos
- [ ] Run setup-prompts verification in all repos
EOF
)" 2>/dev/null || gh pr view --json url -q '.url')

# Destination repo PRs
cd "<DEST_ROOT>"
DEST_PR_URL=$(gh pr create --base latest --title "Sync ag-shared from <SOURCE_BRANCH>" --body "$(cat <<'EOF'
## Summary
Sync ag-shared subrepo from <SOURCE_REPO>@<SOURCE_BRANCH>.

<companion change summary if any>

## Cross-repo PRs
- Source: <SOURCE_PR_URL>

## Test plan
- [ ] Verify ag-shared content matches source
- [ ] Run setup-prompts verification
EOF
)")
```

Then update all PR descriptions to cross-link.

### 8c. Report Results

Output a summary:

```
## Sync Complete

| Repo | Branch | PR |
| ---- | ------ | -- |
| <source> | <branch> | <url> |
| <dest1> | sync/<branch> | <url> |
| <dest2> | sync/<branch> | <url> |

All repos verified. Working trees clean.
```

## Error Handling

-   **Merge conflicts during subrepo pull:** Stop and ask the user to resolve manually. Provide the conflicting files and repo path.
-   **Auth failures:** Check `gh auth status` and `git remote -v`. Ask the user to authenticate.
-   **Dirty working tree:** Always stop and report. Never force-clean a destination repo.
-   **Subrepo push/pull failures:** Report the full error output. Common causes: diverged history, missing remote access.

## Arguments

`${ARGUMENTS}` can optionally include:

-   `--skip <repo>` — skip a specific destination repo.
-   `--dry-run` — analyse and present plan only, do not execute.
-   `--no-pr` — sync branches but do not create PRs.
