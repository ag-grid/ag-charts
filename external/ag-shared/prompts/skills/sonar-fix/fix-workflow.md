# Fix Mode Workflow

Full workflow for fixing SonarCloud issues when invoked with arguments.

---

## Phase 0: Ensure Rule Guides Exist

**Before fetching issues, ensure rule-specific guides are available:**

1. **Check for existing guides:**

    Rule guides are located in `.rulesync/skills/sonar-fix/guides/` directory.

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

    ### Important Exceptions

    ⚠️ **If this rule has known exceptions in the AG Charts codebase, document them here.**

    Use this section to list patterns that match the rule but are intentionally used and MUST NOT be changed.

    Format:

    -   **Pattern description**: Explain why this is an exception
    -   **Example location**: File patterns or specific locations
    -   **Rationale**: Why the exception is necessary

    Example:
    ```

    ### Important Exceptions

    Accesses to `globalThis.window` and `globalThis.document` are intentionally
    checked with `typeof` to ensure they are defined - this is VERY IMPORTANT for
    the proper functioning of the codebase, DO NOT FIX IN THESE FILES as it will
    break server-side rendering support in Astro.

    **Affected patterns:**

    - `typeof globalThis.window !== 'undefined'`
    - `typeof globalThis.document !== 'undefined'`

    **Rationale:** These global objects may not exist in SSR environments, and
    direct access would throw ReferenceError.

    ```

    ```

    c. **Save to:** `.rulesync/skills/sonar-fix/guides/{rule-number}-{description}.md`

    d. **Update README.md:** Add entry to the appropriate tier table in `.rulesync/skills/sonar-fix/guides/README.md`

3. **Reference during fixing:**

    When processing issues in Phase 3, read the appropriate guide to inform your fixes.

---

## Phase 1: Load from Cache and Verify Issues

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
        context=$(sed -n "$((line-3)),$((line+3))p" "$file" 2>/dev/null || echo "")

        if [ -z "$context" ]; then
            jq --arg key "$key" --arg status "line-not-found" \
                '.verified[$key] = {status: $status, checkedAt: (now | todate)}' \
                "$progress_file" > "$progress_file.tmp" && mv "$progress_file.tmp" "$progress_file"
        else
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

5. **Filter out known exceptions (if documented):**

    ```bash
    # For each rule, check if there's a guide with documented exceptions
    # Example: S7741 has exceptions for globalThis.window and globalThis.document
    jq '[.[] | select(
        .rule != "typescript:S7741" or
        (.component | contains("globalThis.window") | not) and
        (.component | contains("globalThis.document") | not)
    )]' node_modules/.cache/sonar-issues/processed/verified-issues.json \
        > node_modules/.cache/sonar-issues/processed/filtered-exceptions.json || \
    cp node_modules/.cache/sonar-issues/processed/verified-issues.json \
       node_modules/.cache/sonar-issues/processed/filtered-exceptions.json

    exceptions_removed=$(($(jq '. | length' node_modules/.cache/sonar-issues/processed/verified-issues.json) - \
                          $(jq '. | length' node_modules/.cache/sonar-issues/processed/filtered-exceptions.json)))

    if [ $exceptions_removed -gt 0 ]; then
        echo "Pre-filtered $exceptions_removed known exceptions"
    fi
    ```

6. **Group by rule type and prioritize:**

    ```bash
    # Group issues by rule for batch processing
    jq 'group_by(.rule) | map({
        rule: .[0].rule,
        count: length,
        severity: .[0].impacts[0].severity,
        issues: .
    }) | sort_by(.severity, -.count)' \
        node_modules/.cache/sonar-issues/processed/filtered-exceptions.json \
        > node_modules/.cache/sonar-issues/processed/batched-issues.json

    echo "Grouped into batches by rule type"
    ```

---

## Phase 2: Present Plan to User

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

-   ✅ Run `yarn nx format` to ensure formatting
-   ✅ Run `yarn nx lint <affected-packages>` to verify no new issues
-   ✅ Run `yarn nx build:types <affected-packages>` to catch type errors
-   ✅ Create commit with descriptive message

### Skipped Issues (Tier 3 - Complex)

These require more careful refactoring and should be addressed separately:

-   S3776 (Cognitive Complexity): 85 issues (~18h effort)

**Proceed with this plan? (yes/no/modify)**
```

Wait for user confirmation before proceeding.

---

## Phase 2.5: Identify Issues for SonarCloud Feedback

**After user approves the fix plan, check if any issues should be marked in SonarCloud:**

1. **Analyze issues for feedback candidates:**

    Issues that should be marked in SonarCloud rather than fixed:

    - **False Positives:** Static analysis incorrectly flagged valid code
    - **Won't Fix (Accepted):** Valid issues but intentionally not fixing now
    - **Exceptions:** Issues that match documented exception patterns

2. **Generate feedback proposal:**

    ```markdown
    ## SonarCloud Feedback Proposal

    The following issues should be marked in SonarCloud with explanatory comments:

    ### False Positives (N issues)

    **Rule:** typescript:S7763 (prefer export-from)
    **Count:** 55 issues
    **Reason:** False positive - modules are used locally in array declarations
    **Example locations:**

    -   packages/ag-charts-community/src/main-modules.ts (16 issues)
    -   packages/ag-charts-enterprise/src/main-modules.ts (39 issues)

    **Action:** Mark as FALSE_POSITIVE with comment:
    ```

    AG-16097: False positive - these modules are used locally in array declarations
    (e.g., `export const DEFAULT_CARTESIAN_CHART_MODULES = [CartesianChartModule, ...]`),
    not just re-exported. Static analysis does not recognize this pattern.

    ```

    ### Accepted Technical Debt (N issues)

    **Rule:** typescript:S1134 (FIXME comments)
    **Count:** 7 issues
    **Reason:** Legitimate technical debt items

    **Action:** Mark as ACCEPTED with comment:
    ```

    AG-16097: Accepted - these FIXME comments represent legitimate technical debt
    or blocked work.

    ```

    ---

    **Do you want to apply this feedback to SonarCloud?** (yes/no)
    ```

3. **Wait for user approval:**

    If user approves ("yes"), proceed to Phase 2.6.
    If user declines ("no"), skip to Phase 3.

---

## Phase 2.6: Apply SonarCloud Feedback

**Only runs if user approved feedback in Phase 2.5.**

1. **Generate feedback configuration:**

    Create a JSON file with feedback details using specific issue keys (NOT rule patterns):

    ```bash
    # Fetch specific issue keys for the rules you want to mark
    SONAR_PROJECT=ag-charts-community-latest npx tsx external/prompts/commands/sonar-fix/scripts/fetch-issue-keys.ts \
        typescript:S7763 typescript:S1134 > /tmp/issue-keys.json

    # Create config with explicit issue keys (safer than rule-based marking)
    cat > node_modules/.cache/sonar-issues/feedback-config.json <<'EOF'
    {
      "batches": [
        {
          "name": "S7763 False Positives",
          "issueKeys": ["AZlyINco-RX8W3KQpDew", "..."],
          "transition": "falsepositive",
          "comment": "AG-16097: False positive - modules are used locally in array declarations."
        },
        {
          "name": "S1134 Technical Debt",
          "issueKeys": ["AZmp9wCvSTSzM_9DH9_M", "..."],
          "transition": "accept",
          "comment": "AG-16097: Accepted - legitimate technical debt items."
        }
      ]
    }
    EOF
    ```

2. **Execute feedback script:**

    ```bash
    if [ -z "$SONAR_TOKEN" ]; then
        echo "⚠️  SONAR_TOKEN not set. Skipping SonarCloud feedback."
        echo "   To enable: export SONAR_TOKEN=<your-token>"
        echo "   Generate token at: https://sonarcloud.io/account/security"
    else
        echo "Applying feedback to SonarCloud..."
        SONAR_PROJECT=ag-charts-community-latest npx tsx .rulesync/skills/sonar-fix/scripts/mark-specific-issues.ts \
            --config node_modules/.cache/sonar-issues/feedback-config.json
        echo "✓ Feedback applied successfully"
    fi
    ```

3. **Update cache after feedback:**

    ```bash
    marked_keys=$(jq -r '.batches[].issueKeys[]' node_modules/.cache/sonar-issues/feedback-config.json)

    jq --argjson keys "$(echo $marked_keys | jq -R 'split(" ")')" '
        [.[] | select(.key as $k | $keys | index($k) | not)]
    ' node_modules/.cache/sonar-issues/processed/verified-issues.json \
        > node_modules/.cache/sonar-issues/processed/verified-issues-after-feedback.json

    jq --argjson keys "$(echo $marked_keys | jq -R 'split(" ")')" '
        map({
            rule: .rule,
            count: .count,
            severity: .severity,
            issues: [.issues[] | select(.key as $k | $keys | index($k) | not)]
        }) | map(select(.issues | length > 0))
    ' node_modules/.cache/sonar-issues/processed/batched-issues.json \
        > node_modules/.cache/sonar-issues/processed/batched-issues-after-feedback.json

    remaining=$(jq '. | length' node_modules/.cache/sonar-issues/processed/verified-issues-after-feedback.json)
    echo "Remaining issues to fix: $remaining"
    ```

---

## Phase 3: Parallel Batch Execution Using Sub-Agents

**IMPORTANT:** Use parallel sub-agents for efficient execution of multiple batches.

1. **Create todo list for tracking:**

    ```javascript
    TodoWrite with one entry per batch:
    - Batch 1: Fix S7767 issues (10 issues, HIGH)
    - Batch 2: Fix S7741 issues (11 issues, LOW)
    - ... etc
    ```

2. **Launch sub-agents in parallel:**

    For each batch from the batched-issues.json, launch a `general-purpose` sub-agent with a comprehensive prompt.

    **Launch up to 4-5 agents in parallel** to maximize throughput while avoiding overwhelming the system.

    **Sub-agent prompt template:**

    ```markdown
    Fix all SonarCloud {RULE_ID} issues ({RULE_DESCRIPTION}).

    **Rule Guide:** Check if a guide exists at `.rulesync/skills/sonar-fix/guides/{RULE_NUMBER}-{kebab-case}.md`.
    If not, create one using the SonarCloud API:

    -   URL: https://sonarcloud.io/api/rules/show?key={encoded-rule-id}&organization=ag-grid
    -   Extract rule details, examples, and create guide following standard structure

    **CRITICAL: Check for Exceptions**
    Before fixing ANY issue, read the rule guide's "Important Exceptions" section (if present).
    Some patterns that match the rule are intentionally used and MUST NOT be changed.
    For each file, verify it's not covered by an exception pattern before applying the fix.

    **Issues to fix ({COUNT} total):**
    {LIST_OF_FILES_AND_LINES}

    **Fix pattern:** {BRIEF_DESCRIPTION}

    **Instructions:**

    1. Read the rule guide and note any exceptions in the "Important Exceptions" section
    2. Read each file and locate the issue
    3. Verify the issue still exists (may have been fixed already)
    4. Check if the issue matches any exception pattern - if so, SKIP IT
    5. Apply the fix using the rule guide patterns (only for non-exception cases)
    6. After all fixes, run: `yarn nx format`
    7. Verify: `yarn nx lint {affected-packages}`
    8. Verify: `yarn nx build:types {affected-packages}`
    9. Create ONE commit with message:
    ```

    Fix SonarCloud {RULE_ID} issues

    {Description of changes}

    Fixed N violations across M files.

    Affected packages:

    - {package-list}

    Rule: {RULE_ID} - {RULE_DESCRIPTION}

    ```

    Return: Commit hash and summary of fixes.
    ```

3. **Monitor sub-agent execution:**

    - Mark batches as `in_progress` when agents start
    - Mark as `completed` when agent returns with commit hash
    - If an agent reports issues, investigate and potentially re-run

4. **Handle agent results:**

    As each agent completes:

    a. **Verify the commit was created:**

    ```bash
    git log --oneline -1
    ```

    b. **Update todo list** to mark batch as completed

    c. **Continue with remaining agents** until all complete

5. **Benefits of parallel execution:**

    - ✅ **Speed:** Multiple batches processed simultaneously
    - ✅ **Isolation:** Each agent works independently on separate files
    - ✅ **Rollback:** Each batch is a separate commit for easy revert
    - ✅ **Scalability:** Can handle large numbers of issues efficiently
    - ✅ **Token efficiency:** Sub-agents have fresh token budgets

6. **When NOT to use parallel execution:**

    - ❌ If batches affect the same files (potential conflicts)
    - ❌ If there are < 3 batches (overhead not worth it)
    - ❌ If user specifically requests sequential execution

7. **Conflict resolution:**

    If multiple agents modify the same file:

    - The first agent to commit wins
    - Subsequent agents may fail with merge conflicts
    - Re-run failed agents after pulling latest changes

---

## Phase 4: Final Report

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
```

**Report template:**

```markdown
## SonarCloud Fix Session Complete

### Summary

-   **Requested:** N issues
-   **Actually Fixed:** N issues
-   **Skipped:** N issues (already fixed, too complex, etc.)
-   **Total Processed:** N issues

### Breakdown by Rule

| Rule | Fixed | Skipped |
| ---- | ----- | ------- |
| ... | ... | ... |

### Commits Created

- commit messages (hashes)

### Remaining Issues

**Still open in SonarCloud:** ~N issues

**Recommendations:**

-   Run `/sonar-fix` again to see updated report
-   Verify changes with `yarn nx test ag-charts-community` and `yarn nx test ag-charts-enterprise`
-   Cache will auto-refresh in 1 hour

**SonarCloud Link:** https://sonarcloud.io/project/issues?id=ag-charts-community-latest&issueStatuses=OPEN%2CCONFIRMED
```

**Note:** All statistics come from the progress file, ensuring accurate counts that match what was actually processed.
