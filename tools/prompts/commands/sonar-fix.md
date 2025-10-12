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

## Rule Guide Library

Per-issue-type guides are available in `tools/prompts/sonar-fix/` directory:

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

## Instructions for AI Agent

### Phase -1: Ensure Fresh Issue Cache (ALL MODES)

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

    ```bash
    # Download all pages (max 500 items per page)
    echo "Downloading SonarCloud issues..."
    for page in 1 2 3 4 5; do
        echo "  Fetching page $page..."
        curl -sf "https://sonarcloud.io/api/issues/search?s=FILE_LINE&issueStatuses=OPEN%2CCONFIRMED&ps=500&p=$page&componentKeys=ag-charts-community-latest&organization=ag-grid&additionalFields=_all&impactSeverities=HIGH%2CMEDIUM%2CLOW%2CINFO" \
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

### When Invoked WITHOUT Arguments (Report Mode)

**Prerequisites:** Phase -1 must have run successfully and cache must exist.

1. **Load issues from cache:**

    Read the cached JSON file (NOT WebFetch):

    ```bash
    # Verify cache exists
    if [ ! -f node_modules/.cache/sonar-issues/raw/issues-latest.json ]; then
        echo "❌ Cache not found. Phase -1 may have failed."
        exit 1
    fi

    # Show cache metadata
    cat node_modules/.cache/sonar-issues/metadata.json
    ```

2. **Parse JSON directly for accurate counts:**

    Use jq to get exact numbers (NOT LLM summarization):

    ```bash
    # Total issues
    total=$(jq '.issues | length' node_modules/.cache/sonar-issues/raw/issues-latest.json)
    echo "Total Issues: $total"

    # Breakdown by severity
    jq -r '
        .issues | group_by(.impacts[0].severity // "INFO") |
        map({
            severity: (.[0].impacts[0].severity // "INFO"),
            count: length
        }) | sort_by(.severity) |
        ["Severity", "Count"],
        (["--------", "-----"]),
        (.[] | [.severity, .count]) |
        @tsv
    ' node_modules/.cache/sonar-issues/raw/issues-latest.json

    # Breakdown by rule type
    jq -r '
        .issues | group_by(.rule) |
        map({
            rule: .[0].rule,
            count: length,
            severity: (.[0].impacts[0].severity // "INFO"),
            example: (.[0].message // ""),
            effort: (.[0].effort // "5min")
        }) | sort_by(-.count) |
        ["Rule", "Count", "Severity", "Effort", "Example"],
        (["----", "-----", "--------", "------", "-------"]),
        (.[] | [.rule, .count, .severity, .effort, .example]) |
        @tsv
    ' node_modules/.cache/sonar-issues/raw/issues-latest.json | head -20
    ```

3. **Analyze and categorize issues:**

    Group issues by complexity tiers:

    - **Tier 1 (Quick Wins - Low Effort):**

        - S7728: Use `for...of` instead of `.forEach()`
        - S7726: Name anonymous functions
        - S7732: Prefer shorthand property notation
        - S1874: Remove deprecated API usage
        - Simple syntax/style fixes

    - **Tier 2 (Medium Effort):**

        - S3358: Extract ternary operators to if/else
        - S1854: Remove unused assignments
        - S4143: Deduplicate collection checks
        - S1871: Combine identical branches
        - Logic simplifications

    - **Tier 3 (Complex - High Effort):**
        - S3776: Reduce cognitive complexity
        - S1541: Reduce function complexity (lines of code)
        - Architectural refactors
        - May require significant code restructuring

4. **Generate formatted report:**

    ```markdown
    ## SonarCloud Issues Report

    **Total Issues:** N issues (~X hours estimated effort)

    ### Severity Breakdown

    | Severity | Count | Effort |
    | -------- | ----- | ------ |
    | HIGH     | N     | X hrs  |
    | MEDIUM   | N     | X hrs  |
    | LOW      | N     | X hrs  |
    | INFO     | N     | X min  |

    ### Top Issue Types (by count)

    | Rank | Rule  | Count | Tier | Auto-Fix | Effort | Description                        |
    | ---- | ----- | ----- | ---- | -------- | ------ | ---------------------------------- |
    | 1    | S7728 | 40    | 1    | ❌       | 3.5h   | Use for...of instead of .forEach() |
    | 2    | S3776 | 85    | 3    | ❌       | 18h    | Reduce cognitive complexity        |
    | 3    | S7726 | 10    | 1    | ❌       | 50min  | Name anonymous functions           |

    ### 🎯 Recommended Fix Strategy

    **Start with Tier 1 issues (quick wins):**

    -   S7728: 40 issues (~3.5 hours) - Loop syntax modernization
    -   S7726: 10 issues (~50 minutes) - Function naming

    **Then proceed to Tier 2 (medium effort):**

    -   S3358: 15 issues (~1 hour) - Simplify ternaries

    **Save Tier 3 for dedicated effort:**

    -   S3776: 85 issues (~18 hours) - Complexity reduction (requires careful refactoring)

    **To begin fixing:** `/sonar-fix HIGH 30`
    ```

5. **Include helpful context:**

    - Note which issues are in test files vs source files
    - Highlight any issues in recently modified files
    - Show package distribution (core, community, enterprise)
    - Link to SonarCloud project: `https://sonarcloud.io/project/issues?id=ag-charts-community-latest&issueStatuses=OPEN%2CCONFIRMED`

---

### When Invoked WITH Arguments (Fix Mode)

#### Phase 0: Ensure Rule Guides Exist

**Before fetching issues, ensure rule-specific guides are available:**

1. **Check for existing guides:**

    Rule guides are located in `tools/prompts/sonar-fix/` directory.

    Each guide follows the naming pattern: `{rule-number}-{kebab-case-description}.md`

    Example: `S7728-use-for-of-loops.md`

2. **For missing guides:**

    If you encounter a rule type without a guide:

    a. **Fetch rule details from SonarCloud API:**

    ```
    URL: https://sonarcloud.io/api/rules/show?key={encoded-rule-id}&organization=ag-grid
    Example: https://sonarcloud.io/api/rules/show?key=typescript%3AS7728&organization=ag-grid

    Prompt: "Extract the complete rule information including:
    - Rule key, name, description
    - Severity, type, tags
    - All code examples (noncompliant and compliant)
    Return in structured format with all details"
    ```

    b. **Create guide file following the standard structure:**

    ```markdown
    # {Issue Description}

    Rule ID: {full-rule-id}
    Rule URL: https://sonarcloud.io/api/rules/show?key={encoded-rule-id}&organization=ag-grid

    {Human-readable description from SonarCloud API}

    ## Example Violations

    {Code examples from API}

    ## Example Fixes

    {Code examples from API}

    ## AG Charts Context

    {Project-specific notes - can be added incrementally}
    ```

    c. **Save to:** `tools/prompts/sonar-fix/{rule-number}-{description}.md`

    d. **Update README.md:** Add entry to the appropriate tier table in `tools/prompts/sonar-fix/README.md`

3. **Reference during fixing:**

    When processing issues in Phase 3, read the appropriate guide to inform your fixes.

#### Phase 1: Load from Cache and Verify Issues

**Prerequisites:** Phase -1 must have run successfully.

1. **Parse command arguments:**

    ```
    Argument 1: Severity filter
    - HIGH
    - MEDIUM
    - LOW
    - INFO
    - HIGH,MEDIUM (comma-separated)
    - ALL

    Argument 2: Limit (default: 50)
    - Maximum number of issues to attempt fixing in this session
    ```

2. **Load and filter issues from cache:**

    Use jq to filter by severity (NOT WebFetch):

    ```bash
    # Get current branch for progress tracking
    current_branch=$(git branch --show-current)
    echo "Working on branch: $current_branch"

    # Parse severity filter (example: "HIGH" or "HIGH,MEDIUM")
    severity_filter="<SEVERITY_FILTER>"  # From command argument
    limit=50  # From command argument or default

    # Build jq filter for severity
    if [ "$severity_filter" = "ALL" ]; then
        severity_jq_filter='true'
    else
        # Convert "HIGH,MEDIUM" to jq filter: (.impacts[0].severity == "HIGH" or .impacts[0].severity == "MEDIUM")
        severity_list=$(echo "$severity_filter" | tr ',' '\n')
        severity_jq_filter=$(echo "$severity_list" | awk '{print "(.impacts[0].severity == \"" $1 "\")"}' | paste -sd ' or ' -)
    fi

    # Filter issues by severity and limit
    jq --argjson limit "$limit" "
        .issues |
        map(select($severity_jq_filter)) |
        sort_by(.impacts[0].severity, .rule, .component, .line) |
        limit($limit; .[])
    " node_modules/.cache/sonar-issues/raw/issues-latest.json \
        > node_modules/.cache/sonar-issues/processed/filtered-issues.json

    filtered_count=$(jq '. | length' node_modules/.cache/sonar-issues/processed/filtered-issues.json)
    echo "Filtered to $filtered_count issues (severity: $severity_filter, limit: $limit)"
    ```

3. **Verify issues still exist in current code (branch-aware checking):**

    Before planning fixes, check if issues are already resolved:

    ```bash
    echo "Verifying issues still exist in current code..."

    # Create/load progress file for this branch
    progress_file="node_modules/.cache/sonar-issues/progress/$current_branch.json"
    if [ ! -f "$progress_file" ]; then
        echo '{"branch": "'$current_branch'", "sessions": [], "verified": {}}' > "$progress_file"
    fi

    # For each issue, check if it still exists
    jq -c '.[]' node_modules/.cache/sonar-issues/processed/filtered-issues.json | while read -r issue; do
        key=$(echo "$issue" | jq -r '.key')
        file=$(echo "$issue" | jq -r '.component | sub("^[^:]+:"; "")')
        line=$(echo "$issue" | jq -r '.line')
        rule=$(echo "$issue" | jq -r '.rule')

        # Check if file exists
        if [ ! -f "$file" ]; then
            # Mark as file-not-found
            jq --arg key "$key" --arg status "file-not-found" \
                '.verified[$key] = {status: $status, checkedAt: (now | todate)}' \
                "$progress_file" > "$progress_file.tmp" && mv "$progress_file.tmp" "$progress_file"
            continue
        fi

        # Read the file at the issue line (±3 lines context)
        # This is a simple check - the actual fix verification will be more thorough
        context=$(sed -n "$((line-3)),$((line+3))p" "$file" 2>/dev/null || echo "")

        if [ -z "$context" ]; then
            # Line doesn't exist (file may have changed)
            jq --arg key "$key" --arg status "line-not-found" \
                '.verified[$key] = {status: $status, checkedAt: (now | todate)}' \
                "$progress_file" > "$progress_file.tmp" && mv "$progress_file.tmp" "$progress_file"
        else
            # File and line exist - mark as pending verification
            jq --arg key "$key" --arg status "pending" --arg file "$file" --argjson line "$line" \
                '.verified[$key] = {status: $status, file: $file, line: $line, checkedAt: (now | todate)}' \
                "$progress_file" > "$progress_file.tmp" && mv "$progress_file.tmp" "$progress_file"
        fi
    done

    # Count verification results
    verified_pending=$(jq '[.verified[] | select(.status == "pending")] | length' "$progress_file")
    verified_not_found=$(jq '[.verified[] | select(.status == "file-not-found" or .status == "line-not-found")] | length' "$progress_file")

    echo "Verification complete:"
    echo "  - Still exist: $verified_pending"
    echo "  - Already fixed/not found: $verified_not_found"
    ```

4. **Filter to only issues that still exist:**

    ```bash
    # Update filtered-issues.json to only include issues that still exist
    jq --slurpfile progress <(cat "$progress_file") '
        [.[] | select($progress[0].verified[.key].status == "pending")]
    ' node_modules/.cache/sonar-issues/processed/filtered-issues.json \
        > node_modules/.cache/sonar-issues/processed/verified-issues.json

    actual_count=$(jq '. | length' node_modules/.cache/sonar-issues/processed/verified-issues.json)
    echo "Final count after verification: $actual_count issues"
    ```

5. **Group by rule type and prioritize:**

    ```bash
    # Group issues by rule for batch processing
    jq 'group_by(.rule) | map({
        rule: .[0].rule,
        count: length,
        severity: .[0].impacts[0].severity,
        issues: .
    }) | sort_by(.severity, -.count)' \
        node_modules/.cache/sonar-issues/processed/verified-issues.json \
        > node_modules/.cache/sonar-issues/processed/batched-issues.json

    echo "Grouped into batches by rule type"
    ```

#### Phase 2: Present Plan to User

Create a detailed execution plan:

```markdown
## SonarCloud Fix Plan

**Scope:** N issues across M files (estimated X hours)

### Batch Breakdown

#### Batch 1: S7728 - Use for...of loops (15 issues, ~1.5h)

-   packages/ag-charts-core/src/utils/validation.ts (3 issues)
-   packages/ag-charts-community/src/chart/series/cartesian/barSeries.ts (2 issues)
-   [... more files ...]

#### Batch 2: S7726 - Name anonymous functions (8 issues, ~40min)

-   packages/ag-charts-core/src/chart/data/processors.ts (5 issues)
-   [... more files ...]

#### Batch 3: S3358 - Simplify ternary operators (7 issues, ~35min)

-   [... files ...]

### Verification Strategy

After each batch:

-   ✅ Run `nx format` to ensure formatting
-   ✅ Run `nx lint <affected-packages>` to verify no new issues
-   ✅ Run `nx build:types <affected-packages>` to catch type errors
-   ✅ Create commit with descriptive message

### Skipped Issues (Tier 3 - Complex)

These require more careful refactoring and should be addressed separately:

-   S3776 (Cognitive Complexity): 85 issues (~18h effort)

**Proceed with this plan? (yes/no/modify)**
```

Wait for user confirmation before proceeding.

#### Phase 3: Systematic Fixing

**For each batch:**

1. **Create todo list for the batch:**

    Use TodoWrite to track progress:

    - Batch N: Fix <rule-name> issues
    - For each file in batch
    - Format code
    - Verify with lint/types
    - Commit changes

2. **Process each issue:**

    a. **Read the file and locate the issue:**

    ```bash
    # Read file with context around the issue line
    Read(<file_path>, offset=<line-5>, limit=20)
    ```

    b. **Verify issue still exists:**

    - Code may have changed since SonarCloud scan
    - Skip if already fixed

    c. **Apply rule-specific fix:**

    **Read the appropriate rule guide:**

    - Guides are in `tools/prompts/sonar-fix/{rule-number}-{description}.md`
    - Example: For rule `typescript:S7728`, read `tools/prompts/sonar-fix/S7728-use-for-of-loops.md`
    - Use the guide's examples, AG Charts context, and fix patterns to inform your changes
    - If no guide exists, create one following Phase 0 instructions

    **Quick reference patterns are also available below:** [Rule-Specific Fix Patterns](#rule-specific-fix-patterns)

    d. **Use Edit tool for precise changes:**

    - Keep changes minimal and focused
    - Preserve surrounding code style
    - Don't make unrelated changes

    e. **Track progress after processing issue:**

    ```bash
    # Update progress file with fix status
    progress_file="node_modules/.cache/sonar-issues/progress/$(git branch --show-current).json"

    # After successfully fixing an issue
    jq --arg key "$issue_key" --arg status "fixed" --arg commit "$(git rev-parse HEAD 2>/dev/null || echo 'uncommitted')" \
        '(.verified[$key].status = $status) | (.verified[$key].fixedAt = (now | todate)) | (.verified[$key].commit = $commit)' \
        "$progress_file" > "$progress_file.tmp" && mv "$progress_file.tmp" "$progress_file"

    # After skipping an issue (already fixed, too complex, etc.)
    jq --arg key "$issue_key" --arg status "skipped" --arg reason "$skip_reason" \
        '(.verified[$key].status = $status) | (.verified[$key].skippedAt = (now | todate)) | (.verified[$key].reason = $reason)' \
        "$progress_file" > "$progress_file.tmp" && mv "$progress_file.tmp" "$progress_file"
    ```

    f. **Mark todo as complete and move to next issue**

3. **After completing all issues in batch:**

    a. **Format code:**

    ```bash
    nx format
    ```

    b. **Identify affected packages:**

    Parse file paths to extract package names:

    - `packages/ag-charts-core/...` → `ag-charts-core`
    - `packages/ag-charts-community/...` → `ag-charts-community`
    - `packages/ag-charts-enterprise/...` → `ag-charts-enterprise`

    c. **Verify affected packages:**

    ```bash
    # Run for each affected package
    nx lint <package-name>
    nx build:types <package-name>
    ```

    d. **Check results:**

    - ✅ **If all pass:** Proceed to commit
    - ❌ **If verification fails:**
        - Review the errors
        - Fix any issues introduced by the changes
        - Re-run verification
        - If unable to fix, revert the batch and report to user

4. **Create commit:**

    ```bash
    git add <affected-files>

    git commit -m "$(cat <<'EOF'
    Fix SonarCloud <RULE_ID> issues

    Fixed N violations of <RULE_NAME> across M files.

    Changes:
    - <Brief description of the fix pattern>
    - <Package(s) affected>

    All tests passing, no functional changes.

    Rule: <RULE_ID> - <RULE_DESCRIPTION>
    EOF
    )"
    ```

5. **Report batch completion:**

    Read from progress file for accurate counts:

    ```bash
    # Get batch statistics from progress file
    progress_file="node_modules/.cache/sonar-issues/progress/$(git branch --show-current).json"

    batch_fixed=$(jq --arg rule "$current_rule" '[.verified[] | select(.rule == $rule and .status == "fixed")] | length' "$progress_file")
    batch_skipped=$(jq --arg rule "$current_rule" '[.verified[] | select(.rule == $rule and .status == "skipped")] | length' "$progress_file")
    batch_total=$((batch_fixed + batch_skipped))

    echo "✅ Batch $batch_number Complete: $current_rule"
    echo "   - Fixed: $batch_fixed/$batch_total issues"
    echo "   - Skipped: $batch_skipped"
    echo "   - Files modified: <file count>"
    echo "   - Verification: ✅ Passed"
    echo "   - Commit: $(git rev-parse HEAD 2>/dev/null || echo 'uncommitted')"
    echo ""
    echo "Remaining batches: $remaining_batches"
    ```

6. **Save session summary to progress file:**

    ```bash
    # After all batches complete, add session summary
    jq --arg startedAt "$session_start_time" \
       --argjson requestedCount "$requested_limit" \
       --argjson actualFixed "$(jq '[.verified[] | select(.status == "fixed")] | length' "$progress_file")" \
       --argjson skipped "$(jq '[.verified[] | select(.status == "skipped")] | length' "$progress_file")" \
       '.sessions += [{
           startedAt: $startedAt,
           completedAt: (now | todate),
           requestedCount: $requestedCount,
           actualFixed: $actualFixed,
           skipped: $skipped
       }]' "$progress_file" > "$progress_file.tmp" && mv "$progress_file.tmp" "$progress_file"
    ```

7. **Move to next batch** and repeat

#### Phase 4: Final Report

After all batches complete, generate report from progress file:

```bash
# Read all data from progress file
progress_file="node_modules/.cache/sonar-issues/progress/$(git branch --show-current).json"

# Extract statistics
total_fixed=$(jq '[.verified[] | select(.status == "fixed")] | length' "$progress_file")
total_skipped=$(jq '[.verified[] | select(.status == "skipped")] | length' "$progress_file")
total_attempted=$((total_fixed + total_skipped))

# Get session info
session_start=$(jq -r '.sessions[-1].startedAt' "$progress_file")
session_complete=$(jq -r '.sessions[-1].completedAt' "$progress_file")
requested_count=$(jq '.sessions[-1].requestedCount' "$progress_file")

# Calculate time taken
# (This is approximate based on timestamps)

# Get breakdown by rule
jq -r '
    [.verified[] | select(.status == "fixed" or .status == "skipped")] |
    group_by(.rule // "unknown") |
    map({
        rule: (.[0].rule // "unknown"),
        fixed: ([.[] | select(.status == "fixed")] | length),
        skipped: ([.[] | select(.status == "skipped")] | length),
        skip_reasons: ([.[] | select(.status == "skipped").reason] | unique | join(", "))
    }) |
    ["Rule", "Fixed", "Skipped", "Skip Reasons"],
    (["-----", "-----", "-------", "------------"]),
    (.[] | [.rule, .fixed, .skipped, .skip_reasons]) |
    @tsv
' "$progress_file"

# Get commit list
git log --oneline --since="$session_start" | head -10

# Calculate remaining issues
cache_total=$(jq '.total' node_modules/.cache/sonar-issues/raw/issues-latest.json)
remaining=$((cache_total - total_fixed))

echo "
## 🎉 SonarCloud Fix Session Complete

### Summary

-   **Requested:** $requested_count issues
-   **Actually Fixed:** $total_fixed issues
-   **Skipped:** $total_skipped issues (already fixed, too complex, etc.)
-   **Total Processed:** $total_attempted issues
-   **Session Duration:** $(date -d "$session_start" +%H:%M) - $(date -d "$session_complete" +%H:%M)

### Breakdown by Rule

$(jq -r '[.verified[] | select(.status == "fixed" or .status == "skipped")] |
    group_by(.rule // "unknown") |
    map({rule: (.[0].rule // "unknown"), fixed: ([.[] | select(.status == "fixed")] | length), skipped: ([.[] | select(.status == "skipped")] | length)}) |
    "| Rule | Fixed | Skipped |",
    "| ---- | ----- | ------- |",
    (.[] | "| \(.rule) | \(.fixed) | \(.skipped) |")
    ' "$progress_file")

### Commits Created

$(git log --oneline --since="$session_start" --format="- %s (%h)" | head -10)

### Remaining Issues

**Still open in SonarCloud:** ~$remaining issues

Progress file: $progress_file
Cache: node_modules/.cache/sonar-issues/

**Recommendations:**

-   Run \`/sonar-fix\` again to see updated report
-   Review progress file for detailed fix history
-   Verify changes with \`nx test ag-charts-community\` and \`nx test ag-charts-enterprise\`
-   Cache will auto-refresh in 1 hour

**SonarCloud Link:** https://sonarcloud.io/project/issues?id=ag-charts-community-latest&issueStatuses=OPEN%2CCONFIRMED
"
```

**Note:** All statistics come from the progress file, ensuring accurate counts that match what was actually processed.

---

## Rule-Specific Fix Patterns

### S7728: Use for...of instead of .forEach()

**Before:**

```typescript
items.forEach((item) => {
    process(item);
});
```

**After:**

```typescript
for (const item of items) {
    process(item);
}
```

**Special cases:**

-   If callback uses `this` context → Keep `.forEach()` with arrow function or add comment
-   If callback has early returns → Use `for...of` with continue/break
-   If index is needed → Use `for (const [index, item] of items.entries())`

### S7726: Name anonymous functions

**Before:**

```typescript
const handler = function () {
    // ...
};
```

**After:**

```typescript
const handler = function handler() {
    // ...
};
```

**Context:** Improves stack traces and debugging

### S3776: Reduce cognitive complexity

This is a **Tier 3** issue requiring careful refactoring. Common approaches:

1. **Extract helper functions:**

    ```typescript
    // Before: One large function with nested ifs
    function process(data) {
      if (condition1) {
        if (condition2) {
          if (condition3) {
            // ... deep nesting
          }
        }
      }
    }

    // After: Extracted helpers
    function process(data) {
      if (!shouldProcess(data)) return;
      processValidData(data);
    }

    function shouldProcess(data) {
      return condition1 && condition2 && condition3;
    }
    ```

2. **Use early returns:**

    ```typescript
    // Before: Deep nesting
    if (valid) {
      if (hasData) {
        // ... lots of logic
      }
    }

    // After: Early returns
    if (!valid) return;
    if (!hasData) return;
    // ... logic at top level
    ```

3. **Simplify boolean logic:**

    ```typescript
    // Before: Complex conditions
    if (a && b || c && d || e && f) { ... }

    // After: Named helper
    const shouldProceed = meetsConditionA() || meetsConditionB() || meetsConditionC();
    if (shouldProceed) { ... }
    ```

**Note:** Only attempt S3776 fixes if effort estimate is < 15 minutes. Larger refactors should be done in dedicated tasks.

### S3358: Ternary operators should not be nested

**Before:**

```typescript
const result = condition1 ? (condition2 ? value1 : value2) : condition3 ? value3 : value4;
```

**After:**

```typescript
let result;
if (condition1 && condition2) {
    result = value1;
} else if (condition1) {
    result = value2;
} else if (condition3) {
    result = value3;
} else {
    result = value4;
}
```

Or extract to a helper function:

```typescript
const result = determineResult(condition1, condition2, condition3);
```

### S1854: Remove unused assignments

**Before:**

```typescript
let value = calculateInitial();
value = calculateFinal(); // First assignment never used
```

**After:**

```typescript
let value = calculateFinal();
```

**Note:** Ensure removing the assignment doesn't affect side effects

---

## Component Key Reference

SonarCloud uses these component keys:

-   `ag-charts-community-latest` (default) - Community package
-   `ag-charts-enterprise-latest` - Enterprise package
-   Additional packages may be added in the future

The API returns paths like:

```
ag-charts-community-latest:packages/ag-charts-core/src/utils/validation.ts
```

Strip the prefix to get the actual file path:

```
packages/ag-charts-core/src/utils/validation.ts
```

---

## Important Notes

### Safety and Verification

-   ✅ **Always format after changes:** Use `nx format` to ensure consistency
-   ✅ **Verify each batch:** Run lint and type checks for affected packages
-   ✅ **Commit frequently:** One commit per batch for easy rollback
-   ✅ **Read file context:** Always read surrounding code before making changes
-   ✅ **Preserve style:** Match existing code style and patterns
-   ❌ **Never batch-modify** without reading each file individually
-   ❌ **Don't fix issues blindly** - verify they still exist in current code
-   ❌ **Avoid complex refactors** in quick-fix mode - flag for separate tasks

### When to Skip Issues

-   **Already fixed:** Issue no longer exists in current codebase
-   **Generated code:** Files with generation markers or in generated directories
-   **Test-specific patterns:** Some patterns are acceptable in tests
-   **Complex refactoring needed:** Effort > 15 minutes per issue
-   **Requires architectural changes:** Better as dedicated task

### Error Recovery

If verification fails:

1. Review the specific errors
2. Attempt to fix the introduced issues
3. Re-run verification
4. If unable to fix within 2-3 attempts:
    - Revert the entire batch: `git reset --hard HEAD~1`
    - Report to user which batch failed and why
    - Continue with next batch if user confirms

### Testing Recommendations

After fixing significant numbers of issues:

```bash
# Run core tests
nx test ag-charts-community
nx test ag-charts-enterprise

# Run builds
nx build ag-charts-community
nx build ag-charts-enterprise

# Run benchmarks if performance-related rules were fixed
nx benchmark ag-charts-community -- -t "pattern"
```

---

## Common Issues & Troubleshooting

### Issue: WebFetch returns incomplete data

**Solution:**

-   Check if `paging.total > paging.pageSize`
-   Fetch additional pages with `&p=2`, `&p=3`, etc.
-   Combine results from all pages

### Issue: File path not found

**Solution:**

-   Verify the component prefix was stripped correctly
-   Check if file was moved/deleted since SonarCloud scan
-   Skip the issue and note it in the report

### Issue: Fix breaks tests

**Solution:**

-   Review the specific fix pattern used
-   Check if the code had hidden side effects
-   Revert the change and add to "requires manual review" list
-   Note the issue in final report

### Issue: Too many issues in one rule

**Solution:**

-   Process in smaller batches (use the limit parameter)
-   Run `/sonar-fix HIGH 20` multiple times
-   Focus on specific packages if needed

### Issue: SonarCloud API rate limiting

**Solution:**

-   The API is public and unauthenticated, rate limits are generous
-   If hit, wait briefly and retry
-   Reduce batch size to minimize API calls

---

## Workflow Summary

```
┌──────────────────────────────────────┐
│ /sonar-fix or /sonar-fix HIGH 30    │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Phase -1: Ensure Fresh Cache         │
│  - Check if cache exists & fresh     │
│  - If stale/missing: Download ALL    │
│    issues with pagination (500/page) │
│  - Combine into JSON + TSV           │
│  - Save metadata                     │
└──────────────┬───────────────────────┘
               │
               ├──────────────┬────────────────┐
               │              │                │
               ▼              ▼                ▼
      [Report Mode]    [Fix Mode]     [Cache Valid]
               │              │                │
               ▼              ▼                └──> Continue
┌──────────────────┐ ┌──────────────────────┐
│ Load from cache  │ │ Load & filter cache  │
│ Parse w/ jq      │ │ Verify issues exist  │
│ Group by rule    │ │ Check branch status  │
│ Calculate stats  │ │ Filter to verified   │
│ Show report      │ │ Group by rule        │
└──────────────────┘ └─────────┬────────────┘
                               │
                               ▼
                     ┌──────────────────────┐
                     │ Present Plan         │
                     │ → User Approval      │
                     └─────────┬────────────┘
                               │
                               ▼
                     ┌──────────────────────┐
                     │ For Each Batch:      │
                     │  1. Read rule guide  │
                     │  2. Fix issues       │
                     │  3. Track progress   │
                     │  4. Format code      │
                     │  5. Verify           │
                     │  6. Commit           │
                     │  7. Update progress  │
                     └─────────┬────────────┘
                               │
                               ▼
                     ┌──────────────────────┐
                     │ Generate Final Report│
                     │  - Read progress file│
                     │  - Show accurate stats│
                     │  - List commits      │
                     └──────────────────────┘
```

**Key Differences from Previous Version:**

1. **Phase -1 runs first:** Downloads all 500+ issues with proper pagination
2. **No WebFetch in workflow:** All data comes from local cache files
3. **Branch verification:** Checks if issues still exist before fixing
4. **Progress tracking:** Updates progress file after each fix
5. **Accurate reporting:** All counts from progress file, not LLM estimates

---

## Integration with Existing Workflows

This command complements existing tools:

-   **`/lint-fix`** - For ESLint rules (local linting)
-   **`/sonar-fix`** - For SonarCloud issues (cloud-based static analysis)
-   **`/pr-review`** - For reviewing PRs (can check if SonarCloud issues were addressed)

Consider running both `/lint-fix` and `/sonar-fix` as part of regular code quality maintenance.
