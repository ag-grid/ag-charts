#!/usr/bin/env node
// Emit a human-readable digest of a claude-code-action execution trace.
//
// The action writes its full event stream to `claude-execution-output.json`
// as a JSON array. With `show_full_output: 'true'` that array also dumps
// into the GHA log raw — useful for forensics, useless for "what is the
// agent doing right now". This script reads the (post-run) trace and
// emits one short line per interesting event: assistant turns, tool
// invocations, tool results (size / error only), sub-task spawns, and
// the final result block.
//
// Usage:
//   node tail.mjs --once  <path-to-claude-execution-output.json>
//   node tail.mjs --watch <path>      # reserved; falls back to --once
//
// Zero-dep, Node 20+.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { argv, exit, stdout } from 'node:process';

stdout.on('error', (err) => {
    if (err.code === 'EPIPE') exit(0);
    throw err;
});

const args = argv.slice(2);
const mode = args.includes('--watch') ? 'watch' : 'once';
const file = args.find((a) => !a.startsWith('--'));
if (!file) {
    stderr('usage: tail.mjs [--once|--watch] <claude-execution-output.json>');
    exit(2);
}

if (mode === 'watch') {
    // The trace is written as a single JSON array, not JSONL, so a true
    // streaming parse would need to track partial array state. Defer that
    // until we confirm whether claude-code-action flushes incrementally.
    // For now, poll-until-stable then run --once.
    waitForStable(file).then(() => runOnce(file));
} else {
    runOnce(file);
}

function runOnce(path) {
    if (!existsSync(path)) {
        stderr(`[trace-digest] file not found: ${path}`);
        exit(0); // not fatal — agent may have aborted before any output
    }
    let events;
    try {
        events = JSON.parse(readFileSync(path, 'utf8'));
    } catch (err) {
        stderr(`[trace-digest] parse error: ${err.message}`);
        exit(0);
    }
    if (!Array.isArray(events)) {
        stderr(`[trace-digest] expected top-level array; got ${typeof events}`);
        exit(0);
    }

    let turn = 0;
    let cost = 0;
    const startedAt = firstTimestamp(events);
    let lastStamp = '[--:--]';
    for (const e of events) {
        const fresh = stamp(e, startedAt);
        if (fresh !== '[--:--]') lastStamp = fresh;
        const t = fresh === '[--:--]' ? lastStamp : fresh;
        if (e.type === 'system' && e.subtype === 'init') {
            const tools = (e.tools || []).length;
            const mcp = (e.mcp_servers || []).map((s) => `${s.name}=${s.status}`).join(', ');
            print(`${t} session start: model=${e.model} tools=${tools} mcp=[${mcp}]`);
            continue;
        }
        if (e.type === 'system' && e.subtype === 'task_started') {
            print(`${t} task spawn (${e.task_type}): ${truncate(e.description, 120)}`);
            continue;
        }
        if (e.type === 'system' && e.subtype === 'task_notification') {
            const note = e.notification || e.text || '';
            if (note) print(`${t} task note: ${truncate(note, 120)}`);
            continue;
        }
        if (e.type === 'assistant' && e.message?.content) {
            turn += 1;
            for (const c of e.message.content) {
                if (c.type === 'text' && c.text?.trim()) {
                    print(`${t} turn ${turn}: ${truncate(c.text.trim().replace(/\s+/g, ' '), 200)}`);
                } else if (c.type === 'tool_use') {
                    print(`${t} turn ${turn} tool: ${c.name}(${summariseInput(c.name, c.input)})`);
                }
                // 'thinking' blocks are intentionally skipped — signature-encoded, no value to humans.
            }
            continue;
        }
        if (e.type === 'user' && e.message?.content) {
            for (const c of e.message.content) {
                if (c.type !== 'tool_result') continue;
                const body = typeof c.content === 'string' ? c.content : JSON.stringify(c.content);
                const size = body?.length ?? 0;
                if (c.is_error) {
                    print(`${t}   ↳ error: ${truncate(body || 'unknown', 200)}`);
                } else {
                    print(`${t}   ↳ ok (${size} chars)`);
                }
            }
            continue;
        }
        if (e.type === 'result') {
            cost = e.total_cost_usd ?? cost;
            const status = e.is_error ? 'ERROR' : e.subtype || 'done';
            const dur = e.duration_ms ? `${(e.duration_ms / 1000).toFixed(0)}s` : '?';
            print(`${t} result: ${status}  turns=${e.num_turns ?? '?'}  duration=${dur}  cost=$${cost.toFixed(2)}`);
            if (e.result) {
                print(`${t} summary:`);
                for (const line of truncate(e.result, 800).split('\n')) print(`         ${line}`);
            }
            continue;
        }
    }
}

function summariseInput(name, input) {
    if (!input || typeof input !== 'object') return '';
    // Hand-picked one-line summaries for the noisy tools.
    if (name === 'Skill') return `${input.skill ?? ''} ${input.args ?? ''}`.trim();
    if (name === 'Bash') return truncate(input.command || '', 100);
    if (name === 'Read' || name === 'Edit' || name === 'Write') return truncate(input.file_path || '', 100);
    if (name === 'Grep' || name === 'Glob') return truncate(input.pattern || input.path || '', 100);
    if (name?.startsWith('mcp__atlassian__')) {
        const key = input.issueIdOrKey || input.issueKey || '';
        return key ? key : truncate(JSON.stringify(input), 100);
    }
    if (name === 'TaskCreate') return truncate(input.subject || input.description || '', 100);
    if (name === 'TaskUpdate') return `#${input.taskId}: ${input.status ?? ''}`.trim();
    // Default: first interesting string-valued key.
    for (const [k, v] of Object.entries(input)) {
        if (typeof v === 'string' && v.length) return `${k}=${truncate(v, 80)}`;
    }
    return '';
}

function truncate(s, n) {
    if (s == null) return '';
    const str = String(s);
    return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

function firstTimestamp(events) {
    for (const e of events) {
        if (e.timestamp) return new Date(e.timestamp).getTime();
        if (e.message?.created_at) return new Date(e.message.created_at).getTime();
    }
    return null;
}

function stamp(e, base) {
    const ts = e.timestamp || e.message?.created_at;
    if (!ts || !base) return '[--:--]';
    const ms = new Date(ts).getTime() - base;
    if (Number.isNaN(ms) || ms < 0) return '[--:--]';
    const s = Math.floor(ms / 1000);
    return `[${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}]`;
}

function print(line) {
    stdout.write(line + '\n');
}

function stderr(line) {
    process.stderr.write(line + '\n');
}

async function waitForStable(path) {
    let last = -1;
    for (let i = 0; i < 30; i += 1) {
        if (existsSync(path)) {
            const sz = statSync(path).size;
            if (sz > 0 && sz === last) return;
            last = sz;
        }
        await new Promise((r) => setTimeout(r, 500));
    }
}
