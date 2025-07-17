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

# Add MCPs
claude mcp add browser "npx @browsermcp/mcp@latest"
claude mcp add puppeteer "npx -y @modelcontextprotocol/server-puppeteer"
claude mcp add fetch "npx -y @kazuph/mcp-fetch"
claude mcp add browser-tools "npx -y @agentdeskai/browser-tools-mcp@1.2.1"
claude mcp add sequential-thinking "npx -y @modelcontextprotocol/server-sequential-thinking"
claude mcp add context7 "npx -y @upstash/context7-mcp"
if [ -n "${JIRA_URL}" ] && [ -n "${JIRA_USERNAME}" ] && [ -n "${JIRA_API_TOKEN}" ]; then
    claude mcp add mcp-bls-jira "docker run -i --rm -e JIRA_URL=${JIRA_URL} -e JIRA_USERNAME=${JIRA_USERNAME} -e JIRA_API_TOKEN=${JIRA_API_TOKEN} ghcr.io/sooperset/mcp-atlassian:latest"
fi