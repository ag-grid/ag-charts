# JIRA Reference Guide

Reference material for JIRA fields, formatting, and troubleshooting. For creating tickets, use the `jira-create` skill.

**Product scope**: AG Charts (for AG Grid, change component to "Grid" and prefix to "[Grid]").

## Search Guidelines

-   Project: `AG`
-   Component: `Charts` (or `Grid`)
-   Status `Needs Review` for tickets requiring review

## Required Fields

| Field       | API Name            | Format                                 |
| ----------- | ------------------- | -------------------------------------- |
| Project     | `projectKey`        | `"AG"`                                 |
| Type        | `issueTypeName`     | `"Bug"` or `"Task"`                    |
| Summary     | `summary`           | `"[Charts] Title"` or `"[Grid] Title"` |
| Description | `description`       | See templates                          |
| Component   | `components`        | `[{"name": "Charts"}]` (ID: 11061)     |
| Track       | `customfield_10501` | See track values below                 |

## Track Values (`customfield_10501`)

| Value           | ID    | Use For                |
| --------------- | ----- | ---------------------- |
| Housekeeping    | 10404 | Tech-debt, refactoring |
| Feature Request | 10400 | New features           |
| Bug             | 10401 | Bug fixes              |
| Improvement     | 10403 | Enhancements           |
| Doc change      | 10402 | Documentation updates  |

Format: `[{"value": "Bug"}]` or `[{"id": "10401"}]`

## Description Formatting

-   Use plain numbered lists: `1. Item` (not `#` wiki markup)
-   Indent sub-items with 4 spaces: `    1. Sub-item`
-   **End numbered items with periods**
-   Bold: `**text**`
-   Code: backticks
-   URLs: `[text](url)` for clickability
-   Empty sections: Just `N/A`
-   No comments - all info in description

## Bug Tickets

**Template**: `templates/jira-bug-template.md`

**Additional fields:**

-   `versions` (Affects Version): `[{"name": "31.0.0"}]`
-   Priority: `{"name": "Medium"}` (default for bugs)

**Version testing**: Test in browser (not code analysis). Charts v9 = Grid v31 (offset +22).

## Feature/Task Tickets

**Template**: `templates/jira-template.md`

Sections: Requirements, Problem, Use cases, API Design, Breaking changes, Acceptance criteria.

## Troubleshooting

### Discovering Required Fields

```javascript
mcp__atlassian__getJiraIssueTypeMetaWithFields({
    cloudId: '1565837d-d6d1-4228-bcb2-4cb74df700f2',
    projectIdOrKey: 'AG',
    issueTypeId: '10105', // Task
});
```

### Common Errors

-   **"Track is required"**: Add `customfield_10501`
-   **"Components is required"**: Add `components` array
-   **Unknown field IDs**: Use metadata API above

## Related

-   Create tickets: `skills/jira-create/SKILL.md`
-   Estimate tickets: `skills/estimate-jira/SKILL.md`
-   Bug template: `templates/jira-bug-template.md`
-   Feature template: `templates/jira-template.md`
