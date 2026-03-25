---
targets: ['*']
name: triage-rt
description: >-
    Triage JIRA tickets found during release testing. Use when triaging release
    test issues, assessing regressions, categorising bugs found in a release
    branch, evaluating fix risk/scope, or checking for duplicate tickets. Invoke
    with /triage-rt CRT-XXXXX (Charts) or /triage-rt RTI-XXXXX (Grid), or
    /triage-rt followed by a description of the issue. Also use when the user says
    "triage this", "is this a regression", "should we fix this in the release",
    "check for duplicates", or any release-testing prioritisation discussion.
context: fork
---

# Release Testing Triage

Triage issues found during release testing to determine classification, regression status, fix scope/risk, and whether duplicates already exist.

## Step 0: Verify Atlassian MCP

Call `mcp__atlassian__atlassianUserInfo`. If unavailable:

```
Cannot proceed — Atlassian MCP is not connected.
This skill requires the Atlassian MCP server to interact with JIRA.
Please ensure the MCP connection is configured and active, then retry.
```

Hard stop — do not proceed without the MCP.

## Step 1: Gather Issue Context

### If given a JIRA ticket ID

Release testing tickets use product-specific projects:

-   **Charts**: `CRT-XXXXX` (project key `CRT`)
-   **Grid**: `RTI-XXXXX` (project key `RTI`)

Fetch full details with `mcp__atlassian__getJiraIssue`:

-   Title, description, comments, attachments
-   Affected version, components, labels
-   Linked issues

### If given a description without a ticket

Work with the description as provided. Note that some assessments (affected version, linked issues) will be limited.

### Identify the product

-   **AG Charts**: repos containing `ag-charts-community` — use project `AG`, component `Charts`
-   **AG Grid**: repos containing `ag-grid-community` — use project `AG`, component `Grid`

### Determine the release context

Identify the current release branch by checking the current git branch (pattern: `bX.Y.Z`). This establishes what "the release" means for regression analysis.

### Determine the regression baseline

The baseline for regression analysis is the **previous release branch** — the
version currently live in production. Derive it from the current branch:

-   If current is `bX.Y.0`, previous is `bX.(Y-1).0`
-   If current is `bX.Y.Z` where Z>0, previous is `bX.Y.0` (or the prior patch)

Verify the baseline branch exists: `git branch -r | grep <previous-branch>`.
If not found, fall back to the most recent release tag (`git tag --list 'vX.*'
--sort=-v:refname | head -1`).

This baseline is critical: a regression is any issue introduced **since the
previous release**, not just since `latest`. Most changes land on `latest`
between releases, so comparing only `origin/latest..HEAD` misses the majority
of the delta users will experience.

## Step 2: Classify the Issue Category

Determine which area the issue falls into:

| Category    | Signals                                                                                                                                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Library** | Bug in chart rendering, data processing, interactions, API behaviour, layout, animation, performance. The core packages (`ag-charts-community`, `ag-charts-enterprise`, framework wrappers) need code changes. |
| **Docs**    | Incorrect or missing documentation text, wrong API descriptions, broken page layout on the docs site, misleading guidance. Fix is in documentation content (`.mdoc` files, doc page configuration).            |
| **Example** | A gallery or docs example is broken, shows wrong output, has incorrect code, or doesn't demonstrate what it claims. Fix is in example files only.                                                              |
| **Website** | Website infrastructure issue — broken links, styling problems, build failures, search not working, navigation bugs. Not about chart library behaviour.                                                         |

When uncertain, check whether the issue reproduces in a standalone Plunker/CodeSandbox (library) or only on the docs site (docs/example/website).

## Step 3: Assess Regression Status

Determine whether the issue is a regression introduced in the current release branch, or a pre-existing problem.

### Approach

Use the **regression baseline** (previous release branch/tag) determined in
Step 1 as the comparison point. This captures all changes users will experience
— both those merged to `latest` since the last release and those added directly
to the release branch.

1. **Check the full changelog since the previous release**: Run
   `git log --oneline <baseline>..HEAD` to see everything that changed since
   the last shipped version. This is the primary comparison.

2. **Identify relevant code areas**: Based on the issue description, determine
   which source files and modules are likely involved. Use grep/glob to find
   relevant files.

3. **Check for related changes** in the relevant files since the baseline:

    ```
    git log --oneline <baseline>..HEAD -- <relevant-file-paths>
    ```

    If there are many commits, also check what landed on the release branch
    specifically: `git log --oneline origin/latest..HEAD -- <relevant-file-paths>`

4. **Check affected version** (if available on the ticket): If the ticket
   specifies an affected version, compare it against the previous release to
   determine if this is new.

5. **Classify**:
    - **Regression**: Code in the relevant area was changed since the previous
      release, and the issue is plausibly caused by those changes. Note which
      commit(s) likely introduced it and whether they landed on `latest` or
      directly on the release branch.
    - **Pre-existing**: No relevant changes since the previous release, or the
      issue is known to exist in the prior version.
    - **Unknown**: Cannot determine with confidence — recommend manual version
      testing or git bisect.

### Regression signals (strong indicators)

-   Commits since the previous release touching the exact module/file where the
    bug manifests
-   The issue area was refactored or had a feature added in this release cycle
-   The affected version matches the current release branch version

### Pre-existing signals

-   No commits touching the relevant area since the previous release
-   Issue reproduced on the prior released version (if tested)
-   Issue relates to a long-standing architectural limitation

## Step 4: Library Impact Assessment

**Only perform this step if the category is "Library".**

Read `references/scope-risk.md` for detailed guidance, then assess:

### Scope of Change

How much code needs changing to fix this, and how much existing testing does the fix invalidate?

| Scope        | Description                                                                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Narrow**   | Fix is isolated to a single module or series type. Only directly related tests need re-running.                                                      |
| **Moderate** | Fix touches shared utilities or a base class used by several features. Related features need regression testing.                                     |
| **Wide**     | Fix is in core infrastructure (scene graph, layout engine, data model, animation system). Broad regression testing required across many chart types. |

To assess scope:

1. Identify the likely fix location by searching the codebase for the relevant code
2. Check the class hierarchy — does the file extend a base class used by many series/features?
3. Check imports — how many other modules import from the affected file?
4. List specific test suites that would need re-running

### Risk of Change

How likely is it that the fix introduces unintended side-effects?

| Risk       | Description                                                                                                                                                                |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Low**    | Fix is additive or changes only cosmetic/configuration behaviour. Clear, testable change with no shared-state implications.                                                |
| **Medium** | Fix modifies logic in a moderately shared area. Side-effects are possible but can be caught by existing visual regression tests.                                           |
| **High**   | Fix touches core rendering pipeline, layout algorithm, or data processing that affects many chart types. High probability of subtle regressions without extensive testing. |

Risk amplifiers to watch for:

-   Changes to `AbstractSeries`, `CartesianSeries`, or other base classes (affects ALL series types)
-   Changes to scene graph nodes (`Group`, `Selection`, `Node`)
-   Changes to layout/sizing logic (`BBox`, `layoutService`)
-   Changes to data model or data processing pipeline
-   Changes to animation or transition infrastructure
-   Theme integration changes (affect every theme variant)

### Feature Prominence

How widely used is the affected feature? A bug in a core feature that appears on most charts is more impactful than one in a specialised feature that few users encounter.

| Prominence      | Features                                                                                                                                                                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Core**        | Axes (category, number, time), legend, titles/subtitles, tooltips, bar series, line series, area series, pie/donut series, gridlines, crosshairs, labels. These appear on most common chart configurations — bugs here affect the majority of users. |
| **Common**      | Scatter series, bubble series, histogram, range bar/area, secondary axes, navigator, zoom, context menu, animation. Widely used but not on every chart.                                                                                              |
| **Specialised** | Treemap, sunburst, sankey, chord, heatmap, waterfall, box plot, bullet, radar/radial, map series, annotations, financial chart types (candlestick, OHLC, range-area). Used for specific visualisation needs by a smaller subset of users.            |

Feature prominence affects the urgency calculus:

-   **Core + regression** = high urgency — most users will hit this.
-   **Specialised + pre-existing** = lower urgency — fewer users affected and they've been living with it.
-   A bug in a specialised feature can still be high urgency if it completely breaks that feature (e.g., treemap renders nothing), versus a cosmetic issue in a core feature.

## Step 5: Search for Existing Tickets

Search JIRA for tickets that may already cover this issue:

1. **Extract key terms** from the issue description (feature area, symptom, chart type, API options involved).

2. **Search open tickets**:

    ```
    mcp__atlassian__searchJiraIssuesUsingJql
    project = AG AND component = Charts AND status not in (Done, Closed, Resolved) AND text ~ "<key terms>"
    ```

3. **Search recently resolved tickets** (they may have been fixed but not yet released):

    ```
    project = AG AND component = Charts AND status in (Done, Closed, Resolved) AND resolved >= -90d AND text ~ "<key terms>"
    ```

4. **Check linked issues** on the ticket (if available) for related context.

5. **Report findings**:
    - Exact duplicates (same root cause)
    - Related tickets (same area, different symptom)
    - Recently resolved tickets that may already fix this

If duplicates are found, note whether they're in the current release scope (fix version matches the release branch) or not.

## Step 6: Identify Suggested Assignee

Determine who is best placed to fix the issue based on code authorship.

### Approach

1. **Check authors since the previous release**: If the regression analysis (Step 3) identified commits that likely introduced the issue, the author of those commits is the strongest candidate — they have the freshest context on the changed code.

    ```
    git log --format='%an' <baseline>..HEAD -- <relevant-file-paths> | sort | uniq -c | sort -rn
    ```

2. **Fall back to recent authorship**: If no release branch changes were found (pre-existing issue), check who has most recently and most frequently worked on the affected files:

    ```
    git log --format='%an' -20 -- <relevant-file-paths> | sort | uniq -c | sort -rn
    ```

3. **Check git blame for the specific area**: For pinpointed bugs where you've identified the likely problematic lines, `git blame` on that region gives the most precise author.

4. **Report the top 1-2 candidates** with a brief rationale (e.g., "authored the AG-15840 deferred DOM proxy changes" or "most recent author of tooltip.ts with 12 commits in the last 6 months").

## Step 7: Produce Triage Report

Output a structured report in this format:

```markdown
## Triage Report: [Ticket ID or Issue Title]

### Classification

-   **Category**: Library | Docs | Example | Website
-   **Regression**: Yes (introduced by [commit/PR]) | No (pre-existing) | Unknown
-   **Severity assessment**: [Your assessment based on user impact]

### Regression Analysis

[Summary of how you determined regression status. Which commits were checked,
what changes were found or not found.]

### Library Impact (if applicable)

-   **Affected area**: [e.g., Bar series rendering, Axis tick layout, Tooltip positioning]
-   **Feature prominence**: Core | Common | Specialised
    -   [Why this classification, how many users are likely affected]
-   **Scope of change**: Narrow | Moderate | Wide
    -   [What needs changing and what testing is invalidated]
-   **Risk of change**: Low | Medium | High
    -   [Why this level of risk, what could go wrong]

### Suggested Assignee

-   **Primary**: [Name] — [rationale, e.g., "authored the AG-15840 commits that likely introduced this"]
-   **Secondary**: [Name] — [rationale, e.g., "most frequent recent contributor to tooltip.ts"]

### Existing Tickets

-   **Duplicates found**: [List with ticket IDs and titles, or "None found"]
-   **Related tickets**: [List with ticket IDs and titles, or "None found"]
-   **In release scope**: [Whether any related fixes are already planned for this release]

### Recommendation

[One of:]

-   **Fix in release**: Low risk, narrow scope, regression — should be fixed before release.
-   **Fix in release (with caution)**: Worth fixing but needs careful testing due to scope/risk.
-   **Defer to next release**: Pre-existing issue, wide scope, or high risk — not worth the release risk.
-   **Needs investigation**: Cannot fully assess — recommend [specific next steps].
-   **Duplicate**: Already covered by [ticket ID] — link and close/deprioritise.
```

### Recommendation logic

The recommendation balances regression status, scope, and risk:

-   **Regressions** should almost always be fixed in the release (we don't want to ship new bugs). The question is how carefully.
-   **Pre-existing issues** need a stronger justification for inclusion — narrow scope AND low risk.
-   **Wide scope + high risk** fixes late in a release cycle are dangerous regardless of regression status. Consider whether a targeted workaround exists instead.
-   **Duplicates** should be linked, not independently fixed.

Present the recommendation clearly but recognise that the final call is the user's — provide the evidence and reasoning, not just the verdict.
