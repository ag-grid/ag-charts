---
targets: ['*']
name: sonar-fix
description: 'Fetch and fix open SonarCloud issues for AG Charts packages'
invocable: user-only
context: fork
---

# SonarCloud Issue Fixer

Systematically fetch and fix open SonarCloud issues for AG Charts packages.

## Usage

### Report Mode (No Arguments)

```
/sonar-fix
```

Shows summary of open SonarCloud issues with counts by severity and rule type.

### Fix Mode (With Arguments)

```
/sonar-fix <severity> [limit]
```

**Examples:**

-   `/sonar-fix HIGH` - Fix HIGH severity issues (default limit: 50)
-   `/sonar-fix HIGH 30` - Fix 30 HIGH severity issues
-   `/sonar-fix MEDIUM 20` - Fix 20 MEDIUM severity issues
-   `/sonar-fix ALL 100` - Fix up to 100 issues of all severities
-   `/sonar-fix HIGH,MEDIUM 50` - Fix HIGH and MEDIUM issues (up to 50 total)

---

## Sub-Documents

Load the appropriate sub-document based on the mode and phase of work.

| Document | Purpose | When to Load |
|----------|---------|-------------|
| `report-mode.md` | Detailed report generation from cache | Report mode (no arguments) |
| `fix-workflow.md` | Full fix workflow: verify, plan, execute, report | Fix mode (with arguments) |
| `fix-patterns.md` | Rule-specific fix patterns and examples | During fix mode, when applying fixes |
| `reference.md` | Component keys, safety notes, troubleshooting, workflow diagram | When troubleshooting or need reference |

## Rule Guide Library

Per-issue-type guides are available in `.rulesync/skills/sonar-fix/guides/` directory:

-   **README.md** - Index of all available guides
-   **Individual guides** - Detailed fix patterns, examples, and AG Charts context for each rule type
-   Guides are automatically created/updated using the SonarCloud API when new rule types are encountered

## Issue Cache System

To ensure accurate reporting and progress tracking, all SonarCloud issues are downloaded and cached locally.

**Cache Location:** `node_modules/.cache/sonar-issues/`

**Cache Structure:**

```
node_modules/.cache/sonar-issues/
├── raw/
│   ├── issues-latest.json              # Combined all issues (JSON)
│   └── page-{N}.json                   # Individual API pages (temporary)
├── processed/
│   ├── issues-all.tsv                  # All issues (tab-separated, human-readable)
│   ├── issues-by-rule.json            # Grouped by rule type
│   └── issues-by-severity.json        # Grouped by severity
├── progress/
│   ├── {branch-name}.json             # Progress tracking per branch
│   └── session-{timestamp}.log        # Session logs
└── metadata.json                       # Cache metadata (fetch time, branch, count)
```

**Cache Freshness:** Cache is considered stale after 1 hour and will be automatically refreshed.

## Phase -1: Ensure Fresh Issue Cache (ALL MODES)

**This phase MUST run before any other operations (both Report and Fix modes).**

1. **Check if cache exists and is fresh:**

    ```bash
    # Check cache freshness (less than 1 hour old)
    if [ -f node_modules/.cache/sonar-issues/metadata.json ]; then
        fetch_time=$(jq -r '.fetchedAt' node_modules/.cache/sonar-issues/metadata.json)
        now=$(date -u +%s)
        # Convert ISO timestamp to epoch (cross-platform)
        fetch_ts=$(date -d "$fetch_time" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$fetch_time" +%s)
        age=$((now - fetch_ts))

        if [ $age -lt 3600 ]; then
            echo "✓ Cache is fresh (${age}s old)"
            exit 0  # Cache is fresh, skip download
        else
            echo "⚠ Cache is stale (${age}s old), refreshing..."
        fi
    else
        echo "⚠ No cache found, downloading all issues..."
    fi
    ```

2. **Create cache directories:**

    ```bash
    mkdir -p node_modules/.cache/sonar-issues/{raw,processed,progress}
    ```

3. **Download ALL issues with pagination:**

    The SonarCloud API returns max 500 issues per page. With ~500+ total issues, we need multiple pages.

    **IMPORTANT:** Only fetch OPEN issues (not CONFIRMED, ACCEPTED, FALSE_POSITIVE, etc.) to ensure accurate counts.

    ```bash
    # Download all pages (max 500 items per page)
    # NOTE: Only fetching OPEN status (not CONFIRMED, ACCEPTED, FALSE_POSITIVE)
    echo "Downloading SonarCloud issues..."
    for page in 1 2 3 4 5; do
        echo "  Fetching page $page..."
        curl -sf "https://sonarcloud.io/api/issues/search?s=FILE_LINE&issueStatuses=OPEN&ps=500&p=$page&componentKeys=ag-charts-community-latest&organization=ag-grid&additionalFields=_all&impactSeverities=HIGH%2CMEDIUM%2CLOW%2CINFO" \
            > "node_modules/.cache/sonar-issues/raw/page-$page.json"

        # Check if this page has data
        issues_count=$(jq -r '.issues | length' "node_modules/.cache/sonar-issues/raw/page-$page.json" 2>/dev/null || echo "0")
        if [ "$issues_count" = "0" ]; then
            rm -f "node_modules/.cache/sonar-issues/raw/page-$page.json"
            echo "  Page $page empty, stopping pagination."
            break
        fi
        echo "  Page $page: $issues_count issues"
    done
    ```

4. **Combine all pages into single JSON:**

    ```bash
    echo "Combining pages..."
    jq -s '{
        total: (.[0].paging.total // 0),
        fetchedAt: (now | todate),
        pageCount: length,
        issues: ([.[].issues[]] | unique_by(.key))
    }' node_modules/.cache/sonar-issues/raw/page-*.json \
        > node_modules/.cache/sonar-issues/raw/issues-latest.json

    # Cleanup temporary page files
    rm -f node_modules/.cache/sonar-issues/raw/page-*.json

    actual_count=$(jq '.issues | length' node_modules/.cache/sonar-issues/raw/issues-latest.json)
    echo "✓ Downloaded $actual_count issues"
    ```

5. **Create human-readable TSV:**

    ```bash
    echo "Creating TSV export..."
    jq -r '
        ["key", "rule", "severity", "file", "line", "message", "effort"] as $headers |
        ($headers | @tsv),
        (.issues[] | [
            .key,
            .rule,
            (.impacts[0].severity // "INFO"),
            (.component | sub("^[^:]+:"; "")),
            (.line // 0),
            .message,
            (.effort // "5min")
        ] | @tsv)
    ' node_modules/.cache/sonar-issues/raw/issues-latest.json \
        > node_modules/.cache/sonar-issues/processed/issues-all.tsv

    echo "✓ Created TSV at: node_modules/.cache/sonar-issues/processed/issues-all.tsv"
    ```

6. **Save metadata:**

    ```bash
    echo "Saving metadata..."
    jq -n \
        --arg fetchedAt "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --arg branch "$(git branch --show-current)" \
        --argjson totalIssues "$(jq '.total' node_modules/.cache/sonar-issues/raw/issues-latest.json)" \
        --argjson actualIssues "$(jq '.issues | length' node_modules/.cache/sonar-issues/raw/issues-latest.json)" \
        '{
            fetchedAt: $fetchedAt,
            branch: $branch,
            totalIssues: $totalIssues,
            actualIssues: $actualIssues,
            component: "ag-charts-community-latest"
        }' > node_modules/.cache/sonar-issues/metadata.json

    echo "✓ Cache updated successfully"
    ```

7. **Report cache status:**

    ```bash
    jq -r '"
    Cache Status:
      Fetched: \(.fetchedAt)
      Branch: \(.branch)
      Total Issues: \(.actualIssues)
      Cache Location: node_modules/.cache/sonar-issues/
    "' node_modules/.cache/sonar-issues/metadata.json
    ```

---

## After Phase -1

- **Report mode:** Read and follow `.rulesync/skills/sonar-fix/report-mode.md`
- **Fix mode:** Read and follow `.rulesync/skills/sonar-fix/fix-workflow.md`
