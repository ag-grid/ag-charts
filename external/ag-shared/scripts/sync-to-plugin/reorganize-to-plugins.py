#!/usr/bin/env python3
"""Reorganise a flat prompts tree into a multi-plugin layout.

Reads ``.claude-plugin/plugin-assignments.json`` and moves each listed skill,
agent, command, guide, and patch into ``plugins/<name>/<category>/...`` so the
resulting tree matches the Claude Code multi-plugin marketplace convention.

For each plugin, a ``plugins/<name>/.claude-plugin/plugin.json`` file is
generated from the manifest's ``version`` / ``description`` fields, with a
shared author.

This script runs inside the filtered ag-shared output produced by
``git filter-repo --subdirectory-filter prompts/`` in ``sync-to-plugin.sh``.
It uses ``git mv`` so the resulting history preserves blame across files.

Exit status:
    0 — success
    1 — manifest missing or invalid
    2 — unassigned items found (error unless --allow-unassigned)
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

AUTHOR = {"name": "AG Grid"}


def run(args: list[str], *, check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(args, check=check, capture_output=True, text=True)


def git_mv(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    run(["git", "mv", str(src), str(dst)])


def git_rm(path: Path) -> None:
    run(["git", "rm", "-rf", "--quiet", str(path)])


def git_add(path: Path) -> None:
    run(["git", "add", str(path)])


def write_plugin_json(plugin_dir: Path, name: str, version: str, description: str) -> None:
    plugin_json = plugin_dir / ".claude-plugin" / "plugin.json"
    plugin_json.parent.mkdir(parents=True, exist_ok=True)
    plugin_json.write_text(
        json.dumps(
            {"name": name, "version": version, "description": description, "author": AUTHOR},
            indent=4,
            ensure_ascii=False,
        )
        + "\n"
    )
    git_add(plugin_json)


def move_items(
    root: Path,
    plugin_dir: Path,
    category: str,
    items: list[str],
    *,
    is_directory: bool,
    suffix: str = "",
) -> list[str]:
    """Move items from ``root/<category>/<item><suffix>`` into ``plugin_dir/<category>/``."""
    moved: list[str] = []
    for item in items:
        src = root / category / f"{item}{suffix}"
        if not src.exists():
            print(f"  ! {category}/{item}{suffix} (not found)", file=sys.stderr)
            continue
        dst = plugin_dir / category / f"{item}{suffix}"
        git_mv(src, dst)
        moved.append(item)
    return moved


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root",
        type=Path,
        default=Path.cwd(),
        help="Working tree root (default: cwd)",
    )
    parser.add_argument(
        "--allow-unassigned",
        action="store_true",
        help="Warn instead of erroring when unassigned items are found",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Report the plan without moving files",
    )
    args = parser.parse_args()

    root = args.root.resolve()
    manifest_path = root / ".claude-plugin" / "plugin-assignments.json"
    if not manifest_path.exists():
        print(f"ERROR: manifest not found at {manifest_path}", file=sys.stderr)
        return 1

    manifest = json.loads(manifest_path.read_text())
    version = manifest.get("version", "0.4.0")
    plugins = manifest.get("plugins", {})
    if not plugins:
        print("ERROR: manifest has no 'plugins' entries", file=sys.stderr)
        return 1

    # Track what we've moved so we can detect unassigned items
    moved_by_category: dict[str, set[str]] = {
        "skills": set(),
        "agents": set(),
        "commands": set(),
        "guides": set(),
        "patches": set(),
    }

    if args.dry_run:
        print("=== DRY RUN — reorganisation plan ===")
        for name, spec in plugins.items():
            print(f"\nplugin: {name}")
            print(f"  description: {spec.get('description', '')}")
            for cat in ("skills", "agents", "commands", "guides", "patches"):
                items = spec.get(cat, [])
                if items:
                    print(f"  {cat}: {items}")
        return 0

    print("Reorganising files into plugins/<name>/ layout...")

    for name, spec in plugins.items():
        plugin_dir = root / "plugins" / name
        description = spec.get("description", "")
        print(f"\nplugin: {name} (v{version})")
        write_plugin_json(plugin_dir, name, version, description)

        # Skills are directories (skills/<name>/)
        for item in move_items(
            root, plugin_dir, "skills", spec.get("skills", []), is_directory=True
        ):
            moved_by_category["skills"].add(item)

        # Agents are .md files (agents/<name>.md)
        for item in move_items(
            root, plugin_dir, "agents", spec.get("agents", []), is_directory=False, suffix=".md"
        ):
            moved_by_category["agents"].add(item)

        # Commands are .md files (commands/<name>.md)
        for item in move_items(
            root, plugin_dir, "commands", spec.get("commands", []), is_directory=False, suffix=".md"
        ):
            moved_by_category["commands"].add(item)

        # Guides are .md files (guides/<name>.md)
        for item in move_items(
            root, plugin_dir, "guides", spec.get("guides", []), is_directory=False
        ):
            moved_by_category["guides"].add(item)

        # Patches are files with any extension (patches/<file>)
        for item in move_items(
            root, plugin_dir, "patches", spec.get("patches", []), is_directory=False
        ):
            moved_by_category["patches"].add(item)

    # Remove superseded root plugin.json (replaced by per-plugin variants)
    root_plugin_json = root / ".claude-plugin" / "plugin.json"
    if root_plugin_json.exists():
        git_rm(root_plugin_json)
        print("\nRemoved superseded root .claude-plugin/plugin.json")

    # Remove commands/docs/ — internal helpers for local doc-review commands
    # (which stay in .rulesync/ and reference the helpers via filesystem path)
    commands_docs = root / "commands" / "docs"
    if commands_docs.exists():
        git_rm(commands_docs)
        print("Removed commands/docs/ (local-tier helpers, not plugin content)")

    # Detect unassigned items
    unassigned: dict[str, list[str]] = {}
    categories = {
        "skills": ("skills", True, ""),
        "agents": ("agents", False, ".md"),
        "commands": ("commands", False, ".md"),
        "guides": ("guides", False, ""),
        "patches": ("patches", False, ""),
    }
    for cat, (dirname, is_dir, suffix) in categories.items():
        cat_dir = root / dirname
        if not cat_dir.exists():
            continue
        for entry in cat_dir.iterdir():
            if is_dir and not entry.is_dir():
                continue
            if not is_dir and not entry.is_file():
                continue
            if is_dir:
                item_name = entry.name
            else:
                item_name = entry.stem if suffix else entry.name
            if item_name not in moved_by_category[cat]:
                unassigned.setdefault(cat, []).append(entry.name)

    if unassigned:
        print("\n⚠ Unassigned items (not in manifest):", file=sys.stderr)
        for cat, items in unassigned.items():
            for item in items:
                print(f"  {cat}/{item}", file=sys.stderr)
        if not args.allow_unassigned:
            print("\nERROR: unassigned items present. Add to manifest or use --allow-unassigned.", file=sys.stderr)
            return 2

    # Remove now-empty top-level category directories
    for dirname in ("skills", "agents", "commands", "guides", "patches"):
        cat_dir = root / dirname
        if cat_dir.exists() and not any(cat_dir.iterdir()):
            cat_dir.rmdir()
            print(f"Removed empty top-level {dirname}/")

    print("\n✓ Reorganisation complete.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
