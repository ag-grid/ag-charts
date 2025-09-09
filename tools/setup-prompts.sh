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

function setup_commands() {
    local target_dir=$1
    local format=${2:-md}

    mkdir -p $target_dir
    if [[ "$format" == "md" ]]; then
        for file in tools/prompts/commands/*.md; do
            ln -sf "$(pwd)/$file" "$target_dir/$(basename "$file")"
        done
    elif [[ "$format" == "toml" ]]; then
        for file in tools/prompts/commands/*.md; do
            cat > "$target_dir/$(basename ${file%.md}).toml" <<EOF
prompt = """
$(cat "$file")
"""
EOF
        done
    fi
}

function setup_agents() {
    local target_dir=$1

    mkdir -p $target_dir
    for file in tools/prompts/agents/*.md; do
        ln -sf "$(pwd)/$file" "$target_dir/$(basename "$file")"
    done
}

function setup_instructions() {
    local target_file=$1

    mkdir -p $(dirname $target_file)
    ln -sf "$(pwd)/tools/prompts/AGENTS.md" "$target_file"
}

function setup_mcp() {
    local target_file=$1

    ln -sf "$(pwd)/tools/prompts/.mcp.json" "$target_file"
}

if (command -v claude >/dev/null 2>&1) ; then
    setup_commands .claude/commands
    setup_agents .claude/agents
    setup_instructions CLAUDE.md
    setup_mcp .mcp.json
fi

if (command -v gemini >/dev/null 2>&1) ; then
    setup_commands .gemini/commands toml
    setup_instructions AGENTS.md
    setup_mcp .gemini/settings.json
fi

if (command -v cursor-agent >/dev/null 2>&1) ; then
    setup_instructions AGENTS.md
    setup_mcp .mcp.json
fi

# Copilot setup - not sure if there is a better way to detect?
if [[ "${TERM_PROGRAM:-}" == "vscode" ]]; then
    setup_instructions AGENTS.md
    mkdir -p .github/prompts
    for prompt in pr-review.md release-options-review.md docs-review.md; do
        prompt_file="tools/prompts/commands/$prompt"
        copilot_prompt=".github/prompts/${prompt%.md}.prompt.md"
        if [[ -f "$prompt_file" && ! -f "$copilot_prompt" ]] ; then
            ln -sf "../../$prompt_file" "$copilot_prompt"
        fi
    done
fi

# Enable direnv if it is installed and the .claude-ag-grid directory exists
if command -v direnv >/dev/null 2>&1 && [ -d "$HOME/.claude-ag-grid/" ]; then
    direnv allow
fi

# Add MCPs if UPDATE_MCP_CONFIG is enabled
if [ "$UPDATE_MCP_CONFIG" = true ]; then
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
