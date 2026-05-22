#!/usr/bin/env node
// Minimal MCP stdio server for Jira Cloud, scoped to the calls the
// triage agent needs. Hand-rolled JSON-RPC 2.0 over newline-delimited
// JSON — zero dependencies so it runs straight on the GHA runner with
// no install step.
//
// Tools exposed:
//   - jira_get_issue:    GET  /rest/api/3/issue/{key}?fields=summary,status
//   - jira_add_comment:  POST /rest/api/3/issue/{key}/comment
//
// Auth: basic auth from env: JIRA_USER_EMAIL + JIRA_API_TOKEN.
// Site: JIRA_SITE_URL (e.g. https://ag-grid.atlassian.net).
//
// Add more tools as the pipeline grows past Phase 0 (transitions,
// JQL search, links). Keep the surface deliberately small until then.
import { createInterface } from 'node:readline';

const PROTOCOL_VERSION = '2025-06-18';
const SERVER_NAME = 'jira-mcp-shim';
const SERVER_VERSION = '0.1.0';

const SITE = required('JIRA_SITE_URL').replace(/\/$/, '');
const EMAIL = required('JIRA_USER_EMAIL');
const TOKEN = required('JIRA_API_TOKEN');
const AUTH = 'Basic ' + Buffer.from(`${EMAIL}:${TOKEN}`).toString('base64');

const TOOLS = [
    {
        name: 'jira_get_issue',
        description: 'Fetch a Jira issue by key. Returns summary, status, and description.',
        inputSchema: {
            type: 'object',
            properties: {
                issueKey: { type: 'string', description: 'JIRA issue key, e.g. AG-12345' },
            },
            required: ['issueKey'],
        },
    },
    {
        name: 'jira_add_comment',
        description: 'Post a plain-text comment on a Jira issue.',
        inputSchema: {
            type: 'object',
            properties: {
                issueKey: { type: 'string', description: 'JIRA issue key, e.g. AG-12345' },
                body: { type: 'string', description: 'Comment text (rendered as a single ADF paragraph).' },
            },
            required: ['issueKey', 'body'],
        },
    },
];

const HANDLERS = {
    async jira_get_issue({ issueKey }) {
        const data = await jiraFetch(
            `/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=summary,status,description`
        );
        const summary = data.fields?.summary ?? '(no summary)';
        const status = data.fields?.status?.name ?? '(unknown status)';
        return `Issue: ${issueKey}\nSummary: ${summary}\nStatus: ${status}`;
    },
    async jira_add_comment({ issueKey, body }) {
        const adf = {
            body: {
                type: 'doc',
                version: 1,
                content: [{ type: 'paragraph', content: [{ type: 'text', text: body }] }],
            },
        };
        const data = await jiraFetch(`/rest/api/3/issue/${encodeURIComponent(issueKey)}/comment`, 'POST', adf);
        return `Comment posted (id: ${data.id ?? 'unknown'})`;
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
    return res.json();
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
        return; // notification — no reply
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
