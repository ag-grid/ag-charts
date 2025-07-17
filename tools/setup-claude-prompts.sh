#!/bin/bash

# Setup Claude prompts by symlinking files from tools/prompts/ to appropriate locations
# Only run if claude command is available

# Check if claude command exists
if ! command -v claude >/dev/null 2>&1; then
    exit 0
fi

# Create .claude/commands/ directory if it doesn't exist
mkdir -p .claude/commands/

# Symlink CLAUDE.md to root
if [ -f "tools/prompts/CLAUDE.md" ]; then
    ln -sf "tools/prompts/CLAUDE.md" "CLAUDE.md"
fi

# Symlink other .md files to .claude/commands/
for file in tools/prompts/*.md; do
    if [ -f "$file" ] && [ "$(basename "$file")" != "CLAUDE.md" ]; then
        ln -sf "../../$file" ".claude/commands/$(basename "$file")"
    fi
done