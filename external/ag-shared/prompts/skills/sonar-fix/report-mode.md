# Report Mode (No Arguments)

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
