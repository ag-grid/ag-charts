#!/bin/bash

# Exit on any error, undefined variable, or pipe failure
set -euo pipefail

# Helper function to log info messages to stdout
log_info() {
    echo "[install-for-cloud] $*"
}

# Helper function to log error messages to stderr
log_error() {
    echo "[install-for-cloud] ERROR: $*" >&2
}

# Check if running in Claude Code remote environment
if [ "${CLAUDE_CODE_REMOTE:-false}" != "true" ]; then
    log_info "Not a remote session, skipping install"
    exit 0
fi

if [ "${AG_CLOUD_INSTALL:-1}" == "0" ]; then
    log_info "Disabled by AG_CLOUD_INSTALL env-var, skipping install"
    exit 0
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
