---
targets: ['*']
name: codesandbox
description: 'Create and manage CodeSandbox devboxes for AG Charts and AG Grid. Use this skill whenever the user mentions codesandbox, CodeSandbox, csb, sandbox, or devbox, wants to create or modify a shareable code environment with a real build pipeline, or is asked to convert a CodeSandbox into a Plunker (or vice versa). Also trigger when working with an existing CodeSandbox URL shared by the user. Covers creating sandboxes via the REST API, forking existing devboxes, and modifying devbox contents via terminal commands.'
context: fork
---

# CodeSandbox Guide

This guide covers working with CodeSandbox for creating and managing shareable devbox environments with full build pipelines.

## When to Use CodeSandbox vs Plunker

- **Plunker**: Static demos, API feature demos, bug reproductions that work with UMD/CDN bundles. No build step. Faster to create. Use `/plunker` skill.
- **CodeSandbox**: Anything requiring `npm install` + a real bundler (Vite, esbuild, rollup, webpack) — bundle size analysis, tree-shaking testing, build pipeline issues, full-project reproductions.

## Sandbox Types

CodeSandbox has two environment types:

- **Sandbox** (browser-based): Runs in sandpack, limited capabilities, no custom npm registries. Created via the REST API.
- **Devbox** (container-based): Full Docker environment with terminal, pnpm, custom `.npmrc` support. Created by forking an existing devbox or converting a sandbox.

## Private Registry and Staging Packages

AG Charts staging/beta packages are published to a private registry at `registry.ag-grid.com`. This is used for pre-release testing before packages go to the public npm registry.

**To use staging packages in a devbox:**

1. Include a `.npmrc` file:
   ```
   registry=https://registry.ag-grid.com
   ```
2. Use exact staging version strings (not caret ranges) in `package.json`, e.g. `"ag-charts-community": "13.2.1-beta.20260415"`
3. **Query the latest staging version** before creating or updating a sandbox:
   ```bash
   npm view ag-charts-community dist-tags --registry=https://registry.ag-grid.com
   ```
   The `latest` tag on this registry points to the current staging build.
4. **Always confirm with the user** before proceeding: "The latest staging version is X.Y.Z-beta.YYYYMMDD — do you want to use this, or do you need to trigger a CI rebuild first?"

**Important**: Browser sandboxes (created via the REST API) cannot access the private registry. If staging packages are needed, the user must convert the sandbox to a devbox, or fork an existing devbox that already has `.npmrc` configured.

## Workflows

### Create a Sandbox via REST API

Use this for quick creation when you have all file contents ready. Creates a browser sandbox — may need conversion to devbox for private registry access or terminal use.

```bash
curl -s -X POST "https://codesandbox.io/api/v1/sandboxes/define?json=1" \
  -H "Content-Type: application/json" \
  -d '{
  "files": {
    "package.json": {
      "content": "{...json content as string...}",
      "isBinary": false
    },
    "src/main.ts": {
      "content": "...file content...",
      "isBinary": false
    },
    ".codesandbox/template.json": {
      "content": "{\"title\": \"My Sandbox\", \"runtime\": \"static\", \"tags\": [\"ag-charts\"], \"published\": false}",
      "isBinary": false
    }
  }
}'
```

Response: `{"sandbox_id": "abc123"}` → URL: `https://codesandbox.io/s/abc123`

### Fork an Existing Devbox (Browser)

Forking preserves the devbox environment including `.npmrc`, terminal access, and installed dependencies. This is the preferred method when a similar devbox already exists.

1. Navigate to the devbox URL in Chrome
2. Wait for the VS Code editor to fully load
3. Click the **Fork** button in the top-right corner
4. **Important**: Clicking Fork triggers a browser confirmation alert. Tell the user: "Please approve the alert in the browser." The browser extension will appear disconnected until the user approves — this is expected behaviour.
5. After approval, the tab navigates to the new forked devbox with a new URL slug
6. The forked devbox has identical files and environment to the original

### Modify a Devbox via Terminal

Once inside a devbox (forked or existing), use the terminal to modify files. Devboxes use pnpm.

**Opening a new terminal**: Click the "+" button in the terminal toolbar (right side of the terminal tab bar, after the "dev" task label). This creates a fresh zsh session. Do not type commands into the "dev" task terminal — it runs the dev server.

**Writing files via heredoc** (preferred for multi-line content):
```bash
cat > filename.ext << 'EOF'
file content here
EOF
```

**Updating package.json and reinstalling**:
```bash
cat > package.json << 'EOF'
{ ...new content... }
EOF
pnpm install
```

### Converting Between CodeSandbox and Plunker

**CodeSandbox → Plunker**: Read the CodeSandbox files, extract the key chart code from `src/main.ts`, and create a Plunker using the `/plunker` skill with UMD/CDN bundles instead of npm packages. The chart options and data transfer directly; only the imports and initialisation wrapper change.

**Plunker → CodeSandbox**: Take the chart code from the Plunker's `main.js`, wrap it in a module-based `src/main.ts` with proper imports, create a `package.json` with the AG Charts npm packages as dependencies, and set up the bundler configuration.

## CodeSandbox REST API Reference

The AG Charts website uses the CodeSandbox define API for creating sandboxes from examples. See `external/ag-website-shared/src/components/codeSandbox/utils/codeSandbox.ts` for the implementation.

**Endpoint**: `POST https://codesandbox.io/api/v1/sandboxes/define`

**Two modes**:
- **Form POST** (used by website): Encodes files with `codesandbox-import-utils` library's `getParameters()`, submits as form data. Opens in new tab without popup warnings.
- **JSON API** (used by CLI): POST with `?json=1` query param and JSON body. Returns `{"sandbox_id": "..."}`.

**Authentication**: Not required for creating public sandboxes. Required for forking via API (`POST /api/v1/sandboxes/:id/fork`).

## Browser Automation Notes

- CodeSandbox devboxes are heavy VS Code-in-browser SPAs that can cause browser extension instability
- The Fork button triggers a JavaScript confirmation alert that blocks the extension until the user approves — always tell the user to approve alerts when clicking Fork
- After forking, check `tabs_context_mcp` for the new devbox URL slug
- Use the zsh terminal (not the "dev" task terminal) for running commands

## Existing Devboxes

### Bundle Size Testing (AG-17066)

| Variant | Vite | esbuild | rollup |
|---------|------|---------|--------|
| Community | `rtskm9` | `49kns3` | `zj4ffg` |
| Enterprise | `spxzyd` | `5755h9` | `w8fsws` |

URL pattern: `https://codesandbox.io/p/devbox/ag-chart-bundle-size-forked-{ID}`

Build commands: Vite → `npx vite build`, esbuild → `node build.mjs`, rollup → `npx rollup -c`
