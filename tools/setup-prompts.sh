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

function path_to_root() {
    local target_file=$1

    # Count directory levels in target_file path
    local dir_count=$(echo "$target_file" | tr -cd '/' | wc -c)
    
    # Build relative path with appropriate number of ../ prefixes
    local relative_path="./"
    for ((i=0; i<dir_count; i++)); do
        relative_path="$relative_path../"
    done

    echo "$relative_path"
}

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

function cleanup_old_backups() {
    local target_file=$1
    local max_backups=${2:-3}

    # Find and remove old backup files (keep only the most recent max_backups)
    local backup_dir=$(dirname "$target_file")
    local backup_name=$(basename "$target_file")

    # Count backup files and remove old ones if we exceed the limit
    local backup_count=$(find "$backup_dir" -name "${backup_name}.bak*" -type f 2>/dev/null | wc -l)

    if [[ $backup_count -gt $max_backups ]]; then
        echo "Found $backup_count backup files, cleaning up to keep only $max_backups most recent"

        # Use ls with modification time sort to get files in reverse chronological order
        # Then remove the excess files
        ls -t "$backup_dir"/${backup_name}.bak* 2>/dev/null | tail -n +$((max_backups + 1)) | while read -r old_backup; do
            if [[ -f "$old_backup" ]]; then
                echo "Removing old backup: $old_backup"
                rm -f "$old_backup"
            fi
        done
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
    local mode=${3:-link}

    mkdir -p $target_dir
    if [[ "$format" == "md" && "$mode" == "link" ]]; then
        for file in tools/prompts/commands/*.md; do
            if [[ -f "$target_dir/$(basename "$file")" ]]; then
                rm "$target_dir/$(basename "$file")"
            fi
            ln -sf "$(pwd)/$file" "$target_dir/$(basename "$file")"
        done
    elif [[ "$format" == "md" && "$mode" == "copy" ]]; then
        for file in tools/prompts/commands/*.md; do
            if [[ -f "$target_dir/$(basename "$file")" ]]; then
                rm "$target_dir/$(basename "$file")"
            fi
            cp "$file" "$target_dir/$(basename "$file")"
        done
    elif [[ "$format" == "toml" ]]; then
        for file in tools/prompts/commands/*.md; do
            cat > "$target_dir/$(basename ${file%.md}).toml" <<EOF
prompt = """
@$(path_to_root $target_dir)${file}
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

function setup_skills() {
    local target_dir=$1

    mkdir -p $target_dir
    for skill_dir in tools/prompts/skills/*/; do
        if [[ -d "$skill_dir" ]]; then
            local skill_name=$(basename "$skill_dir")
            # Remove existing symlink or directory if it exists
            if [[ -L "$target_dir/$skill_name" || -d "$target_dir/$skill_name" ]]; then
                rm -rf "$target_dir/$skill_name"
            fi
            ln -sf "../../$skill_dir" "$target_dir/$skill_name"
        fi
    done
}

function setup_instructions() {
    local target_file=$1

    mkdir -p $(dirname $target_file)
    ln -sf "./tools/prompts/AGENTS.md" "$target_file"
}

function setup_mcp() {
    local target_file=$1

    # Calculate the relative path from target_file to the MCP config
    local target_dir=$(dirname "$target_file")
    
    local relative_path=$(path_to_root $target_file)

    # Create symlink with calculated relative path
    ln -sf "${relative_path}tools/prompts/.mcp.json" "$target_file"
}

function setup_cursor_worktrees() {
    local target_file=$1

    mkdir -p $(dirname $target_file)
    ln -sf "./tools/prompts/.cursor-worktrees.json" "$target_file"
}

function configure_mcp() {
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

    function add_sse_mcp() {
        local name=$1
        local scope=$2
        local url=$3
        if (claude mcp get "$name" 2>&1 | grep -q "Scope: Project") ; then
            claude mcp remove "$name" -s project
        fi
        if (claude mcp get "$name" 2>&1 | grep -q "Scope: Local") ; then
            claude mcp remove "$name" -s local
        fi
        claude mcp add "$name" -s $scope --transport sse $url
    }

    add_mcp fetch project yarn run --silent mcp-fetch
    add_mcp sequential-thinking project yarn run --silent mcp-server-sequential-thinking
    add_mcp context7 project yarn run --silent context7-mcp
    add_mcp puppeteer project yarn run --silent mcp-server-puppeteer
    add_mcp chrome-devtools project tools/prompts/nvm-exec.sh --silent 22 npx -y --silent chrome-devtools-mcp@latest
    add_sse_mcp atlassian project https://mcp.atlassian.com/v1/sse

    # Ensure Gemini config entries are added
    target_file="tools/prompts/.mcp.json"
    jq ".contextFileName = \"AGENTS.md\"" "$target_file" > "$target_file.tmp"
    mv "$target_file.tmp" "$target_file"
    npx prettier --write "$target_file"
}


function setup_vscode_mcp() {
    local target_file=$1
    local mcp_json_file="./tools/prompts/.mcp.json"
    
    # Check if jq is available
    if ! command -v jq >/dev/null 2>&1; then
        echo "Warning: jq not found. Cannot update MCP config."
        echo "Install with: brew install jq"
        return 1
    fi
    
    # Check if source JSON file exists
    if [[ ! -f "$target_file" ]]; then
        mkdir -p $(dirname "$target_file")
        echo '{"servers": {}}' > "$target_file"
    fi

    # Add each MCP server from JSON to the target JSON file by reading and then editing the file in place
    jq -r '.mcpServers | to_entries[] | @base64' "$mcp_json_file" | while read -r entry; do
        local server_name=$(echo "$entry" | base64 -d | jq -r '.key')
        local server_config=$(echo "$entry" | base64 -d | jq -r '.value')
        jq --argjson server_config "$server_config" ".servers += { (\"$server_name\"): \$server_config }" "$target_file" > "$target_file.tmp"
        mv "$target_file.tmp" "$target_file"
    done
}

function setup_codex_mcp() {
    local target_file=$1
    local mcp_json_file="./tools/prompts/.mcp.json"
    
    # Check if jq is available
    if ! command -v jq >/dev/null 2>&1; then
        echo "Warning: jq not found. Cannot update MCP config."
        echo "Install with: brew install jq"
        return 1
    fi
    
    # Check if source JSON file exists
    if [[ ! -f "$mcp_json_file" ]]; then
        echo "Warning: $mcp_json_file not found."
        return 1
    fi
    
    # Create target directory if it doesn't exist
    mkdir -p $(dirname "$target_file")
    
    # Backup existing file if it exists
    if [[ -f "$target_file" ]]; then
        cp "$target_file" "${target_file}.bak"
    fi
    
    # Create a temporary file for the new config
    local temp_config=$(mktemp)
    
    # If existing file exists and has content, preserve non-ag-charts sections
    if [[ -f "$target_file" ]] && [[ -s "$target_file" ]]; then
        # Copy existing config, removing old ag-charts sections
        local in_ag_charts_section=false
        local skip_next_blank=false
        while IFS= read -r line; do
            # Check if we're entering an ag-charts MCP server section
            if [[ "$line" =~ ^\[mcp_servers\.\"ag-charts- ]] || [[ "$line" == "# AG Charts MCP Servers (auto-generated)" ]]; then
                in_ag_charts_section=true
                skip_next_blank=true
                continue
            elif [[ "$line" =~ ^\[.*\] ]] && [[ ! "$line" =~ ^\[mcp_servers\.\"ag-charts- ]]; then
                # We're entering a different section
                in_ag_charts_section=false
                skip_next_blank=false
            fi
            
            # Skip ag-charts MCP server sections and their content
            if [[ "$in_ag_charts_section" == true ]]; then
                continue
            fi
            
            # Skip blank lines immediately after removed sections
            if [[ "$skip_next_blank" == true ]] && [[ -z "$line" ]]; then
                skip_next_blank=false
                continue
            fi
            
            echo "$line"
        done < "$target_file" > "$temp_config"
    fi
    
    # Add the new ag-charts MCP server configurations
    {
        echo ""
        echo "# AG Charts MCP Servers (auto-generated)"
        
        # Process each MCP server from JSON
        jq -r '.mcpServers | to_entries[] | @base64' "$mcp_json_file" | while read -r entry; do
            # Decode the base64-encoded entry
            local server_name=$(echo "$entry" | base64 -d | jq -r '.key')
            local server_config=$(echo "$entry" | base64 -d | jq -r '.value')
            
            # Write TOML section for this server with ag-charts prefix
            echo ""
            echo "[mcp_servers.\"ag-charts-$server_name\"]"
            
            # Extract and write command
            local command=$(echo "$server_config" | jq -r '.command')
            echo "command = \"$command\""
            
            # Add working directory to run in the ag-charts project
            echo "cwd = \"$(pwd)\""
            
            # Extract and write args array
            local args=$(echo "$server_config" | jq -c '.args')
            if [[ "$args" != "null" && "$args" != "[]" ]]; then
                # Convert JSON array to TOML array format
                local toml_args=$(echo "$args" | jq -r '. | map("\"" + . + "\"") | join(", ")')
                echo "args = [$toml_args]"
            else
                echo "args = []"
            fi
            
            # Extract and write env object if it exists and is not empty
            local env=$(echo "$server_config" | jq -c '.env // {}')
            if [[ "$env" != "{}" && "$env" != "null" ]]; then
                # Convert JSON object to TOML inline table format
                local toml_env=$(echo "$env" | jq -r 'to_entries | map("\(.key) = \"\(.value)\"") | join(", ")')
                echo "env = { $toml_env }"
            fi
            
            # Extract type if present (for stdio type)
            local type=$(echo "$server_config" | jq -r '.type // empty')
            if [[ -n "$type" ]]; then
                echo "type = \"$type\""
            fi
        done
    } >> "$temp_config"
    
    # Move the temp file to the target location
    mv "$temp_config" "$target_file"
    
    if [[ -f "${target_file}.bak" ]]; then
        echo "✓ Updated Codex MCP configuration at $target_file"
        echo "  (Backup saved as ${target_file}.bak)"
        # Cleanup old backup files, keeping only the 3 most recent
        cleanup_old_backups "$target_file" 3
    else
        echo "✓ Created Codex MCP configuration at $target_file"
    fi
}

# Check and configure git symlinks before setting up files
check_symlinks_config

# Add MCPs if UPDATE_MCP_CONFIG is enabled
# This needs to happen first as other MCP setup steps depend on the MCPs being configured in JSON first.
if [ "$UPDATE_MCP_CONFIG" = true ]; then
    configure_mcp
fi

if (command -v claude >/dev/null 2>&1) ; then
    setup_commands .claude/commands
    setup_agents .claude/agents
    setup_skills .claude/skills
    setup_instructions CLAUDE.md
    setup_mcp .mcp.json
fi

if (command -v gemini >/dev/null 2>&1) ; then
    setup_commands .gemini/commands toml
    setup_instructions AGENTS.md
    setup_mcp .gemini/settings.json
fi

if (command -v cursor >/dev/null 2>&1) ; then
    setup_commands .cursor/commands md link
    setup_instructions AGENTS.md
    setup_mcp .cursor/mcp.json
    setup_cursor_worktrees .cursor/worktrees.json
fi

if (command -v codex >/dev/null 2>&1) ; then
    echo "WARNING: Setting up Codex, note all config is user-scoped not project-scoped."
    setup_commands ~/.codex/prompts md copy
    setup_instructions AGENTS.md
    setup_codex_mcp ~/.codex/config.toml
fi

# Copilot setup - not sure if there is a better way to detect?
if [[ "${TERM_PROGRAM:-}" == "vscode" ]]; then
    setup_vscode_mcp .vscode/mcp.json
    setup_instructions AGENTS.md
    mkdir -p .github/prompts
    for prompt in pr-review.md release-options-review.md docs-review.md spruce-example.md; do
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

if [[ -n "${AG_GRID_DOCUMENTATION_ROOT:-}" ]]; then
    if [[ ! -d "$AG_GRID_DOCUMENTATION_ROOT/docs/design-decisions/charts" ]]; then
        echo "AG_GRID_DOCUMENTATION_ROOT is set but $AG_GRID_DOCUMENTATION_ROOT/docs/design-decisions/charts does not exist"
    else
        ln -sf "$AG_GRID_DOCUMENTATION_ROOT/docs/design-decisions/charts" docs
    fi
fi
