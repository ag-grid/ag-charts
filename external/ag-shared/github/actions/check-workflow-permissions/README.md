# Check Workflow Permissions Action

A comprehensive GitHub Action for checking permissions across different workflow event types including pull requests, pushes, issue comments, and more.

## Purpose

This action provides a unified way to secure GitHub workflows by validating that the actor (user, bot, or system) has appropriate permissions to trigger workflow execution. It supports multiple event types with configurable security policies.

## Supported Event Types

- **pull_request / pull_request_target**: Validates PR author associations and fork status
- **push**: Checks push permissions and branch restrictions
- **issue_comment**: Validates comment author associations
- **workflow_dispatch / schedule / workflow_call**: Automatically allowed (secure by design)

## Usage

### Basic Example

```yaml
- name: Check permissions
  uses: ./external/ag-shared/github/actions/check-workflow-permissions
  with:
    allowed_associations: 'OWNER,MEMBER,COLLABORATOR'
    allow_dependabot: 'false'
    allow_forks: 'false'
```

### Pull Request Workflow

```yaml
name: PR Build

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  check-permissions:
    runs-on: ubuntu-latest
    outputs:
      allowed: ${{ steps.check.outputs.allowed }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Check PR permissions
        id: check
        uses: ./external/ag-shared/github/actions/check-workflow-permissions
        with:
          allowed_associations: 'OWNER,MEMBER,COLLABORATOR,CONTRIBUTOR'
          allow_dependabot: 'true'
          allow_forks: 'false'
          
  build:
    needs: check-permissions
    if: needs.check-permissions.result == 'success'
    runs-on: ubuntu-latest
    steps:
      - name: Build project
        run: echo "Building..."
```

### Push Workflow with Branch Protection

```yaml
name: Deploy

on:
  push:
    branches: [main, production]

jobs:
  check-permissions:
    runs-on: ubuntu-latest
    outputs:
      allowed: ${{ steps.check.outputs.allowed }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Check push permissions
        id: check
        uses: ./external/ag-shared/github/actions/check-workflow-permissions
        with:
          require_write_permission: 'true'
          allowed_branches: 'main,production'
          
  deploy:
    needs: check-permissions
    if: needs.check-permissions.result == 'success'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        run: echo "Deploying..."
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `allowed_associations` | Comma-separated list of allowed author associations | No | `OWNER,MEMBER,COLLABORATOR` |
| `allow_dependabot` | Whether to allow Dependabot PRs | No | `false` |
| `allow_forks` | Whether to allow PRs from forks | No | `false` |
| `require_write_permission` | Whether to require write permission for push events | No | `true` |
| `check_branch_protection` | Whether to check branch protection rules (future feature) | No | `false` |
| `allowed_branches` | Comma-separated list of allowed branches for push events | No | `""` (all branches) |

## Outputs

| Output | Description |
|--------|-------------|
| `allowed` | Whether the actor is allowed to trigger the workflow (`true` or `false`) |
| `association` | The author association of the actor |
| `actor_type` | Type of actor (`user`, `dependabot`, `github-actions`, `bot`) |
| `event_type` | The GitHub event type |

## Security Policies by Event Type

### Pull Requests

1. **Fork Protection**: By default, PRs from forks are blocked
2. **Association Check**: PR authors must have allowed associations
3. **Dependabot**: Can be explicitly allowed with `allow_dependabot: 'true'`
4. **Bot Detection**: Automatically detects bot accounts

### Push Events

1. **Write Permission**: Assumes pusher has write access (configurable)
2. **Branch Restrictions**: Can limit pushes to specific branches
3. **Owner Detection**: Identifies repository owners

### Issue Comments

1. **Association Check**: Comment authors must have allowed associations
2. **No Fork Concerns**: Issue comments can't modify code directly

## Migration Guide

### From check-issue-comment-permissions

```yaml
# Before:
- uses: ./external/ag-shared/github/actions/check-issue-comment-permissions
  with:
    command: '/deploy'
    allowed_associations: 'OWNER,MEMBER'

# After:
- uses: ./external/ag-shared/github/actions/check-workflow-permissions
  with:
    allowed_associations: 'OWNER,MEMBER'
```

### From Manual Checks

```yaml
# Before:
if: |
  github.event.pull_request.author_association == 'MEMBER' ||
  github.event.pull_request.author_association == 'OWNER'

# After:
needs: check-permissions
if: needs.check-permissions.result == 'success'
```

## Security Best Practices

1. **Default Deny**: The action fails closed - any unknown event type is denied
2. **Explicit Configuration**: Be explicit about what you allow
3. **Layered Security**: Combine with GitHub's built-in security features
4. **Regular Reviews**: Periodically review allowed associations and settings

## Common Configurations

### High Security (Default)
```yaml
allowed_associations: 'OWNER,MEMBER,COLLABORATOR'
allow_dependabot: 'false'
allow_forks: 'false'
```

### Open Source Friendly
```yaml
allowed_associations: 'OWNER,MEMBER,COLLABORATOR,CONTRIBUTOR'
allow_dependabot: 'true'
allow_forks: 'true'
```

### Internal Only
```yaml
allowed_associations: 'OWNER,MEMBER'
allow_dependabot: 'false'
allow_forks: 'false'
allowed_branches: 'main,develop'
```

## API Verification and Corrections

Based on verification against GitHub's official documentation:

### Verified Properties:
- ✅ `github.event.pull_request.author_association` - Correct path for PR author association
- ✅ `github.event.comment.author_association` - Correct path for comment author association  
- ✅ `github.event.pull_request.head.repo.fork` - Correct path for fork detection
- ✅ `github.actor` - Standard actor username
- ✅ `github.repository_owner` - Repository owner username
- ✅ `github.ref` - Full ref path (refs/heads/branch-name)

### Corrected Implementation:
- 🔧 Branch name extraction now uses `github.ref` and strips `refs/heads/` prefix
- 🔧 Owner detection uses string comparison of usernames instead of non-existent ID fields
- 🔧 Proper error handling for missing or empty associations

## Limitations

1. **Push Events**: Full permission checking for push events would require API calls
2. **Branch Protection**: Currently doesn't query branch protection API  
3. **Organization Membership**: Relies on author associations rather than direct org membership checks
4. **Context Properties**: Some properties like `github.actor_id` may not be available in all contexts

## Future Enhancements

- [ ] API-based organization membership verification
- [ ] Branch protection rule checking
- [ ] Custom permission levels (read, write, admin)
- [ ] Webhook signature verification
- [ ] Rate limit handling for API calls