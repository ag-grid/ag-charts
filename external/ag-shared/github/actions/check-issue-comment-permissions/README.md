# Check Issue Comment Permissions Action

A reusable GitHub Action that checks if a user has permission to execute slash commands via issue comments based on their GitHub author association.

## Purpose

This action helps secure GitHub workflows that can be triggered by issue comments (e.g., `/benchmarks`, `/deploy`, etc.) by verifying the commenter has appropriate permissions before allowing the workflow to proceed.

## Usage

```yaml
- name: Check user permissions
  id: check-permissions
  uses: ./external/ag-shared/github/actions/check-issue-comment-permissions
  with:
    command: '/benchmarks'
    allowed_associations: 'OWNER,MEMBER,COLLABORATOR'
    post_denial_message: 'true'
    denial_message_template: '❌ @{user} Sorry, you don\'t have permission to run `{command}`.'
```

## Inputs

| Input                     | Description                                                                        | Required | Default                     |
| ------------------------- | ---------------------------------------------------------------------------------- | -------- | --------------------------- |
| `command`                 | The slash command to check permissions for (e.g., `/benchmarks`)                   | Yes      | -                           |
| `allowed_associations`    | Comma-separated list of allowed author associations                                | No       | `OWNER,MEMBER,COLLABORATOR` |
| `post_denial_message`     | Whether to post a denial message on the issue                                      | No       | `true`                      |
| `denial_message_template` | Template for denial message. Use `{user}` for username and `{command}` for command | No       | See action.yml              |

## Outputs

| Output        | Description                                                            |
| ------------- | ---------------------------------------------------------------------- |
| `allowed`     | Whether the user is allowed to execute the command (`true` or `false`) |
| `association` | The author association of the user                                     |

## Author Association Values

The following author associations are available:

-   `OWNER` - Repository owner (only for user-owned repos)
-   `MEMBER` - Organization member
-   `COLLABORATOR` - Users with write access to the repository
-   `CONTRIBUTOR` - Users who have previously committed
-   `FIRST_TIME_CONTRIBUTOR` - First-time contributors to this repo
-   `FIRST_TIMER` - First-time GitHub contributors
-   `MANNEQUIN` - Placeholder for unclaimed users
-   `NONE` - No association with the repository

## Example Workflow

```yaml
name: Benchmark

on:
    issue_comment:
        types: [created]

jobs:
    check-permissions:
        runs-on: ubuntu-latest
        outputs:
            allowed: ${{ steps.check.outputs.allowed }}
        steps:
            - uses: actions/checkout@v4

            - name: Check permissions
              id: check
              uses: ./external/ag-shared/github/actions/check-issue-comment-permissions
              with:
                  command: '/benchmarks'
                  allowed_associations: 'OWNER,MEMBER,COLLABORATOR'

    benchmark:
        needs: check-permissions
        # Important: Check that permissions job succeeded
        if: needs.check-permissions.result == 'success' && needs.check-permissions.outputs.allowed == 'true'
        runs-on: ubuntu-latest
        steps:
            - name: Run benchmarks
              run: echo "Running benchmarks..."
```

## Fail-Fast Behavior

The action implements fail-fast behavior to protect against security vulnerabilities:

1. **Exit Codes**:

    - `0` (success): User is authorized OR event is not the target command
    - `1` (failure): Unauthorized user attempted the target command OR invalid state detected

2. **When Action Fails**:

    - Unauthorized user runs the specified command
    - Author association is empty or undefined
    - Any unexpected error occurs during permission checking

3. **Workflow Considerations**:
    - Always check `needs.check-permissions.result == 'success'` in dependent jobs
    - This prevents workflows from running if the permission check encounters errors
    - Combines with output checking for defense in depth

## Security Considerations

1. **Default Permissions**: By default, only `OWNER`, `MEMBER`, and `COLLABORATOR` associations are allowed
2. **Avoid CONTRIBUTOR**: The `CONTRIBUTOR` association includes anyone who has ever had a PR merged, which may be too permissive
3. **Organization Repos**: In organization-owned repositories, owners appear as `MEMBER`, not `OWNER`
4. **Denial Messages**: Automatic denial messages help users understand why their command was rejected
5. **Fail-Fast Behavior**: The action exits with a non-zero code when:
    - An unauthorized user attempts to run the specified command
    - The author association is empty or invalid
    - This ensures workflows fail immediately rather than proceeding with undefined permissions

## Migration from Inline Checks

To migrate from inline permission checks to this action:

**Before:**

```yaml
if: |
    github.event_name == 'issue_comment' && 
    github.event.comment.body == '/benchmarks' && 
    (github.event.comment.author_association == 'OWNER' || 
     github.event.comment.author_association == 'MEMBER' || 
     github.event.comment.author_association == 'COLLABORATOR')
```

**After:**

```yaml
# In a separate job:
- uses: ./external/ag-shared/github/actions/check-issue-comment-permissions
  with:
    command: '/benchmarks'

# In your main job:
needs: check-permissions
if: needs.check-permissions.outputs.allowed == 'true'
```
