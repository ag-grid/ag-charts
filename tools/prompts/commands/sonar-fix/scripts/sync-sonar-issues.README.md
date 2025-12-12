# SonarCloud Issue Sync Script

Syncs accepted issues and false positives from one SonarCloud project to another. This is designed for syncing exceptions from the development project (`ag-charts-community-latest`) to the release project (`ag-charts-community`).

## Prerequisites

1. **Generate a SonarCloud Token:**

    - Go to https://sonarcloud.io/account/security
    - Generate a new token with appropriate permissions
    - Save the token securely

2. **Verify Permissions:**

    - You need "Administer Issues" permission on **both** source and target projects
    - Contact your SonarCloud organization admin if you don't have this permission

## Usage

### Basic Usage

```bash
SONAR_TOKEN=your_token npx tsx tools/prompts/commands/sonar-fix/scripts/sync-sonar-issues.ts
```

### Dry Run (Recommended First Step)

Preview what would be synced without making changes:

```bash
SONAR_TOKEN=your_token npx tsx tools/prompts/commands/sonar-fix/scripts/sync-sonar-issues.ts --dry-run
```

### With Verbose Output

Show detailed matching information:

```bash
SONAR_TOKEN=your_token npx tsx tools/prompts/commands/sonar-fix/scripts/sync-sonar-issues.ts --dry-run --verbose
```

### Custom Project Keys

Specify different source and target projects:

```bash
SONAR_TOKEN=your_token npx tsx tools/prompts/commands/sonar-fix/scripts/sync-sonar-issues.ts \
  --source ag-charts-community-latest \
  --target ag-charts-community
```

## Command Line Options

| Option           | Description                                                |
| ---------------- | ---------------------------------------------------------- |
| `--source <key>` | Source project key (default: `ag-charts-community-latest`) |
| `--target <key>` | Target project key (default: `ag-charts-community`)        |
| `--dry-run`      | Preview matches without applying changes                   |
| `--verbose`      | Show detailed matching information                         |
| `--help`         | Show help message                                          |

## How It Works

1. **Fetch Accepted Issues:** Queries the source project for issues with status `ACCEPTED` or `FALSE_POSITIVE`

2. **Fetch Open Issues:** Queries the target project for issues with status `OPEN`

3. **Match Issues:** Creates a unique signature for each issue based on:

    - Rule ID (e.g., `typescript:S7741`)
    - File path (normalized to remove project key prefix)
    - Line number
    - Issue message

4. **Apply Transitions:** For each matched issue in the target project:

    - Adds a comment explaining the sync source
    - Applies the same transition (accept or falsepositive)

5. **Report Results:** Shows summary of synced and unmatched issues

## Issue Matching

Issues are matched using **exact matching** on:

-   **Rule:** The SonarCloud rule ID (e.g., `typescript:S7741`)
-   **File:** The file path, normalized to remove project key prefixes
-   **Line:** The exact line number
-   **Message:** The issue message text

This strict matching ensures only identical issues are synced, avoiding false matches.

### Why Exact Matching?

-   **Safety:** Prevents accidentally syncing to the wrong issue
-   **Accuracy:** Line numbers and messages must match exactly
-   **Predictability:** No ambiguity about which issues will be affected

### Unmatched Issues

Issues may be unmatched if:

-   The file was removed or renamed in the release branch
-   The line number changed due to code modifications
-   The issue was already resolved in the target project
-   The issue message differs (e.g., due to code changes)

Unmatched issues are logged for manual review.

## CI/CD Integration

This script is integrated into the release workflow via `.github/workflows/sonar-scanner-release.yml`. After the SonarCloud scan runs on the release project, this script automatically syncs accepted issues from the development project.

### Manual Trigger

The workflow can also be triggered manually via GitHub Actions:

1. Go to **Actions** > **Sonar Scanner (Release)**
2. Click **Run workflow**
3. Select the branch and run

## Example Output

```
SonarCloud Issue Sync
=====================
Source: ag-charts-community-latest
Target: ag-charts-community

Fetching accepted issues from source...
  Found 47 accepted/false-positive issues
Fetching open issues from target...
  Found 523 open issues

Matching issues...
  Matched: 45/47
  Unmatched: 2

Applying transitions...
  ✓ AY123abc -> accept (packages/ag-charts-core/src/util.ts)
  ✓ AY456def -> falsepositive (packages/ag-charts-community/src/series.ts)
  ...

Results: 45 succeeded, 0 failed

--- Summary by Rule ---
  typescript:S7741: 20 synced
  typescript:S6836: 15 synced (2 unmatched)
  typescript:S7763: 10 synced

✓ Complete
```

## Troubleshooting

### Authentication Errors

**Error:** `401 Unauthorized`

**Solution:**

-   Verify your token is correct
-   Ensure the token hasn't expired
-   Generate a new token if needed

### Permission Errors

**Error:** `403 Forbidden` or "Insufficient privileges"

**Solution:**

-   Contact your SonarCloud organization admin
-   Request "Administer Issues" permission on both projects

### No Issues Found

**Possible reasons:**

-   Source project has no accepted issues
-   All issues have already been synced
-   Project keys are incorrect

**Verify:**

```bash
# Check accepted issues in source
curl -u "YOUR_TOKEN:" \
  "https://sonarcloud.io/api/issues/search?componentKeys=ag-charts-community-latest&issueStatuses=ACCEPTED,FALSE_POSITIVE&ps=10"
```

### High Unmatched Count

**Possible reasons:**

-   Significant code changes between projects
-   Different branch contents
-   Files removed or renamed

**Solution:**

-   Review unmatched issues with `--verbose` flag
-   Consider running with the release branch checked out
-   Manually review and mark remaining issues

## API Endpoints Used

-   `GET /api/issues/search` - Search for issues by status
-   `POST /api/issues/add_comment` - Add explanatory comments
-   `POST /api/issues/do_transition` - Change issue status

## References

-   [SonarCloud Web API Documentation](https://sonarcloud.io/web_api)
-   [Editing Issues in SonarCloud](https://docs.sonarsource.com/sonarqube-cloud/managing-your-projects/issues/editing)
-   [Issue Status Transitions](https://docs.sonarsource.com/sonarqube-cloud/managing-your-projects/issues/introduction)
