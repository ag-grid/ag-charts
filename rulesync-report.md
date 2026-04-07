_Weekly Rulesync Review_

_Pinned:_ ^7.0.0 | _Resolved:_ 7.0.0 (patched) | _Latest:_ 7.27.1

_New this week (since 2026-03-30):_
• _7.24.0_ (2026-03-30) — Rovodev support; Windows path separator fix (`getRelativePathFromCwd`); OpenCode honours agentsmd subproject paths
• _7.25.0_ (2026-03-31) — GitHub Copilot CLI MCP sync target added (`~/.copilot/cli_mcp_settings.json`); `toPosixPath` utility; more Windows path separator fixes
• _7.26.0_ (2026-04-01) — Copilot CLI MCP transport type fixes (local/remote/sse/http alignment)
• _7.27.0_ (2026-04-02) — Kilo targets rebased onto OpenCode CLI; Gemini CLI native subagents output to `.gemini/agents/` with `experimental.enableAgents`
• _7.27.1_ (2026-04-04) — Gemini CLI subagent relative path preservation; programmatic API quality improvements

_Relevance to ag-charts:_ Low–medium. Windows path fixes (7.24/7.25) are useful for cross-platform dev. Copilot CLI MCP sync is relevant if team uses Copilot CLI. Gemini/Kilo changes are not in scope.

_Patch status_ (our 4 local fixes vs upstream):

1. _ENOENT symlink handling_ (rules/skills/commands) — ✗ Not upstreamed
2. _Gemini CLI backslash escaping in TOML_ — ✗ Not upstreamed (7.27.x Gemini fixes are unrelated subagent path changes)
3. _`invocable: user-only` → `disable-model-invocation`_ — ⚠ Partially upstreamed: v7.13.0 added it for Claude Code only; our patch also covers Copilot and Cursor (still needed)
4. _`context` frontmatter passthrough for Claude Code skills_ — ✗ Not upstreamed

_Actions:_ Patch still required for all 4 fixes. Upgrading to 7.27.1 would require re-verifying the patch applies cleanly — worth doing to pick up Windows path fixes. No breaking changes observed.

---

_Note: Slack MCP was unavailable; report written to rulesync-report.md instead._
