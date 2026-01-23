---
targets: ['*']
description: 'Split a branch into a logical sequence of stacked PRs for easier review'
---

# PR Split Instructions

You are an expert at managing Git branches and pull requests. Your goal is to split a large branch into a logical sequence of smaller, stacked PRs that can be reviewed step-by-step.

## Help

If the user provides a command option of `help`:

-   Explain how to use this prompt.
-   Explain if they are missing any prerequisites or tooling requirements.
-   DO NOT proceed, exit the prompt immediately after these steps.

## Phase 0: Prerequisites

### Tooling Requirements

-   Git CLI must be available
-   GitHub CLI (`gh`) must be available and authenticated
-   Working tree must be clean (no uncommitted changes)
-   Must be on a feature branch, not the main branch

### Verification

```bash
# Verify clean working tree
if [ -n "$(git status --porcelain)" ]; then
    echo "ERROR: Working tree is dirty. Please commit or stash changes first."
    exit 1
fi

# Verify not on main branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" = "latest" ] || [ "$current_branch" = "main" ] || [ "$current_branch" = "master" ]; then
    echo "ERROR: Cannot split on main branch. Switch to a feature branch first."
    exit 1
fi

# Verify gh CLI is available and authenticated
gh auth status
```

### Extract JIRA Ticket or Branch Prefix

Determine the commit message prefix from the branch name:

1. If branch matches `ag-NNNNN/description` pattern (JIRA branch): extract JIRA ticket (e.g., `AG-12345`)
2. Otherwise: derive prefix from branch name (e.g., `feature/null-keys` becomes `null-keys`)

Store this prefix for use in commit messages and PR titles.

## Phase 1: Analyse Branch Changes and Choose Split Strategy

### 1.1 Analyse the Changes

Use a sub-agent (type: `Explore`) to analyse the changes:

1. **Get the diff against base branch:**

```bash
git diff latest...HEAD --stat
git diff latest...HEAD
git log --oneline latest..HEAD
```

2. **Identify groupings by:**

    - Package (core vs community vs enterprise vs website)
    - Content type (code vs tests vs docs vs examples)
    - Logical dependencies (what needs to be merged first)
    - Existing commit boundaries

3. **Calculate statistics:**

    - Total lines changed
    - Number of files changed
    - Number of commits
    - Changes per package/area

### 1.2 Present Split Options to User

After analysis, use `AskUserQuestion` to present split strategy options. Generate 2-3 concrete split proposals based on the analysis, plus an option for custom specification.

**Example question format:**

```
Question: "How would you like to split this branch into PRs?"
Header: "Split strategy"
Options:
1. "By package" - "Split into N PRs: core changes, then community, then enterprise, then tests"
2. "By commit" - "Preserve existing commit structure as N separate PRs"
3. "By feature area" - "Split into N PRs based on logical feature boundaries: [list areas]"
4. (Always include) "Custom" - "I'll specify exactly how to split the changes"
```

**Guidelines for generating options:**

- Each option should include the number of PRs it would create
- Each option should briefly list what goes in each PR
- Options should be based on actual analysis of the changes, not generic templates
- If the branch has clean commit boundaries, offer "By commit" as an option
- If changes span multiple packages, offer "By package" as an option
- Always identify the most logical split based on code dependencies

### 1.3 Handle User Choice

**If user selects a pre-defined option:**

- Proceed with that split strategy
- Generate the detailed plan based on the chosen approach

**If user selects "Custom" or provides their own specification:**

- Use `AskUserQuestion` again to gather details:
  - "How many PRs should this be split into?"
  - "Describe what should go in each PR (you can list files, patterns, or descriptions)"
- Parse the user's specification and create the plan accordingly

### 1.4 Confirm the Split Plan

After determining the strategy, present the detailed plan to the user for confirmation:

```markdown
## Proposed Split Plan

### PR 1: [Title]
- Files: [list]
- Lines: ~XXX
- Description: [what this PR does]

### PR 2: [Title]
- Files: [list]
- Lines: ~XXX
- Description: [what this PR does]
- Depends on: PR 1

[etc.]
```

Use `AskUserQuestion` to confirm:

```
Question: "Does this split plan look correct?"
Header: "Confirm plan"
Options:
1. "Yes, proceed" - "Create the PR branches as described"
2. "Modify" - "I want to adjust the plan"
3. "Start over" - "Let me specify a different split strategy"
```

**If user wants to modify:**

- Ask what they want to change
- Update the plan accordingly
- Re-confirm

### 1.5 Finalise the Plan

Once confirmed, write the split plan to a plan file including:

- Number of PRs to create
- Files in each PR
- Brief description of each PR's purpose
- Dependencies between PRs

Validate the plan using the `/plan-review` skill to check for completeness and correctness.

## Phase 2: Prepare Temporary Branch

Create a clean starting point for the split:

```bash
# Record the current branch for reference
original_branch=$(git rev-parse --abbrev-ref HEAD)

# Create a temporary branch to hold the reset state
timestamp=$(date +%s)
git checkout -b "split-start-${timestamp}"

# Find the merge base with latest
merge_base=$(git merge-base latest HEAD)

# Soft reset to convert all commits to staged changes
git reset --soft "$merge_base"

# Verify all changes are now staged
git status
```

## Phase 3: Create PR Branches

For each logical grouping identified in Phase 1, create a branch:

### First PR Branch

```bash
# Start from latest for the first PR
git checkout latest
git checkout -b "${original_branch}-part-1"

# Cherry-pick or stage the relevant files from the temporary branch
# Use git checkout to bring specific files
git checkout "split-start-${timestamp}" -- path/to/file1 path/to/file2

# Or use git add -p for partial file staging
git add -p

# Commit with the appropriate prefix
git commit -m "${PREFIX} - Description of first part"
```

### Subsequent PR Branches

```bash
# Each subsequent PR targets the previous PR's branch
git checkout -b "${original_branch}-part-N"

# Bring in the next set of files
git checkout "split-start-${timestamp}" -- path/to/fileN

# Commit
git commit -m "${PREFIX} - Description of part N"
```

### Commit Message Format

-   Prefix with JIRA ticket or branch-derived slug
-   Examples:
    -   `AG-12345 - Add null category handling for bar series`
    -   `null-keys - Add null category handling for bar series`
-   Concise, imperative mood
-   No LLM attribution or emoji

## Phase 4: Delete Temporary Branch

```bash
# Return to latest first
git checkout latest

# Delete the temporary branch
git branch -D "split-start-${timestamp}"

# Verify no uncommitted changes remain
git status
```

## Phase 5: Refine & Push PR Branches

For each PR branch created, in order:

### 5.1 Checkout and Rebase

```bash
git checkout "${original_branch}-part-N"

# Rebase onto previous PR branch (or latest if first)
git rebase "${original_branch}-part-$((N-1))"  # or 'latest' for part-1
```

### 5.2 Validate the Branch

Use sub-agents to validate each branch:

1. **Run `/pr-review`** (via general-purpose sub-agent) to identify issues
2. **Run build/lint/test** relevant to the changed files:

```bash
yarn nx build:types <affected-package>
yarn nx lint <affected-package>
yarn nx test <affected-package>
```

3. **Fix any issues** (via code-fixup sub-agent if needed)
4. **Commit fixes** to the branch

Repeat until the branch is clean.

### 5.3 Push and Create PR

```bash
# Push with upstream tracking
git push -u origin "${original_branch}-part-N"

# Create draft PR
# First PR targets latest, subsequent PRs target previous part
if [ N -eq 1 ]; then
    base_branch="latest"
else
    base_branch="${original_branch}-part-$((N-1))"
fi

gh pr create --draft --base "$base_branch" --title "${PREFIX} - Part N: Description" --body "$(cat <<'EOF'
## Summary

Brief description of what this PR does.

## Position in Stack

PR N of M in the series.

**Previous PR:** #<number> (if applicable)
**Next PR:** #<number> (if applicable)

## JIRA

Jira: [AG-12345](https://ag-grid.atlassian.net/browse/AG-12345)

## Test Plan

- [ ] Unit tests pass
- [ ] Build succeeds
- [ ] Lint passes
EOF
)"
```

## Phase 6: Report Results

Output a summary of the created PRs:

```markdown
# PR Split Complete

## Summary

Split `{original_branch}` into {N} stacked PRs.

## PR Chain

| # | Branch | PR | Description | Base |
|---|--------|-----|-------------|------|
| 1 | {branch-part-1} | #{pr1} | {desc1} | latest |
| 2 | {branch-part-2} | #{pr2} | {desc2} | {branch-part-1} |
| ... | ... | ... | ... | ... |

## Dependency Diagram

```
latest
  └── {branch-part-1} (PR #{pr1})
        └── {branch-part-2} (PR #{pr2})
              └── {branch-part-3} (PR #{pr3})
```

## Reviewer Instructions

1. Review PRs in order (1, 2, 3, ...)
2. Each PR shows only its incremental changes
3. To see cumulative changes up to PR N, compare `{branch-part-N}` to `latest`
4. Approve and merge in order; later PRs will auto-update their base
```

## Error Handling

### Dirty Working Tree

If the working tree is dirty at the start:

-   Inform the user they need to commit or stash changes
-   Provide the command: `git stash` or `git commit -am "WIP"`
-   Exit without making changes

### Merge Conflicts During Rebase

If conflicts occur during rebase in Phase 5:

-   Pause and show the conflicts to the user
-   Ask if they want to resolve manually or abort
-   Do not attempt automatic conflict resolution

### Build/Lint/Test Failures

If `/pr-review` or build commands find issues:

-   Attempt to fix using code-fixup sub-agent
-   If fixes fail after 2 attempts, ask the user for guidance
-   Do not push branches with known failures

### GitHub CLI Failures

If `gh pr create` fails:

-   Provide manual instructions for creating the PR via GitHub web UI
-   Include the branch name, base branch, and suggested title/body

## Sub-Agent Usage Summary

| Phase | Sub-Agent Type | Purpose |
|-------|---------------|---------|
| 1 | Explore | Analyse code changes and identify logical groupings |
| 1 | Plan | Design the split strategy |
| 1 | plan-review (skill) | Validate the split plan |
| 5 | general-purpose | Run `/pr-review` for each branch |
| 5 | code-fixup (skill) | Fix build/lint/test issues |

## Best Practices

-   **Keep PRs focused**: Each PR should have a single purpose
-   **Preserve logical units**: Don't split a feature from its tests
-   **Order matters**: Put foundational changes in earlier PRs
-   **Documentation last**: Docs PRs can be at the end of the chain
-   **Review-friendly sizes**: 500-1000 lines is ideal for review
