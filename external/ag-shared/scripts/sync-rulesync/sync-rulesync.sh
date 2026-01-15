#!/usr/bin/env bash
#
# sync-rulesync.sh - Rulesync configuration synchronization
#
# Ensures rulesync patches and configuration are properly set up in consuming
# repositories. Creates symlinks to shared patches and verifies postinstall
# configuration.
#
# Usage:
#   ./sync-rulesync.sh           # Same as --check
#   ./sync-rulesync.sh --check   # Verify sync status (dry-run)
#   ./sync-rulesync.sh --apply   # Apply sync to current repo
#   ./sync-rulesync.sh --help    # Show help
#
# Exit codes:
#   0 - All checks passed (or successfully applied)
#   1 - Issues found (in --check mode)
#   2 - Failed to apply fixes

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

# Shared patch location (relative to repo root)
SHARED_PATCHES_REL="external/ag-shared/prompts/patches"
PATCH_FILE="rulesync+5.2.0.patch"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track status
ISSUES=0
FIXED=0

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((ISSUES++)) || true
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ((ISSUES++)) || true
}

log_fixed() {
    echo -e "${GREEN}[FIXED]${NC} $1"
    ((FIXED++)) || true
}

# Check if patches directory exists
check_patches_dir() {
    if [[ -d "$REPO_ROOT/patches" ]]; then
        log_success "patches/ directory exists"
        return 0
    else
        log_warn "patches/ directory missing"
        return 1
    fi
}

# Create patches directory
apply_patches_dir() {
    if [[ ! -d "$REPO_ROOT/patches" ]]; then
        mkdir -p "$REPO_ROOT/patches"
        log_fixed "Created patches/ directory"
    fi
}

# Check if patch symlink exists and points to correct location
check_patch_symlink() {
    local patch_path="$REPO_ROOT/patches/$PATCH_FILE"
    local expected_target="../$SHARED_PATCHES_REL/$PATCH_FILE"

    if [[ ! -e "$patch_path" ]]; then
        log_warn "Patch file missing: patches/$PATCH_FILE"
        return 1
    fi

    if [[ ! -L "$patch_path" ]]; then
        log_warn "Patch file is not a symlink: patches/$PATCH_FILE"
        return 1
    fi

    local actual_target
    actual_target=$(readlink "$patch_path")
    if [[ "$actual_target" != "$expected_target" ]]; then
        log_warn "Patch symlink points to wrong location"
        log_info "  Expected: $expected_target"
        log_info "  Actual: $actual_target"
        return 1
    fi

    log_success "Patch symlink correct: patches/$PATCH_FILE -> $expected_target"
    return 0
}

# Create or fix patch symlink
apply_patch_symlink() {
    local patch_path="$REPO_ROOT/patches/$PATCH_FILE"
    local expected_target="../$SHARED_PATCHES_REL/$PATCH_FILE"
    local shared_patch="$REPO_ROOT/$SHARED_PATCHES_REL/$PATCH_FILE"

    # Verify shared patch exists
    if [[ ! -f "$shared_patch" ]]; then
        log_error "Shared patch not found: $SHARED_PATCHES_REL/$PATCH_FILE"
        return 1
    fi

    # Remove existing file/symlink if it exists
    if [[ -e "$patch_path" ]] || [[ -L "$patch_path" ]]; then
        rm "$patch_path"
    fi

    # Create symlink
    ln -s "$expected_target" "$patch_path"
    log_fixed "Created symlink: patches/$PATCH_FILE -> $expected_target"
}

# Check for stale symlinks in .rulesync/ that point to non-existent targets
# Only checks symlinks pointing to external/ag-shared/ or external/prompts/
check_stale_rulesync_symlinks() {
    local rulesync_dir="$REPO_ROOT/.rulesync"
    local stale_count=0
    local stale_links=()

    if [[ ! -d "$rulesync_dir" ]]; then
        return 0
    fi

    # Check if external/prompts exists and is valid (not a broken symlink)
    local prompts_valid=false
    if [[ -d "$REPO_ROOT/external/prompts" ]] && [[ -e "$REPO_ROOT/external/prompts" ]]; then
        prompts_valid=true
    fi

    # Find all symlinks in .rulesync/ subdirectories
    while IFS= read -r -d '' symlink; do
        if [[ ! -L "$symlink" ]]; then
            continue
        fi

        local target
        target=$(readlink "$symlink")

        # Only check symlinks pointing to external/ag-shared/ or external/prompts/
        if [[ "$target" != *"external/ag-shared/"* ]] && [[ "$target" != *"external/prompts/"* ]]; then
            continue
        fi

        # For external/prompts/ symlinks, only flag as stale if external/prompts/ is valid
        if [[ "$target" == *"external/prompts/"* ]] && [[ "$prompts_valid" != "true" ]]; then
            continue
        fi

        # Check if target exists (resolve from symlink's directory)
        local symlink_dir
        symlink_dir=$(dirname "$symlink")
        if [[ ! -e "$symlink_dir/$target" ]]; then
            ((stale_count++)) || true
            local rel_path="${symlink#$REPO_ROOT/}"
            stale_links+=("$rel_path -> $target")
        fi
    done < <(find "$rulesync_dir" -type l -print0 2>/dev/null)

    if [[ $stale_count -gt 0 ]]; then
        log_warn "Found $stale_count stale symlink(s) in .rulesync/"
        for link in "${stale_links[@]}"; do
            log_info "  $link"
        done
        # Store for apply phase
        STALE_SYMLINKS=("${stale_links[@]}")
        return 1
    fi

    log_success "No stale symlinks in .rulesync/"
    return 0
}

# Remove stale symlinks from .rulesync/
apply_remove_stale_symlinks() {
    local rulesync_dir="$REPO_ROOT/.rulesync"

    if [[ ! -d "$rulesync_dir" ]]; then
        return 0
    fi

    # Check if external/prompts exists and is valid
    local prompts_valid=false
    if [[ -d "$REPO_ROOT/external/prompts" ]] && [[ -e "$REPO_ROOT/external/prompts" ]]; then
        prompts_valid=true
    fi

    local removed=0

    while IFS= read -r -d '' symlink; do
        if [[ ! -L "$symlink" ]]; then
            continue
        fi

        local target
        target=$(readlink "$symlink")

        # Only process symlinks pointing to external/ag-shared/ or external/prompts/
        if [[ "$target" != *"external/ag-shared/"* ]] && [[ "$target" != *"external/prompts/"* ]]; then
            continue
        fi

        # For external/prompts/ symlinks, only remove if external/prompts/ is valid
        if [[ "$target" == *"external/prompts/"* ]] && [[ "$prompts_valid" != "true" ]]; then
            continue
        fi

        # Check if target exists
        local symlink_dir
        symlink_dir=$(dirname "$symlink")
        if [[ ! -e "$symlink_dir/$target" ]]; then
            local rel_path="${symlink#$REPO_ROOT/}"
            rm "$symlink"
            log_fixed "Removed stale symlink: $rel_path"
            ((removed++)) || true
        fi
    done < <(find "$rulesync_dir" -type l -print0 2>/dev/null)

    return 0
}

# Check if postinstall includes patch-package
check_postinstall() {
    local package_json="$REPO_ROOT/package.json"

    if [[ ! -f "$package_json" ]]; then
        log_error "package.json not found"
        return 1
    fi

    # Check for patch-package in postinstall chain
    # Handles both direct invocation and npm-run-all patterns (postinstall:patch)
    local postinstall_script
    local postinstall_patch_script
    postinstall_script=$(node -p "try { require('$package_json').scripts?.postinstall || '' } catch { '' }" 2>/dev/null || echo "")
    postinstall_patch_script=$(node -p "try { require('$package_json').scripts?.['postinstall:patch'] || '' } catch { '' }" 2>/dev/null || echo "")

    if [[ -z "$postinstall_script" ]]; then
        log_warn "No postinstall script found in package.json"
        log_info "  Add a postinstall script that runs 'patch-package'"
        return 1
    fi

    # Direct invocation: postinstall contains patch-package
    if [[ "$postinstall_script" == *"patch-package"* ]]; then
        log_success "package.json postinstall includes patch-package"
        return 0
    fi

    # Indirect via npm-run-all: postinstall runs postinstall:* and postinstall:patch exists
    if [[ "$postinstall_script" == *"postinstall:*"* ]] && [[ "$postinstall_patch_script" == *"patch-package"* ]]; then
        log_success "package.json postinstall:patch includes patch-package"
        return 0
    fi

    log_warn "postinstall script does not invoke patch-package"
    log_info "  Current postinstall: $postinstall_script"
    log_info "  Add 'patch-package' to your postinstall script"
    return 1
}

# Show help
show_help() {
    echo "Usage: sync-rulesync.sh [OPTIONS]"
    echo ""
    echo "Ensures rulesync patches are properly configured in this repository."
    echo ""
    echo "Options:"
    echo "  --check   Verify sync status without making changes (default)"
    echo "  --apply   Apply fixes for any issues found"
    echo "  --help    Show this help message"
    echo ""
    echo "What it checks:"
    echo "  - patches/ directory exists"
    echo "  - patches/$PATCH_FILE symlink points to shared location"
    echo "  - package.json postinstall includes patch-package"
    echo "  - .rulesync/ has no stale symlinks to external/ag-shared/ or external/prompts/"
    echo ""
    echo "Shared patch location: $SHARED_PATCHES_REL/$PATCH_FILE"
}

# Main
main() {
    local mode="check"

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --check)
                mode="check"
                shift
                ;;
            --apply)
                mode="apply"
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}"
                show_help
                exit 1
                ;;
        esac
    done

    echo ""
    echo "========================================"
    echo "  Rulesync Configuration Sync"
    echo "========================================"
    echo ""
    echo "Repository: $REPO_ROOT"
    echo "Mode: $mode"
    echo ""

    case $mode in
        check)
            check_patches_dir || true
            check_patch_symlink || true
            check_postinstall || true
            check_stale_rulesync_symlinks || true
            ;;
        apply)
            # Check and fix patches directory
            if ! check_patches_dir; then
                apply_patches_dir
            fi

            # Check and fix patch symlink
            if ! check_patch_symlink; then
                apply_patch_symlink
            fi

            # Check postinstall (can only warn, not auto-fix)
            check_postinstall || true

            # Check and remove stale symlinks
            if ! check_stale_rulesync_symlinks; then
                apply_remove_stale_symlinks
            fi
            ;;
    esac

    echo ""
    echo "========================================"
    if [[ $mode == "apply" ]] && [[ $FIXED -gt 0 ]]; then
        echo -e "  ${GREEN}Applied $FIXED fix(es)${NC}"
    fi
    if [[ $ISSUES -gt 0 ]]; then
        echo -e "  ${YELLOW}$ISSUES issue(s) found${NC}"
        if [[ $mode == "check" ]]; then
            echo "  Run with --apply to fix"
        fi
        echo "========================================"
        exit 1
    else
        echo -e "  ${GREEN}All checks passed${NC}"
        echo "========================================"
        exit 0
    fi
}

main "$@"
