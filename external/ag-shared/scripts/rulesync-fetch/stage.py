#!/usr/bin/env python3
"""Stage fetched ag-dev-prompts content into .rulesync/ for non-Claude target generation.

Reads plugin-assignments.json, copies skills/agents/commands from the ag-dev-prompts
cache into .rulesync/ with frontmatter targets: rewritten to exclude claudecode,
so rulesync generate emits those items for Cursor/Codex/Gemini/Copilot only
(Claude already gets them via the plugin).

Shared guides (plugin guides/*.md without underscore prefix) are copied into
.rulesync/rules/ with targets: kept as ['*'] — Claude still receives rules via
rulesync because plugins cannot deliver glob-triggered rules.

Part of AG-17085 Phase 3 (rulesync fetch design).
"""

from __future__ import annotations
import argparse
import json
import os
import shutil
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[4]
CACHE_ROOT = Path(os.environ.get("AG_DEV_PROMPTS_CACHE", os.path.expanduser("~/.cache/ag-dev-prompts")))
CACHE_REPO = CACHE_ROOT / "repo"
MANIFEST = REPO_ROOT / "external/ag-shared/prompts/.claude-plugin/plugin-assignments.json"
RULESYNC = REPO_ROOT / ".rulesync"
MARKER = RULESYNC / ".fetched-from-ag-dev-prompts"

NON_CLAUDE_TARGETS = ["cursor", "codexcli", "geminicli", "copilot", "agentsmd"]


def load_manifest() -> dict:
    with open(MANIFEST) as f:
        return json.load(f)


def rewrite_targets(content: str, new_targets: list[str] | str) -> str:
    """Rewrite the `targets:` line inside YAML frontmatter. Returns content unchanged
    if no frontmatter is found."""
    lines = content.split("\n")
    if not lines or lines[0].strip() != "---":
        return content
    end_fm = None
    for i in range(1, min(len(lines), 60)):
        if lines[i].strip() == "---":
            end_fm = i
            break
    if end_fm is None:
        return content
    target_line_idx = None
    for i in range(1, end_fm):
        if lines[i].lstrip().startswith("targets:"):
            target_line_idx = i
            break
    if isinstance(new_targets, str):
        rendered = new_targets
    else:
        rendered = "[" + ", ".join(f"'{t}'" for t in new_targets) + "]"
    new_line = f"targets: {rendered}"
    if target_line_idx is not None:
        lines[target_line_idx] = new_line
    else:
        lines.insert(end_fm, new_line)
    return "\n".join(lines)


def _replace_as_regular(dst: Path):
    """Ensure dst is not a symlink — if it exists as a symlink or any other
    file/dir, remove it so we can write a fresh regular file/dir. Prevents
    accidental writes through symlinks into external/ag-shared or
    external/prompts sources."""
    if dst.is_symlink() or dst.exists():
        if dst.is_symlink() or dst.is_file():
            dst.unlink()
        else:
            shutil.rmtree(dst)


def stage_file(src: Path, dst: Path, targets: list[str] | str, staged: set[Path]):
    if not src.exists():
        print(f"  WARN: source missing: {src}", file=sys.stderr)
        return
    dst.parent.mkdir(parents=True, exist_ok=True)
    _replace_as_regular(dst)
    content = src.read_text()
    content = rewrite_targets(content, targets)
    dst.write_text(content)
    staged.add(dst)


def stage_skill_dir(src: Path, dst: Path, targets: list[str] | str, staged: set[Path]):
    if not src.exists():
        print(f"  WARN: source missing: {src}", file=sys.stderr)
        return
    _replace_as_regular(dst)
    shutil.copytree(src, dst)
    staged.add(dst)
    for md in dst.rglob("*.md"):
        content = md.read_text()
        content = rewrite_targets(content, targets)
        md.write_text(content)


def stage(dry_run: bool = False) -> set[Path]:
    manifest = load_manifest()
    staged: set[Path] = set()

    if not CACHE_REPO.exists():
        print(f"ERROR: cache missing at {CACHE_REPO}. Run fetch.sh first.", file=sys.stderr)
        sys.exit(1)

    if dry_run:
        print("DRY RUN — no files will be written")

    for plugin_name, plugin in manifest["plugins"].items():
        plugin_src = CACHE_REPO / "plugins" / plugin_name
        if not plugin_src.exists():
            print(f"  WARN: plugin missing in cache: {plugin_src}", file=sys.stderr)
            continue

        for skill_name in plugin.get("skills", []):
            src = plugin_src / "skills" / skill_name
            dst = RULESYNC / "skills" / skill_name
            if dry_run:
                print(f"  skill {plugin_name}/{skill_name} → {dst.relative_to(REPO_ROOT)}")
                staged.add(dst)
            else:
                stage_skill_dir(src, dst, NON_CLAUDE_TARGETS, staged)

        for agent_name in plugin.get("agents", []):
            src = plugin_src / "agents" / f"{agent_name}.md"
            # Rulesync's source dir for subagents is .rulesync/subagents/, not
            # .rulesync/agents/. The plugin-assignments manifest uses `agents`
            # for consistency with the Claude plugin layout.
            dst = RULESYNC / "subagents" / f"{agent_name}.md"
            if dry_run:
                print(f"  agent {plugin_name}/{agent_name} → {dst.relative_to(REPO_ROOT)}")
                staged.add(dst)
            else:
                stage_file(src, dst, NON_CLAUDE_TARGETS, staged)

        for cmd_name in plugin.get("commands", []):
            src = plugin_src / "commands" / f"{cmd_name}.md"
            dst = RULESYNC / "commands" / f"{cmd_name}.md"
            if dry_run:
                print(f"  command {plugin_name}/{cmd_name} → {dst.relative_to(REPO_ROOT)}")
                staged.add(dst)
            else:
                stage_file(src, dst, NON_CLAUDE_TARGETS, staged)

        for guide_name in plugin.get("guides", []):
            if guide_name.startswith("_"):
                continue  # internal plugin guide, not a shared rule
            src = plugin_src / "guides" / guide_name
            dst = RULESYNC / "rules" / guide_name
            if dry_run:
                print(f"  rule {plugin_name}/{guide_name} → {dst.relative_to(REPO_ROOT)}")
                staged.add(dst)
            else:
                # Claude still consumes rules via rulesync (plugins don't do globs),
                # so keep targets: ['*'].
                stage_file(src, dst, "['*']", staged)

    if not dry_run:
        MARKER.write_text(
            "# Managed by external/ag-shared/scripts/rulesync-fetch/stage.py\n"
            "# Do not edit — regenerated on each setup-prompts run.\n"
        )
        write_gitignore(staged)

    print(f"Staged {len(staged)} items into .rulesync/", file=sys.stderr)
    return staged


def write_gitignore(staged: set[Path]):
    """Write .rulesync/.gitignore so staged plugin content doesn't pollute
    git status. Paths are rulesync-relative."""
    gitignore = RULESYNC / ".gitignore"
    entries = sorted({str(p.relative_to(RULESYNC)) for p in staged})
    lines = [
        "# Managed by external/ag-shared/scripts/rulesync-fetch/stage.py",
        "# AG-17085 Phase 3: plugin-delivered items staged from ag-dev-prompts.",
        "# These are regenerated on each setup-prompts run.",
        ".fetched-from-ag-dev-prompts",
        *entries,
        "",
    ]
    gitignore.write_text("\n".join(lines))


def list_staged() -> set[Path]:
    """Enumerate what *would* be staged given the manifest — used by cleanup
    helpers to distinguish fetched items from stale plugin symlinks."""
    manifest = load_manifest()
    out: set[Path] = set()
    for plugin_name, plugin in manifest["plugins"].items():
        for name in plugin.get("skills", []):
            out.add(RULESYNC / "skills" / name)
        for name in plugin.get("agents", []):
            out.add(RULESYNC / "subagents" / f"{name}.md")
        for name in plugin.get("commands", []):
            out.add(RULESYNC / "commands" / f"{name}.md")
        for name in plugin.get("guides", []):
            if name.startswith("_"):
                continue
            out.add(RULESYNC / "rules" / name)
    return out


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--list", action="store_true", help="List items that would be staged")
    args = parser.parse_args()

    if args.list:
        for p in sorted(list_staged()):
            print(p.relative_to(REPO_ROOT))
        return

    stage(dry_run=args.dry_run)


if __name__ == "__main__":
    main()
