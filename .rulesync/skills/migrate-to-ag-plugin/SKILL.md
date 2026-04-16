---
targets: ['*']
name: migrate-to-ag-plugin
description: "Migration checklist for adopting the ag@ag-dev Claude plugin in a consuming repo (ag-charts, ag-grid, ag-studio). Use when setting up the plugin in a new repo, verifying dual-mode operation, or cutting over from the rulesync+symlink system. Also use when the user says 'migrate to plugin', 'set up ag plugin', 'enable ag-dev plugin', or asks about the plugin migration status."
invocable: user-only
---

# Migrate to ag@ag-dev Plugin

This skill tracks the steps needed to adopt the `ag@ag-dev` Claude plugin in a consuming repo. The plugin delivers skills, agents, commands, and hooks from the `ag-dev-prompts` private GitHub repo alongside the existing rulesync+symlink system.

**Plugin repo:** `ag-grid/ag-dev-prompts` (private)
**Marketplace:** `ag-dev`
**Plugin name:** `ag`
**JIRA:** AG-17085

## Prerequisites

- The repo must have `external/ag-shared` as a subrepo
- The repo must already use `setup-prompts.sh` for rulesync generation
- The developer needs push access to `ag-grid/ag-dev-prompts` (for syncing)

## Phase 1: Enable Dual Mode

Dual mode means both the existing rulesync system AND the plugin run side-by-side. Skills appear as both `/jira` (local) and `/ag:jira` (plugin).

### Step 1: Pull latest ag-shared

```bash
yarn subrepo pull ag-shared
```

This brings in the updated `.claude-settings.json` which already contains:
- `enabledPlugins["ag@ag-dev"]: true`
- `extraKnownMarketplaces.ag-dev` pointing to `ag-grid/ag-dev-prompts`

### Step 2: Regenerate rulesync output

```bash
./external/ag-shared/scripts/setup-prompts/setup-prompts.sh
```

This regenerates `.claude/settings.json` (symlinked from ag-shared) with the plugin config.

### Step 3: Verify in a fresh session

Start a new Claude Code session and check:

1. **Plugin loads:** Look for `ag@ag-dev` in the startup output or run `claude plugins list`
2. **Skills visible:** Both `/jira` (local) and `/ag:jira` (plugin) should appear
3. **No MCP conflicts:** MCP servers (atlassian, sequential-thinking, excalidraw) should load once, not twice
4. **Hooks fire:** Edit a file and confirm the PostToolUse formatter runs

### Step 4: Check for duplicate hooks

The plugin delivers hooks via `hooks/hooks.json`. If the project `.claude/settings.json` also defines the same hooks (PostToolUse formatter, SessionStart, WorktreeCreate/Remove), they may fire twice.

**Resolution:** During dual mode, hooks should come from ONE source. Either:
- Remove hooks from the plugin's `hooks/hooks.json` (keep in project settings)
- Or remove hooks from `.claude-settings.json` (keep in plugin)

The current recommendation is to keep hooks in project settings during dual mode and defer the plugin hooks to Phase 3 (cut-over).

## Phase 2: Add Product-Specific Content

If the repo has product-specific skills/agents/commands (like ag-charts-prompts), add them directly to `ag-dev-prompts`:

```bash
git clone git@github.com:ag-grid/ag-dev-prompts.git /tmp/ag-dev-prompts
cd /tmp/ag-dev-prompts

# Add content (skills/, agents/, commands/)
cp -R /path/to/product-prompts/skills/my-skill skills/
cp /path/to/product-prompts/agents/my-agent.md agents/
git add -A && git commit -m "Add <product> product-specific content"
git push
```

The next `sync-to-plugin.sh` run will rebase this commit on top of any new ag-shared syncs.

**Note:** Glob-triggered rules CANNOT go in the plugin. They must stay as local `.rulesync/rules/` files.

## Phase 3: Cut Over (Future)

When confident the plugin is stable:

1. Remove rulesync symlinks that point to `external/ag-shared/prompts/skills/` and `external/ag-shared/prompts/agents/`
2. Remove rulesync symlinks that point to `external/prompts/` (product-specific)
3. Update skill cross-references from `/jira` to `/ag:jira` (~15 references across rules/skills)
4. Remove `external/prompts` symlink and deprecate the product-prompts repo
5. Move glob-triggered rules to `rulesync fetch` mechanism (when implemented)

## Sync Script Reference

After making changes to `ag-shared/prompts/` in any consuming repo:

```bash
# Push changes to ag-shared
yarn subrepo push ag-shared

# Sync to plugin repo (from any repo with the script)
external/ag-shared/scripts/sync-to-plugin/sync-to-plugin.sh

# Dry run to preview
external/ag-shared/scripts/sync-to-plugin/sync-to-plugin.sh --dry-run
```

The sync script uses `git filter-repo --subdirectory-filter prompts/` which produces deterministic output. Direct commits in ag-dev-prompts are rebased on top automatically.

## Per-Repo Status

| Repo | Phase | Status | Notes |
|------|-------|--------|-------|
| ag-charts | 1 | Dual mode active | Skills + product content in plugin; testing in progress |
| ag-grid | 0 | Not started | Needs `subrepo pull ag-shared` to get config |
| ag-studio | 0 | Not started | Needs `subrepo pull ag-shared` to get config |
