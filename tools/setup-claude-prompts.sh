#!/bin/bash

# Setup Claude prompts by symlinking files from tools/prompts/ to appropriate locations
# Only run if claude command is available

# Check if claude command exists
if ! command -v claude >/dev/null 2>&1; then
    exit 0
fi

# Create .claude/{commands,agents}/ directory if it doesn't exist
mkdir -p .claude/{commands,agents}/

# Symlink CLAUDE.md to root
if [ -f "tools/prompts/CLAUDE.md" ]; then
    ln -sf "tools/prompts/CLAUDE.md" "CLAUDE.md"
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
    local command=$2
    shift 2
    local args=$@
    if (claude mcp get "$name" 2>&1 | grep -q "Scope: Local") ; then
        claude mcp remove "$name" -s local
    fi
    claude mcp add "$name" -s local -- "$command" $args
}

# Add MCPs
add_mcp fetch npx -y @kazuph/mcp-fetch
add_mcp sequential-thinking npx -y @modelcontextprotocol/server-sequential-thinking
add_mcp context7 npx -y @upstash/context7-mcp
add_mcp puppeteer npx -y @modelcontextprotocol/server-puppeteer

if [ -n "${GITHUB_PERSONAL_ACCESS_TOKEN}" ]; then
    add_mcp mcp-github docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN=${GITHUB_PERSONAL_ACCESS_TOKEN} ghcr.io/github/github-mcp-server
else
    echo "GITHUB_PERSONAL_ACCESS_TOKEN is not set, skipping mcp-github"
fi

if command -v docker >/dev/null 2>&1; then
    if [ -n "${JIRA_URL}" ] && [ -n "${JIRA_USERNAME}" ] && [ -n "${JIRA_API_TOKEN}" ]; then
        add_mcp ag-jira docker run -i --rm -e JIRA_URL=${JIRA_URL} -e JIRA_USERNAME=${JIRA_USERNAME} -e JIRA_API_TOKEN=${JIRA_API_TOKEN} ghcr.io/sooperset/mcp-atlassian:latest
    else
        echo "JIRA_URL, JIRA_USERNAME, and JIRA_API_TOKEN are not set, skipping ag-jira"
    fi
fi
