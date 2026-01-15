---
root: false
targets: ['*']
description: 'Plunker quick reference - use /plunker for full guide'
globs: ['**/plunkr/**/*.ts', '**/plunkr/**/*.js']
---

# Plunker Quick Reference

For comprehensive guidance on creating AG Charts Plunker examples, invoke the `/plunker` skill.

## Quick Reference

### API Endpoints

-   **Read**: `GET https://api.plnkr.co/plunks/{plunkId}`
-   **Create**: `POST https://api.plnkr.co/v2/plunks` (with Bearer token)

### Required Files

1. `index.html` - HTML structure with inline styles
2. `main.js` - Chart configuration and creation
3. `ag-example-styles.css` - Base styles plus framework styles
4. `package.json` - Dependencies

### Key Points

-   Use `entries` array (not `files` object) when creating
-   Get access token: `curl -s -c /tmp/plnk-cookies.txt 'https://plnkr.co/edit/'`
-   Use versioned CDN URLs: `@13.0.0` (not `latest`)
-   Include vanilla framework styles for proper chart sizing

### Source Locations

| File                                                                    | Purpose                          |
| ----------------------------------------------------------------------- | -------------------------------- |
| `external/ag-website-shared/src/components/plunkr/utils/plunkr.ts`      | How the website generates Plunks |
| `external/ag-website-shared/src/components/example-runner/styles/*.css` | Example control styles           |

For full implementation details, run `/plunker`.
