#!/usr/bin/env node
/* eslint-disable no-console */
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { ghaWarning } from '../../../../external/ag-shared/scripts/slack/_ci-notification-utils.mjs';
import { ticketKeyPrefix, ticketKeysIn } from '../../../../tools/jira/ticket-keys.mjs';
import { WORKSPACE_ROOT } from './seed-common.mjs';
import { findStalePorts } from './stale-ports.mjs';

/**
 * Files the JIRA work item that gets stale demo ports re-synced, from the demo-port-sync
 * workflow after a push to `latest` changed a React demo.
 *
 * 1. One sync issue is open at a time. Staleness is repository-wide (every push while a port is
 *    behind reports it again), so if any open "Sync demo ports" issue exists, whatever it is
 *    filed under, this comments on it with the new commit range and the current stale ports and
 *    files nothing. An issue already under way is not re-transitioned: a run may be in flight,
 *    and the agent reads repository state at the start of its next run anyway. An issue still in
 *    a To Do status is transitioned to In Progress as well, since that is what dispatches the
 *    agent and a previous run may have created it but failed to transition it.
 * 2. Otherwise derives the ticket the change belongs to from the pushed commit range: commit
 *    subjects filed under a key per git-conventions, then any key mentioned in a commit message
 *    (merge commits carry the branch name), then the merged PRs' branch names. A Sub-task
 *    resolves to its parent; an Epic gets a Task rather than a Sub-task. With no key at all, a
 *    Task is filed under the showcase epic AG-17737.
 * 3. Creates the issue there (component Charts, Track Housekeeping, label `ai-eligible`, an
 *    ADF description with the stale ports, the commit range, each port's PORTING.md, the
 *    re-stamp command and the parity gate as acceptance criteria) and transitions it to
 *    In Progress. That transition is what the JIRA automation rule listens for: it dispatches
 *    `jira-resume` into .github/workflows/jira-agent-pipeline.yml, whose preflight routes the
 *    ticket to the AI Workflow.
 *
 * Every JIRA call is REST v3 with the same bot credentials the staging-deploy comment uses
 * (JIRA_EMAIL / JIRA_API_TOKEN / JIRA_SITE_URL). `--dry-run` prints every request that would
 * be made, JIRA and GitHub alike, and makes none; reads then have no answer, so the run assumes
 * the derived key is a standard issue with no open sync issue and shows the create path.
 *
 * Environment: CURRENT_SHA (the pushed head), BEFORE_SHA (the previous head; empty or all zeros
 * on a first push), GITHUB_REPOSITORY, GITHUB_TOKEN (merged-PR lookup; optional), RUN_URL,
 * JIRA_SITE_URL, JIRA_EMAIL, JIRA_API_TOKEN (not needed for --dry-run).
 *
 * Usage: node tools/seeds/create-port-sync-subtask.mjs [--dry-run] [--stale-report <file>]
 *   --stale-report  A `check-seeds.mjs --stale` output to act on instead of computing it.
 */

/** The showcase epic that owns the demo seeds; the parent of last resort. */
export const FALLBACK_EPIC = 'AG-17737';
export const PROJECT_KEY = 'AG';
export const COMPONENT_NAME = 'Charts';
/** Track (customfield_10501) option id for Housekeeping, per the jira skill's Track table. */
export const TRACK_FIELD = 'customfield_10501';
export const TRACK_HOUSEKEEPING_ID = '10404';
/** The AI Workflow's eligibility label; the only label the jira skill permits. */
export const AI_ELIGIBLE_LABEL = 'ai-eligible';
/** The phrase the dedupe JQL keys on; every summary this script writes contains it. */
export const SUMMARY_MARKER = 'Sync demo ports';
export const IN_PROGRESS = 'In Progress';
/** The status category key JIRA gives every To Do-like status, whatever the workflow names it. */
export const TO_DO_CATEGORY = 'new';
/** The pushed paths that make a commit relevant to the derived ticket. */
export const DEMOS_SOURCE_PATH = 'packages/ag-charts-demos/src';
const SEEDS_PATH = 'packages/ag-charts-demos/seeds';
const SHORT_SHA_LENGTH = 8;

// ---------------------------------------------------------------- ticket derivation

/**
 * The ticket the pushed commits belong to.
 *
 * `commits` are the ones that changed the demo source; `rangeCommits` is the whole push, which
 * also holds the merge commits (path filtering drops those, and their subject is what carries a
 * PR's branch name). Commit subjects filed under a key (`AG-12345 Fix ...`) win, since that is
 * what git-conventions asks for; then any key mentioned in a demo commit's message; then any key
 * mentioned anywhere in the push; then the merged PRs' branch names. Within a tier the
 * most-referenced key wins, ties going to the earliest seen. Returns `{ key, source }` with
 * `key` null when nothing matched.
 */
export function deriveTicketKey({ commits = [], rangeCommits = commits, branchNames = [] }) {
    const mentions = (list) => list.flatMap((commit) => ticketKeysIn(`${commit.subject}\n${commit.body ?? ''}`));
    const tiers = [
        ['commit-prefix', commits.map((commit) => ticketKeyPrefix(commit.subject)).filter(Boolean)],
        ['commit-message', mentions(commits)],
        ['range-message', mentions(rangeCommits)],
        ['branch', branchNames.flatMap(branchTicketKeys)],
    ];
    for (const [source, keys] of tiers) {
        if (keys.length) return { key: mostReferenced(keys), source };
    }
    return { key: null, source: null };
}

/**
 * Ticket keys a branch name is filed under: `ghabot-ag-<key>-<slug>`, `ag-<key>/<slug>`,
 * `ag-<key>_ag-<key>/<slug>` and `<initials>/ag-<key>-<slug>`. A key buried later in a slug
 * (`at/fix-ag-1-regression`) is a mention, not a filing, and does not count.
 */
export function branchTicketKeys(branchName) {
    const keys = [];
    // `_` joins multiple keys but is a word character, so split on it before matching.
    for (const segment of String(branchName ?? '').split(/[/_]/)) {
        const filed = segment.replace(/^ghabot-/i, '');
        if (/^ag-\d+/i.test(filed)) keys.push(...ticketKeysIn(filed));
    }
    return keys;
}

function mostReferenced(keys) {
    const counts = new Map();
    for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1);
    let best = null;
    for (const [key, count] of counts) {
        if (best === null || count > counts.get(best)) best = key;
    }
    return best;
}

/**
 * The commits of the push, newest first, as `{ sha, subject, body }`: those that touched `paths`,
 * or every commit in the range when `paths` is empty (path filtering simplifies merge commits
 * away, so that is how the merges are seen). A first push or a force push has no usable
 * `before`, and a range whose start is not in the checkout cannot be walked either; both degrade
 * to the pushed head alone.
 */
export function readCommits({ before, sha, cwd = WORKSPACE_ROOT, paths = [DEMOS_SOURCE_PATH] }) {
    const format = '--format=%H%x1f%s%x1f%b%x1e';
    const parse = (output) =>
        output
            .split('\x1e')
            .map((record) => record.trim())
            .filter(Boolean)
            .map((record) => {
                const [commitSha, subject, body = ''] = record.split('\x1f');
                return { sha: commitSha, subject, body: body.trim() };
            });
    const gitLog = (args) =>
        execFileSync('git', ['log', format, ...args, ...(paths.length ? ['--', ...paths] : [])], {
            cwd,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        });

    if (before && !/^0+$/.test(before)) {
        try {
            return parse(gitLog([`${before}..${sha}`]));
        } catch (error) {
            ghaWarning(`Could not walk ${before}..${sha}; using the pushed commit only. ${error.message}`, {
                title: 'Port sync: commit range unavailable',
            });
        }
    }
    return parse(gitLog(['-1', sha]));
}

/**
 * Head branch names of the merged pull requests the commits belong to, via GitHub's
 * commit-to-PR association. Only consulted when no commit message names a ticket.
 */
export async function readMergedBranchNames(commits, github) {
    const names = new Set();
    for (const { sha } of commits) {
        const pulls = await github.request('GET', `/repos/${github.repository}/commits/${sha}/pulls`);
        for (const pull of pulls ?? []) {
            if (pull.merged_at && pull.head?.ref) names.add(pull.head.ref);
        }
    }
    return [...names];
}

// ---------------------------------------------------------------- JIRA decisions

/**
 * Where the sync issue goes. A Sub-task hangs off the derived ticket, or off its parent when the
 * derived ticket is itself a Sub-task. An Epic cannot own a Sub-task, so it gets a Task instead;
 * so does the showcase epic when no key was derivable, the derived issue does not exist, or the
 * parent is Done (a Sub-task under a closed parent never appears on the board).
 * Returns `{ issueType, parentKey, reason }`.
 */
export async function resolveTarget(jira, derivedKey) {
    const fallback = (reason) => ({ issueType: 'Task', parentKey: FALLBACK_EPIC, reason });
    if (!derivedKey) return fallback('no ticket key in the pushed commits');

    const getIssue = (key) => jira.request('GET', `/issue/${key}`, { query: { fields: 'issuetype,parent,status' } });
    let parentKey = derivedKey;
    let issue;
    try {
        issue = await getIssue(parentKey);
        if (issue?.fields?.issuetype?.subtask) {
            if (!issue.fields.parent?.key) throw new Error(`${derivedKey} is a Sub-task but has no parent`);
            parentKey = issue.fields.parent.key;
            issue = await getIssue(parentKey);
        }
    } catch (error) {
        if (error.status !== 404) throw error;
        return fallback(`${parentKey} does not exist in JIRA`);
    }
    if (!issue) {
        return { issueType: 'Sub-task', parentKey, reason: `dry run: assuming ${parentKey} is an open standard issue` };
    }

    const via = parentKey === derivedKey ? '' : ` (parent of Sub-task ${derivedKey})`;
    const { issuetype = {}, status } = issue.fields ?? {};
    if (/^epic$/i.test(issuetype.name ?? '')) {
        return { issueType: 'Task', parentKey, reason: `${parentKey} is an Epic, which cannot own a Sub-task${via}` };
    }
    if (status?.statusCategory?.key === 'done') {
        return fallback(`parent ${parentKey} is Done${via}`);
    }
    const state = status?.name ? ` (${status.name})` : '';
    return { issueType: 'Sub-task', parentKey, reason: `${parentKey} is a ${issuetype.name}${state}${via}` };
}

/**
 * Every open sync issue in the project, oldest first. Not scoped to a parent or a component: the
 * stale ports are the same whichever ticket a push derives, so one open issue covers them all,
 * including one a person filed by hand. Built only from
 * this module's constants; nothing from a commit or the environment reaches it.
 */
export function syncIssueJql() {
    return `project = ${PROJECT_KEY} AND summary ~ "${SUMMARY_MARKER}" AND statusCategory != Done ORDER BY created ASC`;
}

/**
 * The oldest open sync issue, or null. `~` is a word search, so a match must also carry the
 * marker phrase verbatim in its summary. Null in a dry run too: nothing was asked.
 */
export async function findOpenSyncIssue(jira) {
    const result = await jira.request('GET', '/search/jql', {
        query: { jql: syncIssueJql(), fields: 'summary,status', maxResults: '50' },
    });
    return (result?.issues ?? []).find((issue) => issue.fields?.summary?.includes(SUMMARY_MARKER)) ?? null;
}

/**
 * Moves `key` through the transition named `name`, looked up on the issue at the time rather
 * than hard-coded: transition ids differ between workflows and change when a workflow is edited.
 */
export async function transitionTo(jira, key, name) {
    const result = await jira.request('GET', `/issue/${key}/transitions`);
    let id = `<id of "${name}">`;
    if (result) {
        const wanted = name.toLowerCase();
        const transition = (result.transitions ?? []).find(
            (candidate) => candidate.name?.toLowerCase() === wanted || candidate.to?.name?.toLowerCase() === wanted
        );
        if (!transition) {
            const names = (result.transitions ?? []).map((candidate) => candidate.name).join(', ') || 'none';
            throw new Error(`${key} has no "${name}" transition; available: ${names}`);
        }
        id = transition.id;
    }
    await jira.request('POST', `/issue/${key}/transitions`, { body: { transition: { id } } });
    return id;
}

// ---------------------------------------------------------------- content

export function buildSummary(stale, shortSha) {
    const demos = [...new Set(stale.map((port) => port.demo))];
    return `[Charts] ${SUMMARY_MARKER}: ${demos.join(', ')} to ${shortSha}`;
}

/** The create-issue `fields`, per the jira skill's Sub-task conventions for project AG / Charts. */
export function buildCreateFields({ issueType, parentKey, summary, description }) {
    return {
        project: { key: PROJECT_KEY },
        issuetype: { name: issueType },
        parent: { key: parentKey },
        summary,
        description,
        components: [{ name: COMPONENT_NAME }],
        [TRACK_FIELD]: [{ id: TRACK_HOUSEKEEPING_ID }],
        labels: [AI_ELIGIBLE_LABEL],
    };
}

const text = (value) => ({ type: 'text', text: value });
const code = (value) => ({ type: 'text', text: value, marks: [{ type: 'code' }] });
const link = (value, href) => ({ type: 'text', text: value, marks: [{ type: 'link', attrs: { href } }] });
const paragraph = (...content) => ({ type: 'paragraph', content });
const heading = (value) => ({ type: 'heading', attrs: { level: 1 }, content: [text(value)] });
const listItem = (...content) => ({ type: 'listItem', content });
const bulletList = (items) => ({ type: 'bulletList', content: items });
const orderedList = (items) => ({ type: 'orderedList', attrs: { order: 1 }, content: items });
const codeBlock = (value) => ({ type: 'codeBlock', attrs: { language: 'sh' }, content: [text(value)] });
const doc = (...content) => ({ type: 'doc', version: 1, content });

const short = (sha) => (sha ? sha.slice(0, SHORT_SHA_LENGTH) : 'unknown');
const portingPath = ({ demo, framework }) => `${SEEDS_PATH}/${demo}/${framework}.PORTING.md`;
const stampCommand = ({ demo, framework }) =>
    `node packages/ag-charts-demos/tools/seeds/stamp-port-manifest.mjs ${demo} ${framework}`;

const commitItems = (commits) =>
    bulletList(commits.map((commit) => listItem(paragraph(text(`${short(commit.sha)} ${commit.subject}`)))));

function stalePortItems(stale) {
    return stale.map((port) =>
        listItem(
            paragraph(
                code(`${port.demo}/${port.framework}`),
                text(
                    ` last synced to ${short(port.manifestCommit)}; the source is now at ${short(port.sourceCommit)}. Follow `
                ),
                code(portingPath(port)),
                text('.')
            )
        )
    );
}

/**
 * The Sub-task body, in the jira skill's Sub-task shape: a Brief, the ports and what to follow,
 * the commit range, the re-stamp command, and the parity gate as the acceptance criteria.
 */
export function buildDescription({ stale, commits, compareUrl, shortSha, runUrl }) {
    return doc(
        heading('Brief'),
        paragraph(
            text('The React demo source under '),
            code(DEMOS_SOURCE_PATH),
            text(
                ` changed in ${shortSha} and these framework ports no longer match it. Port the change following each port's PORTING.md, keeping the shared CSS and class names so the pixel comparison holds, then re-stamp the manifest so the staleness report clears.`
            )
        ),
        bulletList(stalePortItems(stale)),
        paragraph(text('Source commit range: '), link(compareUrl, compareUrl)),
        commitItems(commits),
        paragraph(text('Once a port is in step, record it (and commit the manifest with the port):')),
        codeBlock(stale.map(stampCommand).join('\n')),
        heading('Acceptance Criteria'),
        orderedList([
            listItem(
                paragraph(
                    code('node packages/ag-charts-demos/tools/seeds/check-seeds.mjs --stale'),
                    text(' reports no stale port.')
                )
            ),
            listItem(
                paragraph(
                    text('The parity gate '),
                    code('yarn nx test:e2e:parity ag-charts-demos'),
                    text(' is green with each port above served and discovered from its '),
                    code('.seed-manifest.json'),
                    text('; the run leaves '),
                    code('e2e/parity/results/summary.json'),
                    text(' with every comparison passed.')
                )
            ),
            listItem(
                paragraph(
                    text('The functional specs pass against each port: '),
                    code('DEMOS_BASE_URL=<port URL> npx playwright test'),
                    text(' in '),
                    code('packages/ag-charts-demos'),
                    text('.')
                )
            ),
        ]),
        paragraph(text('Filed automatically by the demo-port-sync workflow: '), link('CI run', runUrl))
    );
}

/**
 * The comment left on the open sync issue when the source moves again: the new commit range and
 * the full current stale list, which supersedes the one in the description. `restarting` says
 * whether this run also moves the issue to In Progress.
 */
export function buildCommentBody({ stale, commits = [], compareUrl, shortSha, runUrl, restarting = false }) {
    return doc(
        paragraph(text(`The React demo source moved again, to ${shortSha}. These ports are stale now:`)),
        bulletList(stalePortItems(stale)),
        paragraph(text('New source commit range: '), link(compareUrl, compareUrl)),
        ...(commits.length ? [commitItems(commits)] : []),
        paragraph(
            text(
                restarting
                    ? `Moved to ${IN_PROGRESS}: the issue had not started, so this dispatches the AI Workflow. `
                    : 'Not re-transitioned: it is already under way, a run may be in flight, and the agent reads the repository at the start of its next run. '
            ),
            link('CI run', runUrl)
        )
    );
}

// ---------------------------------------------------------------- clients

/**
 * A minimal REST client. `request(method, path, { query, body })` resolves `path` under `baseUrl`
 * and returns the parsed JSON (null for 204). In a dry run it logs the request instead and
 * returns null, so callers treat null as "unknown".
 *
 * `path` is appended to `baseUrl` even when written with a leading slash: plain URL resolution
 * would take `/issue` back to the origin and drop a base path such as JIRA's `/rest/api/3/`.
 */
export function createRestClient({ baseUrl, headers, dryRun = false, log = console.log, fetchImpl = fetch, label }) {
    const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    return {
        async request(method, path, { query, body } = {}) {
            const url = new URL(path.replace(/^\/+/, ''), base);
            for (const [name, value] of Object.entries(query ?? {})) url.searchParams.set(name, value);
            if (dryRun) {
                const rendered = body === undefined ? '' : `\n${JSON.stringify(body, null, 2)}`;
                log(`[dry-run] ${label} ${method} ${url.pathname}${url.search}${rendered}`);
                return null;
            }
            const response = await fetchImpl(url, {
                method,
                headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...headers() },
                body: body === undefined ? undefined : JSON.stringify(body),
            });
            if (!response.ok) {
                const error = new Error(
                    `${label} ${method} ${url.pathname} -> ${response.status} ${await response.text()}`
                );
                error.status = response.status;
                throw error;
            }
            return response.status === 204 ? null : response.json();
        },
    };
}

export function createJiraClient({ siteUrl, email, apiToken, dryRun, log, fetchImpl }) {
    return createRestClient({
        label: 'JIRA',
        baseUrl: new URL('/rest/api/3/', siteUrl).toString(),
        dryRun,
        log,
        fetchImpl,
        headers: () => {
            if (!email || !apiToken) throw new Error('JIRA_EMAIL and JIRA_API_TOKEN are required outside --dry-run');
            return { Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}` };
        },
    });
}

export function createGithubClient({ repository, token, dryRun, log, fetchImpl }) {
    const client = createRestClient({
        label: 'GitHub',
        baseUrl: 'https://api.github.com',
        dryRun,
        log,
        fetchImpl,
        headers: () => ({
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
        }),
    });
    return { ...client, repository };
}

// ---------------------------------------------------------------- orchestration

/**
 * Runs the whole decision for one push. Returns `{ action: 'none' }`, `{ action: 'commented',
 * key, transitioned }` or `{ action: 'created', key, parentKey, issueType, derived }`, and logs
 * each step through `log`.
 */
export async function run({
    stale,
    before,
    sha,
    commits,
    rangeCommits = commits,
    jira,
    github,
    repositoryUrl,
    runUrl,
    log = console.log,
}) {
    if (stale.length === 0) {
        log('No stale demo ports; nothing to file.');
        return { action: 'none' };
    }
    const shortSha = short(sha);
    const compareUrl =
        before && !/^0+$/.test(before)
            ? `${repositoryUrl}/compare/${before}...${sha}`
            : `${repositoryUrl}/commit/${sha}`;
    log(`Stale ports: ${stale.map((port) => `${port.demo}/${port.framework}`).join(', ')}`);
    log(`Commits in the push: ${rangeCommits.length}, touching ${DEMOS_SOURCE_PATH}: ${commits.length}`);

    const existing = await findOpenSyncIssue(jira);
    if (existing) {
        const status = existing.fields?.status;
        const restarting = status?.statusCategory?.key === TO_DO_CATEGORY;
        log(
            `${existing.key} is already open (${status?.name ?? 'status unknown'}); commenting${restarting ? ` and moving it to ${IN_PROGRESS}` : ''}.`
        );
        const body = buildCommentBody({ stale, commits, compareUrl, shortSha, runUrl, restarting });
        await jira.request('POST', `/issue/${existing.key}/comment`, { body: { body } });
        if (restarting) {
            const transitionId = await transitionTo(jira, existing.key, IN_PROGRESS);
            log(`Transitioned ${existing.key} to ${IN_PROGRESS} (transition ${transitionId}).`);
        }
        return { action: 'commented', key: existing.key, transitioned: restarting };
    }

    let derived = deriveTicketKey({ commits, rangeCommits });
    if (!derived.key && github) {
        const branchNames = await readMergedBranchNames(commits, github);
        derived = deriveTicketKey({ commits, rangeCommits, branchNames });
    }
    log(derived.key ? `Derived ${derived.key} from ${derived.source}.` : 'No ticket key derivable.');

    const target = await resolveTarget(jira, derived.key);
    log(`Target: ${target.issueType} under ${target.parentKey} (${target.reason}).`);

    const summary = buildSummary(stale, shortSha);
    const description = buildDescription({ stale, commits, compareUrl, shortSha, runUrl });
    const fields = buildCreateFields({ ...target, summary, description });
    const created = await jira.request('POST', '/issue', { body: { fields } });
    const key = created?.key ?? 'AG-XXXXX';
    log(`Created ${key}: ${summary}`);

    const transitionId = await transitionTo(jira, key, IN_PROGRESS);
    log(`Transitioned ${key} to ${IN_PROGRESS} (transition ${transitionId}); jira-agent-pipeline.yml picks it up.`);
    return { action: 'created', key, ...target, derived };
}

function parseArgs(argv) {
    const options = { dryRun: false, staleReport: null };
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === '--dry-run') options.dryRun = true;
        else if (argv[i] === '--stale-report') {
            options.staleReport = argv[++i];
            if (!options.staleReport) throw new Error('--stale-report requires a file');
        } else throw new Error(`Unknown argument ${argv[i]}`);
    }
    return options;
}

function writeOutputs(result) {
    if (!process.env.GITHUB_OUTPUT) return;
    appendFileSync(process.env.GITHUB_OUTPUT, `action=${result.action}\nissue_key=${result.key ?? ''}\n`);
}

async function main(argv) {
    const { dryRun, staleReport } = parseArgs(argv);
    const {
        CURRENT_SHA,
        BEFORE_SHA,
        GITHUB_REPOSITORY = 'ag-grid/ag-charts',
        GITHUB_TOKEN,
        RUN_URL,
        JIRA_SITE_URL = dryRun ? 'https://ag-grid.atlassian.net' : undefined,
        JIRA_EMAIL,
        JIRA_API_TOKEN,
    } = process.env;
    for (const [name, value] of Object.entries({ CURRENT_SHA, RUN_URL, JIRA_SITE_URL })) {
        if (!value) throw new Error(`${name} environment variable is not set`);
    }

    const stale = staleReport ? JSON.parse(readFileSync(staleReport, 'utf8')).stale : findStalePorts();
    const commits = stale.length ? readCommits({ before: BEFORE_SHA, sha: CURRENT_SHA }) : [];
    const rangeCommits = stale.length ? readCommits({ before: BEFORE_SHA, sha: CURRENT_SHA, paths: [] }) : [];
    const jira = createJiraClient({ siteUrl: JIRA_SITE_URL, email: JIRA_EMAIL, apiToken: JIRA_API_TOKEN, dryRun });
    const github =
        GITHUB_TOKEN || dryRun
            ? createGithubClient({ repository: GITHUB_REPOSITORY, token: GITHUB_TOKEN, dryRun })
            : null;
    if (!github) {
        ghaWarning('GITHUB_TOKEN is not set; merged PR branch names are not consulted.', { title: 'Port sync' });
    }

    const result = await run({
        stale,
        before: BEFORE_SHA,
        sha: CURRENT_SHA,
        commits,
        rangeCommits,
        jira,
        github,
        repositoryUrl: `https://github.com/${GITHUB_REPOSITORY}`,
        runUrl: RUN_URL,
    });
    writeOutputs(result);
    console.log(JSON.stringify(result));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main(process.argv.slice(2)).catch((error) => {
        console.error(`create-port-sync-subtask: ${error.message}`);
        process.exit(1);
    });
}
