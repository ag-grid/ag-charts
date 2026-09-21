/**
 * JIRA ticket keys as they appear in git: commit subjects (`AG-12345 Fix ...`), merge-commit
 * subjects that embed a branch name (`Merge pull request #1 from ag-grid/imoses/ag-17999`) and
 * agent or human branch names (`ghabot-ag-17992-...`, `ag-12345/fix-tooltip-flicker`).
 *
 * Shared by the staging-deploy JIRA comment and the demo port-sync automation so both agree on
 * what counts as a ticket reference.
 */

// Only AG keys are matched. Case-insensitively on purpose: branch names in merge-commit
// subjects use lowercase (`imoses/ag-17999`, `ghabot-ag-17992-...`), and a case-sensitive
// pattern silently drops those commits.
export const TICKET_PATTERN = /\bAG-(\d+)\b/gi;

/** Every AG ticket key referenced in `text`, upper-cased, first occurrence first, no repeats. */
export function ticketKeysIn(text) {
    const keys = [];
    for (const [, number] of String(text ?? '').matchAll(TICKET_PATTERN)) {
        const key = `AG-${number}`;
        if (!keys.includes(key)) keys.push(key);
    }
    return keys;
}

/**
 * The key a commit subject is filed under per git-conventions: `AG-12345 <description>` or
 * `AG-12345: <description>`. Null when the subject does not start with a key.
 */
export function ticketKeyPrefix(subject) {
    const match = /^\s*AG-(\d+)\b/i.exec(subject ?? '');
    return match ? `AG-${match[1]}` : null;
}
