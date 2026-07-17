#!/usr/bin/env node
// Aggregates run-eval.sh output into a per-cell and per-condition comparison table.
// Usage: node tools/agentic-eval/summarise-eval.mjs <results-dir>
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
if (!dir) {
    console.error('usage: summarise-eval.mjs <results-dir>');
    process.exit(1);
}

function parseJsonLoose(text) {
    try {
        return JSON.parse(text);
    } catch {
        const m = text.match(/\{[\s\S]*\}/);
        if (m) {
            try {
                return JSON.parse(m[0]);
            } catch {}
        }
        return null;
    }
}

const rows = [];
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.result.json'))) {
    const cell = f.replace(/\.result\.json$/, '');
    const [model, task, condition, rep] = cell.split('_');
    const result = parseJsonLoose(fs.readFileSync(path.join(dir, f), 'utf8')) ?? {};
    const usage = result.usage ?? {};
    const judgeFile = path.join(dir, `${cell}.judge.json`);
    const judge = fs.existsSync(judgeFile) ? parseJsonLoose(fs.readFileSync(judgeFile, 'utf8')) : null;
    const scores = judge?.scores ?? null;
    const scoreVals = scores ? Object.values(scores).filter((v) => typeof v === 'number') : [];
    rows.push({
        cell,
        model,
        task,
        condition,
        rep,
        inputTokens:
            (usage.input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0),
        outputTokens: usage.output_tokens ?? 0,
        costUsd: result.total_cost_usd ?? null,
        turns: result.num_turns ?? null,
        durationMs: result.duration_ms ?? null,
        isError: result.is_error ?? null,
        meanScore: scoreVals.length ? +(scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length).toFixed(2) : null,
        judgeNotes: judge?.notes ?? null,
    });
}

rows.sort((a, b) => a.cell.localeCompare(b.cell));
console.table(rows.map(({ judgeNotes, ...r }) => r));

// Per-condition aggregate for each model x task.
const groups = {};
for (const r of rows) {
    const key = `${r.model} ${r.task} ${r.condition}`;
    (groups[key] ??= []).push(r);
}
console.log('\nPer-condition means:');
for (const [key, g] of Object.entries(groups).sort()) {
    const mean = (sel) => {
        const vals = g.map(sel).filter((v) => v != null);
        return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : null;
    };
    console.log(
        `${key}: score=${mean((r) => r.meanScore)} inputTok=${mean((r) => r.inputTokens)} outputTok=${mean((r) => r.outputTokens)} cost=$${mean((r) => r.costUsd)} turns=${mean((r) => r.turns)}`
    );
}

fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(rows, null, 2));
console.log(`\nWritten ${path.join(dir, 'summary.json')}`);
