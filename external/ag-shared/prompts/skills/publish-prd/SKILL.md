---
targets: ['*']
name: publish-prd
description: >-
  Publish a PRD or design decision document to the ag-grid-documentation repo.
  Use whenever the user wants to move a plans directory, PRD, design doc, or
  competitor analysis to the docs repo, archive a design decision, or publish
  internal planning documents. Also use when the user says "push to docs repo",
  "publish PRD", "archive this plan", or "move plans to documentation".
invocable: user-only
context: fork
---

# Publish PRD to ag-grid-documentation

Moves a PRD directory from the ag-charts repo to the ag-grid-documentation repo, creates a PR, and returns the front-end URL.

## Input Requirements

User must provide:

1. **Source directory** (required): Path to the directory containing the PRD files (e.g., `plans/data-point-selection/`)
2. **JIRA ticket** (optional): If not provided, extract from the content by scanning for `AG-XXXX` patterns

## Workflow

### Step 1: Identify the JIRA ticket and folder name

Scan the source directory files for the JIRA ticket number (pattern: `AG-\d+`). Check `index.md` or the main `.md` file first — the ticket number is usually in the title or first heading.

Ask the user to confirm the ticket number if multiple are found or none is found.

Determine the folder name: `AG-{ticket}-{kebab-description}` where the description comes from the directory name or the document title. Use uppercase `AG-` prefix.

### Step 2: Prepare the docs repo

Resolve the docs repo root via the `external/docs/` symlink (which points into an adjacent `ag-grid-documentation` checkout):

```bash
DOCS_REPO="$(cd external/docs && git rev-parse --show-toplevel)"
cd "$DOCS_REPO"
git checkout latest
git pull
git checkout -b AG-{ticket}/{kebab-description}-prd
```

### Step 3: Move the directory

Move (not copy) the source directory to the docs repo:

```
{source-dir}/ → external/docs/design-decisions/charts/AG-{ticket}-{kebab-description}/
```

The docs site auto-discovers folders — no index file update is needed.

### Step 4: Commit, push, create PR

```bash
cd "$DOCS_REPO"
git add docs/design-decisions/charts/AG-{ticket}-{kebab-description}/
git commit -m "AG-{ticket}: Add {description} PRD"
git push -u origin AG-{ticket}/{kebab-description}-prd
gh pr create --title "AG-{ticket}: {Description} PRD" --body "..."
```

### Step 5: Remove source from ag-charts

Delete the source directory from the ag-charts repo since this is a move, not a copy.

### Step 6: Return the front-end URL

The published URL will be:

```
https://docs.ag-grid.com/design-decisions/charts/AG-{ticket}-{kebab-description}
```

Report this URL to the user.

### Step 7: Offer to add to JIRA

Ask the user if they want the front-end URL added as a comment on the JIRA ticket. If yes, use the Atlassian MCP tool `addCommentToJiraIssue` to post the link.
