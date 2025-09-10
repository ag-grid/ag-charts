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

function check_symlinks_config() {
    # Check if core.symlinks is set to true
    local symlinks_setting=$(git config --get core.symlinks)
    
    if [[ "$symlinks_setting" != "true" ]]; then
        echo "Setting git core.symlinks to true..."
        git config core.symlinks true
        echo "✓ Git configured to handle symlinks properly"
    else
        echo "✓ Git symlinks already configured correctly"
    fi
}

function restore_tracked_symlinks() {
    local restored=0
    
    # Check AGENTS.md
    if [[ -f "AGENTS.md" && ! -L "AGENTS.md" ]]; then
        echo "Restoring AGENTS.md as symlink..."
        rm -f AGENTS.md
        ln -sf "$(pwd)/tools/prompts/AGENTS.md" "AGENTS.md"
        ((restored++))
    fi
    
    # Check CLAUDE.md
    if [[ -f "CLAUDE.md" && ! -L "CLAUDE.md" ]]; then
        echo "Restoring CLAUDE.md as symlink..."
        rm -f CLAUDE.md
        ln -sf "$(pwd)/tools/prompts/AGENTS.md" "CLAUDE.md"
        ((restored++))
    fi
    
    if [[ $restored -gt 0 ]]; then
        echo "✓ Restored $restored git-tracked symlinks"
        echo "  You may need to commit these changes if they were previously checked in as regular files"
    else
        echo "✓ All git-tracked symlinks are correct"
    fi
}

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
        ln -sf "../../$file" "$target_dir/$(basename "$file")"
    done
}

function setup_instructions() {
    local target_file=$1

    mkdir -p $(dirname $target_file)
    ln -sf "./tools/prompts/AGENTS.md" "$target_file"
}

function setup_mcp() {
    local target_file=$1

    ln -sf "./tools/prompts/.mcp.json" "$target_file"
}

# Check and configure git symlinks before setting up files
check_symlinks_config

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

# Restore any git-tracked symlinks that may have been checked out as regular files
restore_tracked_symlinks

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
