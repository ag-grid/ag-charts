import { describe, expect, it } from 'vitest';

import {
    AI_ELIGIBLE_LABEL,
    FALLBACK_EPIC,
    TRACK_FIELD,
    TRACK_HOUSEKEEPING_ID,
    branchTicketKeys,
    buildCreateFields,
    buildSummary,
    deriveTicketKey,
    findOpenSyncIssue,
    resolveTarget,
    run,
    syncIssueJql,
    transitionTo,
} from './create-port-sync-subtask.mjs';

const stale = [
    {
        demo: 'financial',
        framework: 'angular',
        sourceHash: 'sha256-new',
        manifestHash: 'sha256-old',
        sourceCommit: 'dd007184322164613f1db20c69ceb776ae0ca613',
        manifestCommit: 'ec7212e3681d17596689a5c00f77863ba5e0f2a1',
    },
    {
        demo: 'financial',
        framework: 'vue',
        sourceHash: 'sha256-new',
        manifestHash: null,
        sourceCommit: 'dd007184322164613f1db20c69ceb776ae0ca613',
        manifestCommit: null,
    },
];

const commit = (subject, body = '') => ({ sha: 'abcdef0123456789', subject, body });

/**
 * A JIRA client that answers from `responses` (keyed `METHOD path`) and records every call.
 * An unmatched request resolves to null, which is how the real client reports a dry run.
 */
function fakeJira(responses = {}) {
    const calls = [];
    return {
        calls,
        async request(method, path, { query, body } = {}) {
            calls.push({ method, path, query, body });
            const answer = responses[`${method} ${path}`];
            if (answer instanceof Error) throw answer;
            return typeof answer === 'function' ? answer({ query, body }) : (answer ?? null);
        },
    };
}

function notFound() {
    const error = new Error('404');
    error.status = 404;
    return error;
}

describe('deriveTicketKey', () => {
    it('prefers the key a commit subject is filed under', () => {
        const commits = [
            commit('AG-18147 Add a deterministic mode'),
            commit('Merge pull request #1 from ag-grid/imoses/ag-17999'),
        ];
        expect(deriveTicketKey({ commits })).toEqual({ key: 'AG-18147', source: 'commit-prefix' });
    });

    it('accepts the colon form and normalises the case of the key', () => {
        expect(deriveTicketKey({ commits: [commit('ag-123: fix it')] })).toEqual({
            key: 'AG-123',
            source: 'commit-prefix',
        });
    });

    it('falls back to a key mentioned anywhere in a commit message, including a merge subject', () => {
        const commits = [
            commit('Merge pull request #8209 from ag-grid/imoses/ag-18504-background-regions'),
            commit('Tidy imports', 'Follow-up to AG-18504.'),
        ];
        expect(deriveTicketKey({ commits })).toEqual({ key: 'AG-18504', source: 'commit-message' });
    });

    it('picks the most-referenced key within a tier, earliest seen on a tie', () => {
        const commits = [commit('AG-1 first'), commit('AG-2 second'), commit('AG-2 third')];
        expect(deriveTicketKey({ commits }).key).toBe('AG-2');
        expect(deriveTicketKey({ commits: [commit('AG-1 a'), commit('AG-2 b')] }).key).toBe('AG-1');
    });

    it('reads a merge commit elsewhere in the push before asking GitHub for branch names', () => {
        const commits = [commit('Restyle the traffic chart marker')];
        const rangeCommits = [
            commit('Merge pull request #8216 from ag-grid/ghabot-ag-18574-charts-number-axis-expands-its'),
            ...commits,
        ];
        expect(deriveTicketKey({ commits, rangeCommits, branchNames: ['ag-1/other'] })).toEqual({
            key: 'AG-18574',
            source: 'range-message',
        });
    });

    it('falls back to merged branch names when no commit names a ticket', () => {
        const commits = [commit('Restyle the traffic chart marker')];
        expect(deriveTicketKey({ commits, branchNames: ['ghabot-ag-18574-charts-number-axis'] })).toEqual({
            key: 'AG-18574',
            source: 'branch',
        });
        expect(deriveTicketKey({ commits, branchNames: ['ag-12345/fix-tooltip-flicker'] }).key).toBe('AG-12345');
    });

    it('derives nothing from an unlinked push', () => {
        expect(
            deriveTicketKey({ commits: [commit('Fix typo')], branchNames: ['at/improve-watch-reload-time'] })
        ).toEqual({ key: null, source: null });
    });
});

describe('branchTicketKeys', () => {
    it.each([
        ['ghabot-ag-18574-charts-number-axis-expands-its', ['AG-18574']],
        ['ag-12345/fix-tooltip-flicker', ['AG-12345']],
        ['AG-12345/fix-tooltip-flicker', ['AG-12345']],
        ['CRT-1030_AG-1044/fix-highlight', ['AG-1044']],
        ['ag-1030_ag-1044/fix-highlight', ['AG-1030', 'AG-1044']],
        ['imoses/ag-18504-background-regions', ['AG-18504']],
        ['at/improve-watch-reload-time', []],
        ['at/fix-ag-1-regression', []],
        ['latest', []],
    ])('%s -> %j', (name, expected) => {
        expect(branchTicketKeys(name)).toEqual(expected);
    });
});

describe('resolveTarget', () => {
    it('files under the showcase epic as a Task when no key was derived', async () => {
        const jira = fakeJira();
        await expect(resolveTarget(jira, null)).resolves.toMatchObject({ issueType: 'Task', parentKey: FALLBACK_EPIC });
        expect(jira.calls).toEqual([]);
    });

    it('uses a standard issue as the parent of a Sub-task', async () => {
        const jira = fakeJira({
            'GET /issue/AG-18147': {
                fields: { issuetype: { name: 'Task', subtask: false }, status: { name: 'In Progress' } },
            },
        });
        await expect(resolveTarget(jira, 'AG-18147')).resolves.toEqual({
            issueType: 'Sub-task',
            parentKey: 'AG-18147',
            reason: 'AG-18147 is a Task (In Progress)',
        });
        expect(jira.calls[0].query).toEqual({ fields: 'issuetype,parent,status' });
    });

    it('climbs from a Sub-task to its parent', async () => {
        const jira = fakeJira({
            'GET /issue/AG-18200': {
                fields: { issuetype: { name: 'Sub-task', subtask: true }, parent: { key: 'AG-18147' } },
            },
        });
        await expect(resolveTarget(jira, 'AG-18200')).resolves.toMatchObject({
            issueType: 'Sub-task',
            parentKey: 'AG-18147',
        });
    });

    it('files a Task under an Epic, which cannot own a Sub-task', async () => {
        const jira = fakeJira({ 'GET /issue/AG-17737': { fields: { issuetype: { name: 'Epic', subtask: false } } } });
        await expect(resolveTarget(jira, 'AG-17737')).resolves.toMatchObject({
            issueType: 'Task',
            parentKey: 'AG-17737',
        });
    });

    it('falls back to the showcase epic when the derived issue does not exist', async () => {
        const jira = fakeJira({ 'GET /issue/AG-99999': notFound() });
        await expect(resolveTarget(jira, 'AG-99999')).resolves.toMatchObject({
            issueType: 'Task',
            parentKey: FALLBACK_EPIC,
        });
    });

    it('propagates any other JIRA failure', async () => {
        const error = new Error('401');
        error.status = 401;
        await expect(resolveTarget(fakeJira({ 'GET /issue/AG-1': error }), 'AG-1')).rejects.toBe(error);
    });

    it('assumes a standard issue in a dry run, when the read has no answer', async () => {
        await expect(resolveTarget(fakeJira(), 'AG-18147')).resolves.toMatchObject({
            issueType: 'Sub-task',
            parentKey: 'AG-18147',
        });
    });
});

describe('findOpenSyncIssue', () => {
    it('searches with the dedupe JQL and returns the first open match', async () => {
        const jira = fakeJira({
            'GET /search/jql': {
                issues: [{ key: 'AG-18300', fields: { summary: 'Charts Sync demo ports: financial to 1234' } }],
            },
        });
        await expect(findOpenSyncIssue(jira, 'AG-18147')).resolves.toMatchObject({ key: 'AG-18300' });
        expect(jira.calls[0].query.jql).toBe(
            'parent = AG-18147 AND summary ~ "Sync demo ports" AND statusCategory != Done'
        );
        expect(syncIssueJql(FALLBACK_EPIC)).toBe(
            'parent = AG-17737 AND summary ~ "Sync demo ports" AND statusCategory != Done'
        );
    });

    it('returns null when nothing is open, or when nothing was asked', async () => {
        await expect(findOpenSyncIssue(fakeJira({ 'GET /search/jql': { issues: [] } }), 'AG-1')).resolves.toBeNull();
        await expect(findOpenSyncIssue(fakeJira(), 'AG-1')).resolves.toBeNull();
    });
});

describe('transitionTo', () => {
    it('looks the transition id up by name at run time', async () => {
        const jira = fakeJira({
            'GET /issue/AG-18300/transitions': {
                transitions: [
                    { id: '11', name: 'To Do', to: { name: 'To Do' } },
                    { id: '21', name: 'Start progress', to: { name: 'In Progress' } },
                ],
            },
        });
        await expect(transitionTo(jira, 'AG-18300', 'In Progress')).resolves.toBe('21');
        expect(jira.calls[1]).toMatchObject({
            method: 'POST',
            path: '/issue/AG-18300/transitions',
            body: { transition: { id: '21' } },
        });
    });

    it('fails loudly when the issue has no such transition', async () => {
        const jira = fakeJira({ 'GET /issue/AG-1/transitions': { transitions: [{ id: '31', name: 'Done' }] } });
        await expect(transitionTo(jira, 'AG-1', 'In Progress')).rejects.toThrow(
            'AG-1 has no "In Progress" transition; available: Done'
        );
        expect(jira.calls).toHaveLength(1);
    });
});

describe('payloads', () => {
    it('names every stale demo once in the summary', () => {
        expect(buildSummary(stale, 'e4340dd5')).toBe('Charts Sync demo ports: financial to e4340dd5');
        expect(buildSummary([...stale, { ...stale[0], demo: 'procurement' }], 'e4340dd5')).toBe(
            'Charts Sync demo ports: financial, procurement to e4340dd5'
        );
    });

    it('builds the create fields the jira skill documents for an AG Charts Sub-task', () => {
        const description = { type: 'doc', version: 1, content: [] };
        expect(buildCreateFields({ issueType: 'Sub-task', parentKey: 'AG-18147', summary: 'S', description })).toEqual({
            project: { key: 'AG' },
            issuetype: { name: 'Sub-task' },
            parent: { key: 'AG-18147' },
            summary: 'S',
            description,
            components: [{ name: 'Charts' }],
            [TRACK_FIELD]: [{ id: TRACK_HOUSEKEEPING_ID }],
            labels: [AI_ELIGIBLE_LABEL],
        });
    });
});

describe('run', () => {
    const base = {
        stale,
        before: '520e6e753b23a914604858cd5c557f38d6de69f8',
        sha: 'e4340dd5980000000000000000000000000000000',
        commits: [commit('AG-18147 Add a deterministic mode to the financial demo data')],
        repositoryUrl: 'https://github.com/ag-grid/ag-charts',
        runUrl: 'https://github.com/ag-grid/ag-charts/actions/runs/1',
        log: () => {},
    };

    it('does nothing when no port is stale', async () => {
        const jira = fakeJira();
        await expect(run({ ...base, stale: [], jira })).resolves.toEqual({ action: 'none' });
        expect(jira.calls).toEqual([]);
    });

    it('creates the Sub-task and transitions it to In Progress', async () => {
        const jira = fakeJira({
            'GET /issue/AG-18147': { fields: { issuetype: { name: 'Task', subtask: false } } },
            'GET /search/jql': { issues: [] },
            'POST /issue': { key: 'AG-18300' },
            'GET /issue/AG-18300/transitions': { transitions: [{ id: '21', name: 'In Progress' }] },
        });

        const result = await run({ ...base, jira });

        expect(result).toMatchObject({
            action: 'created',
            key: 'AG-18300',
            parentKey: 'AG-18147',
            issueType: 'Sub-task',
        });
        expect(jira.calls.map(({ method, path }) => `${method} ${path}`)).toEqual([
            'GET /issue/AG-18147',
            'GET /search/jql',
            'POST /issue',
            'GET /issue/AG-18300/transitions',
            'POST /issue/AG-18300/transitions',
        ]);
        const { fields } = jira.calls[2].body;
        expect(fields.summary).toBe('Charts Sync demo ports: financial to e4340dd5');
        expect(fields.labels).toEqual(['ai-eligible']);
        const rendered = JSON.stringify(fields.description);
        expect(rendered).toContain('packages/ag-charts-demos/seeds/financial/angular/PORTING.md');
        expect(rendered).toContain('packages/ag-charts-demos/seeds/financial/vue/PORTING.md');
        expect(rendered).toContain('stamp-port-manifest.mjs financial angular');
        expect(rendered).toContain('yarn nx test:e2e:parity ag-charts-demos');
        expect(rendered).toContain('DEMOS_BASE_URL');
        expect(rendered).toContain(
            'compare/520e6e753b23a914604858cd5c557f38d6de69f8...e4340dd5980000000000000000000000000000000'
        );
        expect(fields.description.content[0]).toMatchObject({ type: 'heading', attrs: { level: 1 } });
    });

    it('comments on an open sync issue instead of creating or transitioning', async () => {
        const jira = fakeJira({
            'GET /issue/AG-18147': { fields: { issuetype: { name: 'Task', subtask: false } } },
            'GET /search/jql': { issues: [{ key: 'AG-18300', fields: { status: { name: 'In Progress' } } }] },
        });

        const result = await run({ ...base, jira });

        expect(result).toMatchObject({ action: 'commented', key: 'AG-18300' });
        expect(jira.calls.map(({ method, path }) => `${method} ${path}`)).toEqual([
            'GET /issue/AG-18147',
            'GET /search/jql',
            'POST /issue/AG-18300/comment',
        ]);
        const rendered = JSON.stringify(jira.calls[2].body.body);
        expect(rendered).toContain('moved again, to e4340dd5');
        expect(rendered).toContain('Not re-transitioned');
    });

    it('consults merged PR branches only when the commits name no ticket, then files under that ticket', async () => {
        const jira = fakeJira({
            'GET /issue/AG-18574': { fields: { issuetype: { name: 'Task', subtask: false } } },
            'GET /search/jql': { issues: [] },
            'POST /issue': { key: 'AG-18301' },
            'GET /issue/AG-18301/transitions': { transitions: [{ id: '21', name: 'In Progress' }] },
        });
        const github = {
            repository: 'ag-grid/ag-charts',
            calls: [],
            async request(method, path) {
                this.calls.push(`${method} ${path}`);
                return [
                    { merged_at: null, head: { ref: 'ghabot-ag-11111-abandoned' } },
                    { merged_at: '2026-09-21T10:00:00Z', head: { ref: 'ghabot-ag-18574-charts-number-axis' } },
                ];
            },
        };

        const result = await run({ ...base, commits: [commit('Attach intervalIgnored in place')], jira, github });

        expect(github.calls).toEqual(['GET /repos/ag-grid/ag-charts/commits/abcdef0123456789/pulls']);
        expect(result).toMatchObject({
            action: 'created',
            parentKey: 'AG-18574',
            derived: { key: 'AG-18574', source: 'branch' },
        });
    });

    it('files a Task under the showcase epic when nothing links the push to a ticket', async () => {
        const jira = fakeJira({
            'GET /search/jql': { issues: [] },
            'POST /issue': { key: 'AG-18302' },
            'GET /issue/AG-18302/transitions': { transitions: [{ id: '21', name: 'In Progress' }] },
        });

        const result = await run({ ...base, commits: [commit('Fix typo')], jira, github: null });

        expect(result).toMatchObject({ action: 'created', issueType: 'Task', parentKey: FALLBACK_EPIC });
        expect(jira.calls[0]).toMatchObject({ method: 'GET', path: '/search/jql' });
        expect(jira.calls[0].query.jql).toContain(`parent = ${FALLBACK_EPIC}`);
        expect(jira.calls[1].body.fields).toMatchObject({
            issuetype: { name: 'Task' },
            parent: { key: FALLBACK_EPIC },
        });
    });

    it('makes no write in a dry run and still shows the create path', async () => {
        const jira = fakeJira();
        const result = await run({ ...base, jira });
        expect(result).toMatchObject({
            action: 'created',
            key: 'AG-XXXXX',
            derived: { key: 'AG-18147', source: 'commit-prefix' },
        });
        expect(jira.calls.map(({ method, path }) => `${method} ${path}`)).toEqual([
            'GET /issue/AG-18147',
            'GET /search/jql',
            'POST /issue',
            'GET /issue/AG-XXXXX/transitions',
            'POST /issue/AG-XXXXX/transitions',
        ]);
        expect(jira.calls[4].body).toEqual({ transition: { id: '<id of "In Progress">' } });
    });
});
