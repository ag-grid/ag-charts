---
targets: ['*']
name: batch-plunkers
description: 'Create a batch of Plunkers with one sub-agent per Plunker'
context: fork
---

# Batch Plunkers

Create multiple Plunker examples in parallel. Each sub-agent follows the `/plunker` skill workflow; the main thread orchestrates and collects results.

**Usage:**

```
/batch-plunkers AG-16727
/batch-plunkers "Create 3 examples showing grouped bar nulls with skipNullBars"
/batch-plunkers (then provide a spec table when prompted)
```

## STEP 1: Parse Input into Assignments

Determine the input mode and extract individual Plunker assignments.

### Mode A: JIRA Ticket

Use Atlassian MCP to read the ticket. Extract acceptance criteria from the description. Each AC becomes one Plunker assignment. The assignment text is the AC verbatim plus any relevant context from the ticket description (API name, feature being tested, etc.).

### Mode B: General Direction

Parse the user's natural language into discrete Plunker assignments. Ask the user to confirm the breakdown before proceeding.

### Mode C: Spec Table

User provides a markdown table with columns `#, Title, Description`. Use as-is.

### Confirm Before Proceeding

In ALL modes, present the assignment list to the user for confirmation before proceeding:

```
I found N acceptance criteria. Here are the Plunker assignments:
1. [AC text] → Plunker: [brief plan]
2. [AC text] → Plunker: [brief plan]
...
Proceed? (Y/adjust)
```

Wait for user confirmation. Do NOT launch sub-agents until confirmed.

## STEP 2: Prepare Context and Launch Sub-Agents

### 2a. Read the Product Guide

Read all `*-guide.md` files in the sibling plunker skill directory (`../plunker/`). These contain the product-specific file templates, CDN URLs, styling requirements, and common issues. The guide content will be included in each sub-agent prompt.

### 2b. Determine CDN and Package

Ask the user which CDN to use (staging vs versioned) and whether community or enterprise is needed. Pass these as context to each sub-agent.

### 2c. Launch Sub-Agents

Launch one `general-purpose` Task sub-agent per assignment, **all in a single message** so they run concurrently. Use `run_in_background: true` on each.

Each sub-agent prompt must include:

1. The assignment text and plunker number
2. The full product guide content (from Step 2a)
3. The resolved CDN preference and package name (from Step 2b)
4. Any feature context from the JIRA ticket
5. Instruction to follow the `/plunker` skill's "Create a New Plunker" workflow
6. Instruction to upload via: `bash "<skill-base-directory>/../plunker/plnkr.sh" upload "$PLNKR_DIR" --title "Title"`
7. Instruction to output the resulting `URL=` line

**Sub-agent prompt template:**

````
Create a Plunker for the following assignment:

**Assignment #{PLUNKER_NUMBER}:** {ASSIGNMENT}

**CDN:** {CDN_PREFERENCE}
**Package:** {PACKAGE_NAME}
{FEATURE_CONTEXT}

Follow the "Create a New Plunker" workflow from the plunker skill:
1. Create a working directory: `PLNKR_DIR=$(mktemp -d /tmp/plnkr-batch-{PLUNKER_NUMBER}-XXXXXX)`
2. Write all files per the product guide below (index.html, main.js, ag-example-styles.css, package.json, and optionally data.js)
3. Upload: `bash "<skill-base-directory>/../plunker/plnkr.sh" upload "$PLNKR_DIR" --title "{TITLE}"`
4. Report the URL= line from the upload output

## Product Guide

{GUIDE_CONTENT}
````

Wait for **all** sub-agents to complete before proceeding to Step 3.

## STEP 3: Output Summary

Present results as a markdown table:

```
| # | Title | AC | URL | Status |
|---|-------|----|-----|--------|
| 1 | ... | AC-1 | https://plnkr.co/edit/... | OK |
| 2 | ... | AC-2 | https://plnkr.co/edit/... | OK |
| 3 | ... | AC-3 | - | FAILED: [reason] |
```

If any failed, suggest re-running with just the failed assignments by providing the exact `/batch-plunkers` invocation or spec table.

## Notes

- **Sub-agent autonomy**: Each sub-agent handles the full lifecycle — file creation, CSS sourcing, and API upload via `plnkr.sh`. The main thread only orchestrates and collects results.
- **Rate limiting**: If the Plunker API returns 429 for a sub-agent, it should retry once after a brief pause.
- **Rerunning failures**: Copy the failed assignments into a spec table and re-run with Mode C.
- **Token lifecycle**: `plnkr.sh` manages access tokens internally per invocation. No shared token setup needed.
