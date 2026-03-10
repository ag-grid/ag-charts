---
targets: ['*']
name: jira
description: 'Work with JIRA tickets for AG products. Covers creating tickets (bugs, features, tech-debt), estimating complexity and effort, and analysing issues for product/UX solutions. Use when the user asks to "create a JIRA", "file a bug", "estimate a ticket", "size this feature", "analyse a JIRA issue", or any JIRA-related task.'
---

# JIRA Skill

Unified skill for creating, estimating, and analysing JIRA tickets across AG products.

## Product Detection

Detect the product from the repository context:

- **AG Charts**: repos containing `ag-charts-community` — read `products/charts.md`
- **AG Grid**: repos containing `ag-grid-community` — read `products/grid.md`
- **AG Studio**: repos containing `ag-studio-core` or with project key `ST` — read `products/studio.md`

Read the appropriate product file **before** proceeding with any workflow.

## Workflow Routing

Based on user intent, read the corresponding workflow file (in the `workflows/` subdirectory of this skill):

| Intent | Keywords | Workflow |
|--------|----------|----------|
| **Create** | "create a JIRA", "file a bug", "write up a ticket", "log this issue" | `workflows/create.md` |
| **Estimate** | "estimate", "size", "analyse complexity", "how long", "effort" | `workflows/estimate.md` |
| **Analyse** | "analyse this issue", "product analysis", "UX analysis", "propose solutions" | `workflows/analyze.md` |

Read the workflow file, then follow its instructions.

## Shared Reference

### Atlassian Cloud ID

All API calls use: `1565837d-d6d1-4228-bcb2-4cb74df700f2`

### Required Fields

| Field | API Name | Format |
|-------|----------|--------|
| Project | `projectKey` | `"AG"` (or `"ST"` for Studio) |
| Type | `issueTypeName` | `"Bug"` or `"Task"` |
| Summary | `summary` | `"[Product] Title"` (prefix from product file) |
| Description | `description` | See templates |
| Component | `components` | From product file |
| Track | `customfield_10501` | See track values below |

### Track Values (`customfield_10501`)

| Value | ID | Use For |
|-------|-----|---------|
| Bug | 10401 | Bug fixes |
| Feature Request | 10400 | New features |
| Improvement | 10403 | Enhancements |
| Housekeeping | 10404 | Tech-debt, refactoring |
| Doc change | 10402 | Documentation updates |

Format: `[{"value": "Bug"}]` or `[{"id": "10401"}]`

### Description Formatting

- Use plain numbered lists: `1. Item` (not `#` wiki markup).
- Indent sub-items with 4 spaces: `    1. Sub-item`.
- **End numbered items with periods.**
- Bold: `**text**`.
- Code: backticks.
- URLs: Paste raw URLs directly (JIRA auto-links them); avoid `[text](url)` markdown links.
- Empty sections: Just `N/A`.
- No comments — all info in description.
- When creating tickets from analysis/research documents, distil to decisions and recommendations only. Do not reproduce full analysis in the description — link to the analysis document in the "Design Documents" section instead.
- Related tickets: Use formal JIRA issue links (not ticket keys in description text). When a fix resolves downstream bugs, use "Blocks" link type. Note: the MCP API does not support creating issue links, so ask the user to add them manually after ticket creation.

### Templates

- **Feature/Task**: `templates/feature-task.md` (12-section numbered format)
- **Bug**: `templates/bug.md` (TC-based format)

Follow the exact structure from the template. Do not use free-form markdown headers (`##`), tables, or code blocks for top-level structure.

### Troubleshooting

**Discovering required fields:**

```javascript
mcp__atlassian__getJiraIssueTypeMetaWithFields({
    cloudId: '1565837d-d6d1-4228-bcb2-4cb74df700f2',
    projectIdOrKey: 'AG',
    issueTypeId: '10105', // Task
});
```

**Common errors:**

- **"Track is required"**: Add `customfield_10501`.
- **"Components is required"**: Add `components` array.
- **Unknown field IDs**: Use metadata API above.
- **Ticket created in Backlog instead of To Do**: New AG project tickets default to "Backlog" status. Transition to "To Do" using transition ID `141` after creation.
- **Do not set the `in_kanban` label**: Never add `in_kanban` to the `labels` field when creating tickets — it is managed automatically.
