---
targets: ['*']
description: 'Guidelines for searching and creating JIRA tickets in AG products'
---

# JIRA Guide

This guide covers working with JIRA tickets in AG products (Charts and Grid).

**Canonical source**: Detailed JIRA documentation is in `external/ag-shared/tools/prompts/` and symlinked via `.rulesync/`.

## Quick Reference

-   **Search**: Project `AG`, Component `Charts`, Status `Needs Review` for review
-   **Summary prefix**: `[Charts]`
-   **Required fields**: Summary, Description, Component, Track

## Creating Tickets

Use the `jira-create` skill for guided ticket creation. It will:

1. Help you choose the right ticket type
2. Load the appropriate template
3. Guide you through required fields

## Templates

-   `.rulesync/templates/jira-bug-template.md` - Bug reports with reproduction steps
-   `.rulesync/templates/jira-template.md` - Features, improvements, tech-debt

## Track Values

| Value           | Use For                |
| --------------- | ---------------------- |
| Bug             | Bug fixes              |
| Feature Request | New features           |
| Improvement     | Enhancements           |
| Housekeeping    | Tech-debt, refactoring |
| Doc change      | Documentation updates  |

## Detailed Documentation

-   **Skill**: `.rulesync/skills/jira-create.md`
-   **Guide**: `.rulesync/rules/jira.md`

## Bug Version Investigation

When creating bug tickets, test affected versions **from the browser** (not by analysing code):

1. Use the reproduction Plunker and change AG Charts version
2. Binary search versions to find when the bug was introduced
3. Set `versions` field to earliest affected version
4. Note: Charts v9 = Grid v31 (offset +22)
