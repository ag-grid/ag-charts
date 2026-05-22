#!/usr/bin/env node
// Minimal MCP stdio server for Jira Cloud, scoped to the calls the
// /fr --ci pipeline makes on a single ticket. Hand-rolled JSON-RPC 2.0
// over newline-delimited JSON — zero dependencies so it runs straight
// on the GHA runner with no install step.
//
// Tool names match the Atlassian/Rovo MCP server's so `/fr` (which
// expects mcp__atlassian__*) routes here without any per-tool aliasing.
//
// Tools exposed:
//   - getJiraIssue                — GET  /rest/api/3/issue/{key}
//   - addCommentToJiraIssue       — POST /rest/api/3/issue/{key}/comment
//   - getTransitionsForJiraIssue  — GET  /rest/api/3/issue/{key}/transitions
//   - transitionJiraIssue         — POST /rest/api/3/issue/{key}/transitions
//   - addAttachmentToJiraIssue    — POST /rest/api/3/issue/{key}/attachments (multipart)
//
// Auth: basic auth from env: JIRA_USER_EMAIL + JIRA_API_TOKEN.
// Site: JIRA_SITE_URL (e.g. https://ag-grid.atlassian.net).
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { createInterface } from 'node:readline';

const PROTOCOL_VERSION = '2025-06-18';
const SERVER_NAME = 'jira-mcp-shim';
const SERVER_VERSION = '0.2.0';

const SITE = required('JIRA_SITE_URL').replace(/\/$/, '');
const EMAIL = required('JIRA_USER_EMAIL');
const TOKEN = required('JIRA_API_TOKEN');
const AUTH = 'Basic ' + Buffer.from(`${EMAIL}:${TOKEN}`).toString('base64');

const TOOLS = [
    {
        name: 'getJiraIssue',
        description: 'Fetch a Jira issue. Returns summary, status, labels, and description (ADF flattened to text).',
        inputSchema: {
            type: 'object',
            properties: {
                issueIdOrKey: { type: 'string', description: 'JIRA issue key (e.g. AG-12345) or numeric id.' },
                responseContentFormat: { type: 'string', description: 'Accepted for compatibility; ignored.' },
            },
            required: ['issueIdOrKey'],
        },
    },
    {
        name: 'addCommentToJiraIssue',
        description:
            'Post a plain-text comment on a Jira issue. The body is rendered as a single ADF paragraph (newlines become hard breaks).',
        inputSchema: {
            type: 'object',
            properties: {
                issueIdOrKey: { type: 'string', description: 'JIRA issue key or id.' },
                commentBody: { type: 'string', description: 'Comment text. Plain text only.' },
            },
            required: ['issueIdOrKey', 'commentBody'],
        },
    },
    {
        name: 'getTransitionsForJiraIssue',
        description: 'List the workflow transitions available on a Jira issue. Returns id + name pairs.',
        inputSchema: {
            type: 'object',
            properties: {
                issueIdOrKey: { type: 'string', description: 'JIRA issue key or id.' },
            },
            required: ['issueIdOrKey'],
        },
    },
    {
        name: 'transitionJiraIssue',
        description:
            'Execute a workflow transition on a Jira issue. Use getTransitionsForJiraIssue to discover the id.',
        inputSchema: {
            type: 'object',
            properties: {
                issueIdOrKey: { type: 'string', description: 'JIRA issue key or id.' },
                transitionId: { type: 'string', description: 'Transition id from getTransitionsForJiraIssue.' },
            },
            required: ['issueIdOrKey', 'transitionId'],
        },
    },
    {
        name: 'addAttachmentToJiraIssue',
        description:
            'Attach a file to a Jira issue. Provide either filePath (read from disk) or fileContent (string body).',
        inputSchema: {
            type: 'object',
            properties: {
                issueIdOrKey: { type: 'string', description: 'JIRA issue key or id.' },
                filePath: { type: 'string', description: 'Absolute path to a file on the runner.' },
                fileContent: { type: 'string', description: 'Alternative to filePath: inline content.' },
                fileName: {
                    type: 'string',
                    description: 'Filename to record on the attachment. Defaults to basename(filePath).',
                },
            },
            required: ['issueIdOrKey'],
        },
    },
];

const HANDLERS = {
    async getJiraIssue({ issueIdOrKey }) {
        const data = await jiraFetch(
            `/rest/api/3/issue/${encodeURIComponent(issueIdOrKey)}?fields=summary,status,labels,description`
        );
        return JSON.stringify(
            {
                key: data.key,
                summary: data.fields?.summary ?? null,
                status: data.fields?.status?.name ?? null,
                labels: data.fields?.labels ?? [],
                description: adfToText(data.fields?.description),
            },
            null,
            2
        );
    },
    async addCommentToJiraIssue({ issueIdOrKey, commentBody }) {
        const adf = {
            body: {
                type: 'doc',
                version: 1,
                content: textToParagraphs(commentBody),
            },
        };
        const data = await jiraFetch(`/rest/api/3/issue/${encodeURIComponent(issueIdOrKey)}/comment`, 'POST', adf);
        return `Comment posted (id: ${data.id ?? 'unknown'})`;
    },
    async getTransitionsForJiraIssue({ issueIdOrKey }) {
        const data = await jiraFetch(`/rest/api/3/issue/${encodeURIComponent(issueIdOrKey)}/transitions`);
        const list = (data.transitions ?? []).map((t) => ({ id: t.id, name: t.name, to: t.to?.name }));
        return JSON.stringify(list, null, 2);
    },
    async transitionJiraIssue({ issueIdOrKey, transitionId }) {
        await jiraFetch(`/rest/api/3/issue/${encodeURIComponent(issueIdOrKey)}/transitions`, 'POST', {
            transition: { id: transitionId },
        });
        return `Transition ${transitionId} applied to ${issueIdOrKey}`;
    },
    async addAttachmentToJiraIssue({ issueIdOrKey, filePath, fileContent, fileName }) {
        let buf;
        let name = fileName;
        if (filePath) {
            buf = await readFile(filePath);
            if (!name) name = basename(filePath);
        } else if (typeof fileContent === 'string') {
            buf = Buffer.from(fileContent, 'utf8');
            if (!name) throw new Error('fileName is required when using fileContent');
        } else {
            throw new Error('Provide filePath or fileContent');
        }
        const form = new FormData();
        form.append('file', new Blob([buf]), name);
        const res = await fetch(`${SITE}/rest/api/3/issue/${encodeURIComponent(issueIdOrKey)}/attachments`, {
            method: 'POST',
            headers: {
                authorization: AUTH,
                accept: 'application/json',
                'x-atlassian-token': 'no-check',
            },
            body: form,
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`Attachment upload HTTP ${res.status}: ${text.slice(0, 500)}`);
        }
        const data = await res.json();
        const ids = Array.isArray(data) ? data.map((d) => d.id).join(',') : data.id;
        return `Attached ${name} (id: ${ids})`;
    },
};

async function jiraFetch(path, method = 'GET', body) {
    const res = await fetch(`${SITE}${path}`, {
        method,
        headers: {
            authorization: AUTH,
            accept: 'application/json',
            ...(body ? { 'content-type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Jira ${method} ${path} -> HTTP ${res.status}: ${text.slice(0, 500)}`);
    }
    if (res.status === 204) return {};
    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) return res.json();
    return {};
}

// Cheap ADF → text conversion sufficient for issue descriptions.
// Walks the tree, joins text nodes, separates paragraphs with blank lines.
function adfToText(node) {
    if (!node) return '';
    if (typeof node === 'string') return node;
    if (node.type === 'text') return node.text ?? '';
    if (node.type === 'hardBreak') return '\n';
    const children = (node.content ?? []).map(adfToText).join('');
    if (['paragraph', 'heading', 'blockquote', 'listItem'].includes(node.type)) {
        return children + '\n\n';
    }
    return children;
}

function textToParagraphs(text) {
    return text.split(/\n{2,}/).map((para) => ({
        type: 'paragraph',
        content: para.split('\n').flatMap((line, i, arr) => {
            const t = [{ type: 'text', text: line }];
            if (i < arr.length - 1) t.push({ type: 'hardBreak' });
            return t;
        }),
    }));
}

function required(name) {
    const v = process.env[name];
    if (!v) {
        console.error(`[jira-mcp-shim] missing required env: ${name}`);
        process.exit(2);
    }
    return v;
}

function reply(id, result) {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}
function replyError(id, code, message) {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}

async function handle(msg) {
    if (msg.method === 'initialize') {
        return reply(msg.id, {
            protocolVersion: PROTOCOL_VERSION,
            serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
            capabilities: { tools: {} },
        });
    }
    if (msg.method === 'notifications/initialized' || msg.method === 'initialized') {
        return;
    }
    if (msg.method === 'tools/list') {
        return reply(msg.id, { tools: TOOLS });
    }
    if (msg.method === 'tools/call') {
        const { name, arguments: args } = msg.params ?? {};
        const handler = HANDLERS[name];
        if (!handler) return replyError(msg.id, -32601, `Unknown tool: ${name}`);
        try {
            const text = await handler(args ?? {});
            return reply(msg.id, { content: [{ type: 'text', text }], isError: false });
        } catch (err) {
            return reply(msg.id, {
                content: [{ type: 'text', text: String(err?.message ?? err) }],
                isError: true,
            });
        }
    }
    if (msg.id !== undefined) {
        return replyError(msg.id, -32601, `Method not found: ${msg.method}`);
    }
}

const rl = createInterface({ input: process.stdin });
rl.on('line', (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let msg;
    try {
        msg = JSON.parse(trimmed);
    } catch (err) {
        console.error(`[jira-mcp-shim] parse error: ${err.message}`);
        return;
    }
    handle(msg).catch((err) => console.error(`[jira-mcp-shim] handler error: ${err.message}`));
});
