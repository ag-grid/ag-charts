---
targets: ['*']
description: 'Summarise major feature threads by author for a release branch comparison'
---

# Release Summary by Author and Feature Area

Analyse git history between two release branches and produce a structured summary of work, grouped by author then feature area (1-3 themes per author).

## 1. Determine Release Branches

If the user hasn't specified branches, auto-detect:

    git fetch origin
    git branch -r | grep -E 'origin/b[0-9]+\.[0-9]+\.0$' | sort -V | tail -2

This gives the latest two `bX.Y.0` branches. Confirm with the user:

```
Detected releases:
- From: origin/b13.0.0
- To: origin/b13.1.0

Proceed with these branches?
```

Store as `FROM_BRANCH` and `TO_BRANCH`.

## 2. Collect PR Merge Commits

Run:

    git log origin/<FROM>..origin/<TO> --merges --pretty=format:'COMMIT_START%n%H%n%s%n%b%nCOMMIT_END'

For each merge commit, extract:

-   **Hash** from line after `COMMIT_START`
-   **PR number** from subject line (`#NNNN`)
-   **PR title** from the body (first non-empty line after subject)

**Get the real PR author** (not the merger):

    git log <hash>^1..<hash>^2 --pretty=format:'%an' | head -1

## 3. Filter

Exclude:

-   Bot authors: `github-actions[bot]`, `AgGitDeployment`
-   Snapshot PRs: branch contains `gha/snapshots-`
-   Non-PR merges: `Merge branch 'latest'`, `Merge latest`
-   Version bumps: subject contains `Version Bump`

## 4. Group and Analyse

For each human author, collect all their PR titles. Then consolidate into **1-3 feature themes** per author by:

-   Looking at JIRA ticket prefixes and summaries (CRT-XXXX, AG-XXXXX)
-   Grouping PRs that address the same component or concern
-   Using your judgement to create meaningful groupings (e.g. "Animation fixes", "Tooltip improvements", "Documentation updates")

**Consolidation rules:**

-   Combine related PRs (e.g. multiple animation bug fixes -> "Animation")
-   Authors with fewer than 3 PRs may have just 1 theme
-   Prefer descriptive theme names over generic ones

## 5. Output Report

```markdown
# Release Summary: <FROM> -> <TO>

**Commits analysed**: N PRs merged (excluding bots/snapshots)
**Contributors**: N authors

---

## [Author Name] (N PRs)

### [Theme 1]

-   PR #NNNN: [PR title]
-   PR #NNNN: [PR title]

### [Theme 2]

-   PR #NNNN: [PR title]

---

## [Next Author] (N PRs)

...

---

## Feature Area Cross-Reference

| Feature Area | Contributors       |
| ------------ | ------------------ |
| Animation    | Author A, Author B |
| Tooltip      | Author C           |
| ...          | ...                |
```

Sort authors by PR count descending. Include the cross-reference table at the end for a quick overview of who touched which areas.
