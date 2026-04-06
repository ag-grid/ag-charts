*Weekly Rulesync Review*

*Pinned:* ^7.0.0 | *Resolved:* 7.0.0 (patched) | *Latest:* 7.27.1

*New this week (since 2026-03-30):*
• *7.24.0* (2026-03-30) — Rovodev support; Windows path separator fix (`getRelativePathFromCwd`); OpenCode honours agentsmd subproject paths
• *7.25.0* (2026-03-31) — GitHub Copilot CLI MCP sync target added (`~/.copilot/cli_mcp_settings.json`); `toPosixPath` utility; more Windows path separator fixes
• *7.26.0* (2026-04-01) — Copilot CLI MCP transport type fixes (local/remote/sse/http alignment)
• *7.27.0* (2026-04-02) — Kilo targets rebased onto OpenCode CLI; Gemini CLI native subagents output to `.gemini/agents/` with `experimental.enableAgents`
• *7.27.1* (2026-04-04) — Gemini CLI subagent relative path preservation; programmatic API quality improvements

*Relevance to ag-charts:* Low–medium. Windows path fixes (7.24/7.25) are useful for cross-platform dev. Copilot CLI MCP sync is relevant if team uses Copilot CLI. Gemini/Kilo changes are not in scope.

*Patch status* (our 4 local fixes vs upstream):
1. *ENOENT symlink handling* (rules/skills/commands) — ✗ Not upstreamed
2. *Gemini CLI backslash escaping in TOML* — ✗ Not upstreamed (7.27.x Gemini fixes are unrelated subagent path changes)
3. *`invocable: user-only` → `disable-model-invocation`* — ⚠ Partially upstreamed: v7.13.0 added it for Claude Code only; our patch also covers Copilot and Cursor (still needed)
4. *`context` frontmatter passthrough for Claude Code skills* — ✗ Not upstreamed

*Actions:* Patch still required for all 4 fixes. Upgrading to 7.27.1 would require re-verifying the patch applies cleanly — worth doing to pick up Windows path fixes. No breaking changes observed.

---
_Note: Slack MCP was unavailable; report written to rulesync-report.md instead._
