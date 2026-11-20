#!/bin/bash
# external/ag-shared/scripts/setup-worktree/claude-worktree-cleanup.test.sh
# Regression tests for the stale agent worktree cleanup in claude-worktree-create.sh and for
# claude-worktree-remove.sh. Run by hand: bash claude-worktree-cleanup.test.sh
# Takes about 70 seconds: ctime cannot be backdated, so the stale window is shortened to a minute and waited out.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CREATE="$SCRIPT_DIR/claude-worktree-create.sh"
REMOVE="$SCRIPT_DIR/claude-worktree-remove.sh"

T=$(mktemp -d)
PIDS=()
cleanup() {
    ((${#PIDS[@]})) && kill "${PIDS[@]}" 2>/dev/null
    chmod -R u+rwx "$T" 2>/dev/null
    rm -rf -- "$T"
}
trap cleanup EXIT

FAILED=0
pass() { echo "ok   $*"; }
fail() {
    echo "FAIL $*"
    FAILED=1
}
expect() {
    local name=$1
    shift
    if "$@"; then pass "$name"; else fail "$name"; fi
}

# Load the cleanup functions without running the hook.
eval "$(sed -n '/^# Agents run in parallel/,/^cleanup_stale_agent_worktrees$/p' "$CREATE" | sed '$d')"
STALE_AGENT_WORKTREE_MINUTES=1
LOG="$T/log"
log() { echo "$*" >>"$LOG"; }
# cleanup_locked finds the remover next to $0, which is this script.

CWD="$T/repo"
WORKTREE_ROOT="$T/wts"
REPO_NAME=repo
WT_PATH="$WORKTREE_ROOT/repo/agent-new"
WTS="$WORKTREE_ROOT/repo"

git init -q "$CWD"
printf 'node_modules\n' >"$CWD/.gitignore"
echo a >"$CWD/f"
git -C "$CWD" add -A
git -C "$CWD" -c user.name=t -c user.email=t@t commit -qm init
git -C "$CWD" config user.name t
git -C "$CWD" config user.email t@t

make_wt() {
    git -C "$CWD" worktree add -q "$WTS/$1" -b "$1" 2>/dev/null
    mkdir -p "$WTS/$1/node_modules/p"
    echo 1 >"$WTS/$1/node_modules/p/i.js"
}
set_owner() { echo "$2" >"$(git -C "$WTS/$1" rev-parse --absolute-git-dir)/$OWNER_FILE_NAME"; }
DEAD_PID=99999
while ps -o pid= -p "$DEAD_PID" >/dev/null 2>&1; do DEAD_PID=$((DEAD_PID + 1)); done

for n in stale live legacy chmod ignored openfile inuse dirty interrupted; do make_wt "agent-$n"; done
for n in stale chmod ignored openfile inuse dirty; do set_owner "agent-$n" "$DEAD_PID"; done
sleep 600 &
PIDS+=($!)
set_owner agent-live "$!"
mkdir -p "$WTS/agent-nogit/x"
echo 1 >"$WTS/agent-nogit/x/f"
echo changed >"$WTS/agent-dirty/f"
# An interrupted move: renamed on disk, git still registering the old path.
mv "$WTS/agent-interrupted" "$WTS/.removing-agent-interrupted"

sleep 70

chmod +x "$WTS/agent-chmod/f"
echo 2 >"$WTS/agent-ignored/node_modules/p/i.js"
touch -t 202001010000 "$WTS/agent-ignored/node_modules/p/i.js"
(
    cd "$WTS/agent-inuse/node_modules" && exec sleep 600
) &
PIDS+=($!)
(
    exec 3>>"$WTS/agent-openfile/node_modules/p/i.js"
    cd / && exec sleep 600
) &
PIDS+=($!)
# A pre-commit hook that rejects the remover's safety commit and records that it ran.
printf '#!/bin/sh\ntouch "%s/hook-ran"\nexit 1\n' "$T" >"$CWD/.git/hooks/pre-commit"
chmod +x "$CWD/.git/hooks/pre-commit"
sleep 1

# Unrelated processes starting or exiting on a busy machine make the listing unstable, which keeps every worktree.
# The scenarios pin the process-id check; the turnover test below exercises it.
real_user_pids=$(declare -f user_pids)
user_pids() { echo stable; }
cleanup_stale_agent_worktrees
eval "$real_user_pids"

gone() { [[ ! -e "$WTS/$1" ]]; }
kept() { [[ -e "$WTS/$1" ]]; }
registered() { git -C "$CWD" worktree list --porcelain | grep -qxF "worktree $(cd -P "$WTS/$1" && pwd)"; }
expect "stale worktree with an exited owner is removed" gone agent-stale
expect "removal leaves no hidden copy" gone .removing-agent-stale
expect "worktree whose owner runs is kept" kept agent-live
expect "worktree without an owner record is kept" kept agent-legacy
expect "leftover without .git is kept" kept agent-nogit
expect "chmod (ctime only) keeps the worktree" kept agent-chmod
expect "recent ignored file keeps the worktree" kept agent-ignored
expect "process cwd inside keeps the worktree" kept agent-inuse
expect "open file from a process elsewhere keeps the worktree" kept agent-openfile
expect "rejected safety commit reached the remover" test -e "$T/hook-ran"
expect "failed safety commit restores the worktree" registered agent-dirty
expect "interrupted move is recovered and registered" registered agent-interrupted
expect "lock is released after cleanup" bash -c "exec 9>>'$WTS/.cleanup.lock'; perl -MFcntl=:flock -e 'open(my \$fh, \">&=\", 9) or exit 1; flock(\$fh, LOCK_EX | LOCK_NB) or exit 1'"

# move_worktree refuses an occupied destination and leaves the worktree registered where it was.
mkdir "$WTS/.occupied"
if move_worktree "$WTS/agent-legacy" "$WTS/.occupied"; then fail "move to an occupied destination is refused"; else pass "move to an occupied destination is refused"; fi
expect "worktree stays put after a refused move" registered agent-legacy

rm -f "$CWD/.git/hooks/pre-commit"
remove() { jq -n --arg path "$1" '{worktree_path: $path}' | (cd / && bash "$REMOVE") 2>>"$LOG"; }

# The remover takes the hidden copy an interrupted cleanup left, after an incomplete move, when its record matches.
git -C "$CWD" worktree add -q "$WTS/agent-direct" -b agent-direct 2>/dev/null
DIRECT_GIT_DIR=$(git -C "$WTS/agent-direct" rev-parse --absolute-git-dir)
echo "$(cd -P "$WTS" && pwd)/agent-direct" >"$DIRECT_GIT_DIR/claude-moved-from"
mv "$WTS/agent-direct" "$WTS/.removing-agent-direct"
remove "$WTS/agent-direct"
expect "direct removal removes the matching hidden copy" gone .removing-agent-direct
expect "direct removal clears git's registration" test ! -d "$DIRECT_GIT_DIR"

# An unrelated checkout at the hidden name is left alone.
git clone -q "$CWD" "$WTS/.removing-agent-other"
remove "$WTS/agent-other"
expect "unrelated checkout at the hidden name is kept" kept .removing-agent-other

# The remover refuses a worktree whose git status cannot be read.
git -C "$CWD" worktree add -q "$WTS/agent-badindex" -b agent-badindex 2>/dev/null
echo garbage >"$(git -C "$WTS/agent-badindex" rev-parse --absolute-git-dir)/index"
if remove "$WTS/agent-badindex"; then fail "unreadable git status fails the remover"; else pass "unreadable git status fails the remover"; fi
expect "the failure is the status check" grep -q "Cannot read git status of $WTS/agent-badindex" "$LOG"
expect "unreadable git status blocks removal" kept agent-badindex

# A process started or exited during the listing makes it incomplete. Run from a separate process tree, since the
# hook's own descendants are left out of the check.
(while :; do /bin/sleep 0.05; done) </dev/null >/dev/null 2>&1 &
PIDS+=($!)
if bash -c "$(declare -f process_paths user_pids stable_process_paths); stable_process_paths >/dev/null"; then
    fail "process turnover makes the listing incomplete"
else
    pass "process turnover makes the listing incomplete"
fi

if ((FAILED)); then
    echo "--- log"
    cat "$LOG"
    exit 1
fi
echo "all passed"
