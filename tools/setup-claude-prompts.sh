#!/bin/bash

set -euo pipefail

# Setup Claude prompts by symlinking files from tools/prompts/ to appropriate locations
# Only run if claude command is available

# Parse command line options
UPDATE_MCP_CONFIG=false
while getopts "u" opt; do
    case $opt in
        u)
            UPDATE_MCP_CONFIG=true
            ;;
        \?)
            echo "Invalid option: -$OPTARG" >&2
            exit 1
            ;;
    esac
done

# Check if claude command exists
if ! command -v claude >/dev/null 2>&1; then
    echo "claude command not found"
    exit 0
fi

if command -v direnv >/dev/null 2>&1 && [ -d "$HOME/.claude-ag-grid/" ]; then
    direnv allow
fi

# Create .claude/{commands,agents}/ directory if it doesn't exist
mkdir -p .claude/{commands,agents}/

# Symlink CLAUDE.md to root
if [[ -f "tools/prompts/CLAUDE.md" && ! -f "CLAUDE.md" ]] ; then
    ln -sf "tools/prompts/CLAUDE.md" "CLAUDE.md"
fi

# Symlink .mcp.json to root
if [[ -f "tools/prompts/.mcp.json" && ! -f ".mcp.json" ]] ; then
    ln -sf "tools/prompts/.mcp.json" ".mcp.json"
fi

# Symlink other .md files to .claude/commands/
for file in tools/prompts/commands/*.md; do
    ln -sf "../../$file" ".claude/commands/$(basename "$file")"
done

# Symlink other .md files to .claude/commands/
for file in tools/prompts/agents/*.md; do
    ln -sf "../../$file" ".claude/agents/$(basename "$file")"
done

function add_mcp() {
    local name=$1
    local scope=$2
    local command=$3
    shift 3
    local args=$@
    if (claude mcp get "$name" 2>&1 | grep -q "Scope: Project") ; then
        claude mcp remove "$name" -s project
    fi
    if (claude mcp get "$name" 2>&1 | grep -q "Scope: Local") ; then
        claude mcp remove "$name" -s local
    fi
    claude mcp add "$name" -s $scope -- "$command" $args
}

# Add MCPs if UPDATE_MCP_CONFIG is enabled
if [ "$UPDATE_MCP_CONFIG" = true ]; then
    add_mcp fetch project yarn run mcp-fetch
    add_mcp sequential-thinking project yarn run mcp-server-sequential-thinking
    add_mcp context7 project yarn run context7-mcp
    add_mcp puppeteer project yarn run mcp-server-puppeteer

    if command -v docker >/dev/null 2>&1; then
        if [ -n "${JIRA_URL}" ] && [ -n "${JIRA_USERNAME}" ] && [ -n "${JIRA_API_TOKEN}" ]; then
            add_mcp ag-jira local docker run -i --rm -e JIRA_URL=${JIRA_URL} -e JIRA_USERNAME=${JIRA_USERNAME} -e JIRA_API_TOKEN=${JIRA_API_TOKEN} ghcr.io/sooperset/mcp-atlassian:latest
        else
            echo "JIRA_URL, JIRA_USERNAME, and JIRA_API_TOKEN are not set, skipping ag-jira"
        fi
    fi
fi
