# SonarCloud Issue Marker Script

Automates marking SonarCloud issues as "false positive" or "accepted" with explanatory comments.

## Prerequisites

1. **Generate a SonarCloud Token:**

    - Go to https://sonarcloud.io/account/security
    - Generate a new token with appropriate permissions
    - Save the token securely

2. **Verify Permissions:**

    - You need "Administer Issues" permission on the `ag-grid_ag-charts` project
    - Contact your SonarCloud organization admin if you don't have this permission

3. **Create a Config File:**
    - The script requires a config file specifying which issues to mark
    - See config file format below

## Config File Format

Create a JSON file with the following structure:

```json
{
    "batches": [
        {
            "name": "S7763 False Positives",
            "ruleKeys": ["typescript:S7763"],
            "transition": "falsepositive",
            "comment": "AG-16097: False positive - these modules are used locally in array declarations."
        },
        {
            "name": "S1134 Technical Debt",
            "ruleKeys": ["typescript:S1134"],
            "transition": "accept",
            "comment": "AG-16097: Accepted - legitimate technical debt items."
        }
    ]
}
```

**Field Descriptions:**

-   **name** (required): Human-readable batch description
-   **ruleKeys** (required): Array of SonarCloud rule IDs to mark (e.g., `["typescript:S7763"]`)
-   **transition** (required): Either `"falsepositive"` or `"accept"`
-   **comment** (required): Explanatory text added to each issue

## Usage

### Dry Run (Recommended First Step)

Test the script to see what would be marked without making actual changes:

```bash
DRY_RUN=true SONAR_TOKEN=your_token npx tsx tools/scripts/mark-sonar-issues.ts --config feedback-config.json
```

This will show you:

-   How many OPEN issues match each rule
-   Which specific issues would be marked
-   The transition type and comment that would be applied

### Execute

Once you've verified the dry run output, execute the script:

```bash
SONAR_TOKEN=your_token npx tsx tools/scripts/mark-sonar-issues.ts --config feedback-config.json
```

## Integration with `/sonar-fix` Workflow

This script is automatically integrated into the `/sonar-fix` workflow:

1. **Phase 2.5:** Workflow analyzes issues and generates a feedback proposal
2. **User Review:** You review which issues will be marked and why
3. **User Approval:** You approve the feedback with "yes"
4. **Config Generation:** Workflow creates `node_modules/.cache/sonar-issues/feedback-config.json`
5. **Script Execution:** This script runs with the generated config
6. **Cache Update:** Marked issues are removed from the fix queue

## How It Works

The script performs the following steps for each batch:

1. **Search:** Queries SonarCloud API for OPEN issues matching the rule keys
2. **Comment:** Adds explanatory comment to each matching issue
3. **Transition:** Changes issue status to either `FALSE_POSITIVE` or `ACCEPTED`
4. **Rate Limiting:** Waits 100ms between API calls to avoid rate limits

**Why OPEN issues only?**

The script only processes issues with status `OPEN` (not `CONFIRMED`, `ACCEPTED`, `FALSE_POSITIVE`, etc.) to:

-   Avoid re-marking already-processed issues
-   Provide accurate counts of issues that will be affected
-   Match the issue counts shown in the `/sonar-fix` workflow

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
-   Request "Administer Issues" permission on the project

### No Issues Found

**Possible reasons:**

-   Issues may have already been marked/resolved
-   Project key might be incorrect
-   Issues might be on a different branch
-   Rule keys in config might be incorrect

**Verify:**

```bash
# Check current OPEN issues for a specific rule
curl -u "YOUR_TOKEN:" \
  "https://sonarcloud.io/api/issues/search?componentKeys=ag-grid_ag-charts&rules=typescript:S7763&issueStatuses=OPEN"
```

### Config File Errors

**Error:** "Config must have a 'batches' array"

**Solution:** Ensure your config file has the correct JSON structure with a `batches` array at the top level.

**Error:** "Each batch must have..."

**Solution:** Verify each batch has all required fields: `name`, `ruleKeys`, `transition`, and `comment`.

## API Endpoints Used

-   `GET /api/issues/search` - Search for OPEN issues by rule
-   `POST /api/issues/add_comment` - Add explanatory comments
-   `POST /api/issues/do_transition` - Change issue status

## Example: Manual Usage

Create a config file `my-feedback.json`:

```json
{
    "batches": [
        {
            "name": "Mark false positive arrow function rules",
            "ruleKeys": ["typescript:S3524"],
            "transition": "falsepositive",
            "comment": "AG-12345: False positive - these arrow functions are intentionally used for proper 'this' binding in event handlers."
        }
    ]
}
```

Run in dry-run mode first:

```bash
DRY_RUN=true SONAR_TOKEN=squ_abc123... npx tsx tools/scripts/mark-sonar-issues.ts --config my-feedback.json
```

If the output looks correct, execute:

```bash
SONAR_TOKEN=squ_abc123... npx tsx tools/scripts/mark-sonar-issues.ts --config my-feedback.json
```

## References

-   [SonarCloud Web API Documentation](https://sonarcloud.io/web_api)
-   [Editing Issues in SonarCloud](https://docs.sonarsource.com/sonarqube-cloud/managing-your-projects/issues/editing)
-   [Issue Status Transitions](https://docs.sonarsource.com/sonarqube-cloud/managing-your-projects/issues/introduction)
