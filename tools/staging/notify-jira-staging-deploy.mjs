// Comments on the JIRA tickets referenced by the commits in a staging deploy, so the
// ticket itself says "this is live on staging, verify it here" without anyone having to
// reconstruct the staging link by hand.
//
// Runs from the `report` job of ci.yml immediately after a successful staging deploy.
// Never fails the build: a JIRA outage or a permissions problem must not turn a
// successful deploy red, so every API failure is reported as a GHA warning and the
// process still exits 0.
//
// The deployed commit range comes from GitHub's compare API rather than local git. The
// `report` job checks out with `fetch-depth: 1`, so the last successful commit is usually
// not a reachable object and any local `git log` range would fail outright. Comparing
// server-side needs no history at all, and reports the truncation and divergence cases
// explicitly instead of leaving them to be inferred from a git error.
import { getStagingUrl, ghaError, ghaWarning } from '../../external/ag-shared/scripts/slack/_ci-notification-utils.mjs';

const {
    JIRA_EMAIL,
    JIRA_API_TOKEN,
    JIRA_SITE_URL,
    AG_PROJECT,
    CURRENT_SHA,
    LAST_SUCCESSFUL_SHA,
    RUN_ID,
    RUN_URL,
    GITHUB_REPOSITORY,
    GITHUB_TOKEN,
    DRY_RUN,
} = process.env;

// Only AG keys are matched. Case-insensitively on purpose: branch names in merge-commit
// subjects use lowercase (`imoses/ag-17999`, `ghabot-ag-17992-...`), and a case-sensitive
// pattern silently drops those commits.
const TICKET_PATTERN = /\bAG-(\d+)\b/gi;

const dryRun = DRY_RUN === 'true';
// A dry run is expected to work without credentials, so that the commit range and the
// rendered comment can be checked locally. Without them no JIRA call can be made at all.
const canQueryJira = Boolean(JIRA_EMAIL && JIRA_API_TOKEN);

// RUN_URL is required even though it only decorates a link: an ADF link mark with an
// undefined href serialises to an empty `attrs`, which JIRA rejects outright, so a missing
// value fails every comment rather than degrading one of them.
const required = { JIRA_SITE_URL, AG_PROJECT, CURRENT_SHA, RUN_ID, RUN_URL, GITHUB_REPOSITORY, GITHUB_TOKEN };
if (!dryRun) {
    Object.assign(required, { JIRA_EMAIL, JIRA_API_TOKEN });
}
for (const [name, value] of Object.entries(required)) {
    if (!value) {
        ghaError(`${name} environment variable is not set.`, { title: 'JIRA deploy comment: missing config' });
        process.exit(1);
    }
}

const githubApi = async (path) => {
    const response = await fetch(new URL(path, 'https://api.github.com'), {
        headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
        },
    });
    if (!response.ok) {
        throw new Error(`GET ${path} -> ${response.status} ${await response.text()}`);
    }
    return response.json();
};

const toCommit = ({ sha, commit }) => ({ shortSha: sha.slice(0, 8), subject: commit.message.split('\n')[0] });

/** The deployed commit on its own — the fallback whenever a range cannot be established. */
async function getDeployedCommit() {
    return [toCommit(await githubApi(`/repos/${GITHUB_REPOSITORY}/commits/${CURRENT_SHA}`))];
}

/**
 * The commits this deploy actually shipped, as `{ shortSha, subject }`.
 *
 * Uses GitHub's compare API so no local history is needed. `status` distinguishes the cases
 * that matter: `identical` means this is a re-deploy of the same commit, and anything else
 * yields the commits reachable from the deployed commit but not from the last successful
 * one. A first build, a deleted commit, or an unrelated last-successful SHA surfaces as an
 * error and degrades to the deployed commit alone.
 */
async function getDeployedCommits() {
    if (!LAST_SUCCESSFUL_SHA || LAST_SUCCESSFUL_SHA === CURRENT_SHA) {
        return getDeployedCommit();
    }

    try {
        const comparison = await githubApi(
            `/repos/${GITHUB_REPOSITORY}/compare/${LAST_SUCCESSFUL_SHA}...${CURRENT_SHA}`
        );
        if (comparison.status === 'identical' || comparison.commits.length === 0) {
            return getDeployedCommit();
        }
        // The compare API caps `commits` at 250 while still reporting the true total, so an
        // unusually large deploy would silently miss the oldest tickets without this.
        if (comparison.total_commits > comparison.commits.length) {
            ghaWarning(
                `Deploy spans ${comparison.total_commits} commits; the compare API returned only ${comparison.commits.length}, so the oldest tickets are not covered.`,
                { title: 'JIRA deploy comment: range truncated' }
            );
        }
        return comparison.commits.map(toCommit);
    } catch (error) {
        ghaWarning(
            `Could not compare ${LAST_SUCCESSFUL_SHA}..${CURRENT_SHA}; using the deployed commit only. ${error.message}`,
            {
                title: 'JIRA deploy comment: range unavailable',
            }
        );
        return getDeployedCommit();
    }
}

/** Groups the deployed commits by the AG ticket key(s) their subject references. */
function groupCommitsByTicket(commits) {
    const byTicket = new Map();
    for (const commit of commits) {
        for (const [, number] of commit.subject.matchAll(TICKET_PATTERN)) {
            const key = `AG-${number}`;
            if (!byTicket.has(key)) byTicket.set(key, []);
            byTicket.get(key).push(commit);
        }
    }
    return byTicket;
}

const jiraApi = async (path, init = {}) => {
    const response = await fetch(new URL(`/rest/api/3${path}`, JIRA_SITE_URL), {
        ...init,
        headers: {
            Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...init.headers,
        },
    });
    if (!response.ok) {
        throw new Error(`${init.method ?? 'GET'} ${path} -> ${response.status} ${await response.text()}`);
    }
    return response.status === 204 ? undefined : response.json();
};

/**
 * Whether the ticket should be left alone. Commits routinely reference long-closed
 * tickets (chores citing an old key), and a deploy note on those is pure noise.
 */
async function isResolved(key) {
    const { fields } = await jiraApi(`/issue/${key}?fields=resolution,status`);
    return fields.resolution != null || fields.status?.statusCategory?.key === 'done';
}

const paragraph = (...content) => ({ type: 'paragraph', content });
const text = (value) => ({ type: 'text', text: value });
const link = (value, href) => ({ type: 'text', text: value, marks: [{ type: 'link', attrs: { href } }] });

function buildComment(commits, stagingUrl) {
    return {
        type: 'doc',
        version: 1,
        content: [
            paragraph(text('Deployed to staging for verification.')),
            {
                type: 'bulletList',
                content: commits.map(({ shortSha, subject }) => ({
                    type: 'listItem',
                    content: [paragraph(text(`${shortSha} ${subject}`))],
                })),
            },
            paragraph(text('Verify at: '), link(stagingUrl, stagingUrl)),
            paragraph(
                text('Deployed build: '),
                link(
                    new URL('/debug/meta.json', stagingUrl).toString(),
                    new URL('/debug/meta.json', stagingUrl).toString()
                ),
                text(' · CI run: '),
                link(`#${RUN_ID}`, RUN_URL)
            ),
        ],
    };
}

(async () => {
    const commits = await getDeployedCommits();
    const byTicket = groupCommitsByTicket(commits);

    if (byTicket.size === 0) {
        console.log(`No AG tickets referenced by the ${commits.length} deployed commit(s); nothing to comment on.`);
        return;
    }

    const stagingUrl = getStagingUrl(AG_PROJECT);
    console.log(`Deployed commits: ${commits.length}. Referenced tickets: ${[...byTicket.keys()].join(', ')}`);

    for (const [key, ticketCommits] of byTicket) {
        try {
            if (canQueryJira && (await isResolved(key))) {
                console.log(`${key}: already resolved, skipping.`);
                continue;
            }

            const body = buildComment(ticketCommits, stagingUrl);
            if (dryRun) {
                console.log(`${key}: would comment ->\n${JSON.stringify(body, null, 2)}`);
                continue;
            }

            await jiraApi(`/issue/${key}/comment`, { method: 'POST', body: JSON.stringify({ body }) });
            console.log(`${key}: commented.`);
        } catch (error) {
            // One bad ticket (deleted, moved project, no permission) must not stop the rest.
            ghaWarning(`${key}: could not add staging deploy comment. ${error.message}`, {
                title: 'JIRA deploy comment failed',
            });
        }
    }
})();
