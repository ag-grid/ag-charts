#!/bin/bash

# Exit on any error, undefined variable, or pipe failure
set -euo pipefail

export AG_SKIP_NATIVE_DEP_VERSION_CHECK=1
export PUPPETEER_SKIP_DOWNLOAD=true

# Helper function to log info messages to stdout
log_info() {
    echo "[install-for-cloud] $*"
}

# Helper function to log error messages to stderr
log_error() {
    echo "[install-for-cloud] ERROR: $*" >&2
}

if [ "${AG_CLOUD_INSTALL:-}" == "1" ]; then
    log_info "AG_CLOUD_INSTALL set, initializing environment"
elif [ "${AG_CLOUD_INSTALL:-}" == "0" ]; then
    log_info "Disabled by AG_CLOUD_INSTALL, skipping environment initialization"
    exit 0
elif [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
    # Check if running in Claude Code remote environment
    log_info "AG_CLOUD_INSTALL or CLAUDE_CODE_REMOTE not set, skipping environment initialization"
    exit 1
fi

# Ensure we're in the project directory
if [ ! -f package.json ]; then
    log_error "package.json not found in current directory"
    exit 2
fi

# Function to install nx globally
install_nx() {
    if command -v nx &> /dev/null; then
        log_info "nx is already installed, skipping install"
        return 0
    fi

    log_info "Installing nx globally"

    # Check if node is available
    if ! command -v node &> /dev/null; then
        log_error "node is not available"
        return 2
    fi

    # Install Nx globally with the version from package.json
    local nx_version
    nx_version=$(node -p "require('./package.json').devDependencies.nx" 2>/dev/null) || {
        log_error "Failed to extract nx version from package.json"
        return 2
    }

    log_info "Installing nx@${nx_version} globally"
    if ! yarn global add "nx@${nx_version}"; then
        log_error "Failed to install nx globally"
        return 2
    fi

    log_info "Successfully installed nx@${nx_version}"
    return 0
}

opt_enable_direnv() {
    if ! command -v direnv &> /dev/null; then
        log_info "direnv is not installed, skipping enablement"
        return 0
    fi

    if direnv allow; then
        log_info "direnv enabled successfully"
        return 0
    else
        log_error "Failed to enable direnv"
        return 2
    fi
}

# Function to install yarn and initial dependencies
install_yarn() {
    # Create .yarnrc to ignore engine checks
    cat >.yarnrc <<EOF
--install.ignore-engines true
--run.ignore-engines true
EOF

    if command -v yarn &> /dev/null; then
        log_info "yarn is already installed, skipping install"
        return 0
    fi

    log_info "Installing yarn@1 and initial dependencies"

    # Install yarn v1 globally
    if ! npm i -g --force yarn@1; then
        log_error "Failed to install yarn@1 globally"
        return 2
    fi

    log_info "yarn@1 installed successfully"
}

symlink_nx_cache() {
    if [ -d .nx ]; then
        return 0
    fi
    if [ ! -d ${$ROOT_WORKTREE_PATH:-$PWD}/.nx ]; then
        log_error "Root worktree .nx directory not found"
        return 0
    fi
    
    mkdir -p .nx
    if [ -d ${$ROOT_WORKTREE_PATH}/.nx/cache ]; then
        log_info "Symlinking nx cache"
        ln -sf ${$ROOT_WORKTREE_PATH}/.nx/cache .nx/cache
    fi
    if [ -d ${$ROOT_WORKTREE_PATH}/.nx/workspace-data ]; then
        log_info "Symlinking nx workspace data"
        cp -r ${$ROOT_WORKTREE_PATH}/.nx/workspace-data .nx/workspace-data
    fi
}

# Function to install/update dependencies when node_modules exists
install_dependencies() {
    log_info "Checking dependency integrity"

    # Check if dependencies are already installed and valid
    if yarn check --integrity 2>/dev/null; then
        log_info "Dependencies already installed and valid, running postinstall"
        if ! yarn postinstall; then
            log_error "postinstall script failed"
            return 2
        fi
    else
        log_info "Installing/updating dependencies"
        if ! yarn install --ci; then
            log_error "Failed to install dependencies"
            return 2
        fi
        log_info "Dependencies installed successfully"
    fi

    return 0
}

# Main installation logic
main() {
    log_info "Starting installation process"

    if [ -d node_modules ]; then
        log_info "node_modules directory exists, checking dependencies"
        if ! install_dependencies; then
            exit 2
        fi
    else
        log_info "node_modules directory not found, performing fresh install"
        if ! install_yarn; then
            exit 2
        fi
        if ! install_nx; then
            exit 2
        fi

        if ! install_dependencies; then
            exit 2
        fi
    fi

    if ! opt_enable_direnv; then
        exit 2
    fi

    if ! symlink_nx_cache; then
        exit 2
    fi

    # Verify nx is available after installation
    if command -v nx &> /dev/null; then
        log_info "Installation completed successfully - nx is available"
    else
        log_info "Installation completed - nx may require shell restart to be available in PATH"
    fi

    exit 0
}

# Run main function
main
