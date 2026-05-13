// Merge per-chunk LLM verdicts back into results.json.
// Reads:  $OUTPUT_DIR/triage-queue.json
//         $OUTPUT_DIR/triage-verdicts/chunk-*.json
//         $OUTPUT_DIR/results.json
// Writes: $OUTPUT_DIR/results.json   (in-place, with triage attached)
//
// Matches verdicts to exceptions by (page, example, framework, side, phase,
// type) plus any of (label, buttonIndex, percent) the queue item carried.
// Fails non-zero if any verdict cannot be matched — that means a chunk is
// stale relative to results.json; re-run dispatch on the offending chunks.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const OUTPUT_DIR = resolve(process.env.OUTPUT_DIR ?? '.');
const QUEUE_PATH = `${OUTPUT_DIR}/triage-queue.json`;
const RESULTS_PATH = `${OUTPUT_DIR}/results.json`;
const VERDICT_DIR = `${OUTPUT_DIR}/triage-verdicts`;

const queue = JSON.parse(readFileSync(QUEUE_PATH, 'utf8'));
const results = JSON.parse(readFileSync(RESULTS_PATH, 'utf8'));

const verdictById = new Map();
for (const f of readdirSync(VERDICT_DIR).sort()) {
    if (!f.endsWith('.json')) continue;
    const arr = JSON.parse(readFileSync(`${VERDICT_DIR}/${f}`, 'utf8'));
    for (const v of arr) verdictById.set(v.id, v);
}

const entryByKey = new Map();
for (const e of results.results) entryByKey.set(`${e.page}|${e.example}|${e.framework}`, e);

// Track which exception slots have already been claimed so duplicates within
// a phase (same type/side/label/buttonIndex/percent) don't all map to the
// first match — claimed slots are skipped during predicate matching.
const claimedExceptions = new WeakSet();

let merged = 0;
let missingVerdict = 0;
let unmatched = 0;
const counts = { regression: 0, 'benign-cosmetic': 0, 'benign-flake': 0, 'needs-human': 0 };
const unmatchedSamples = [];

for (const item of queue.items) {
    const v = verdictById.get(item.id);
    if (!v) {
        missingVerdict++;
        continue;
    }
    counts[v.verdict] = (counts[v.verdict] ?? 0) + 1;

    const entry = entryByKey.get(`${item.page}|${item.example}|${item.framework}`);
    if (!entry) {
        unmatched++;
        if (unmatchedSamples.length < 10) unmatchedSamples.push({ id: item.id, reason: 'no entry' });
        continue;
    }
    const sideObj = item.side === 'left' ? entry.left : entry.right;
    const phase = sideObj?.phases?.[item.phase];
    if (!phase?.exceptions) {
        unmatched++;
        if (unmatchedSamples.length < 10) unmatchedSamples.push({ id: item.id, reason: 'no phase/exceptions' });
        continue;
    }
    const itemKey = item.evidence?.key ?? item.key;
    const ex = phase.exceptions.find((e) => {
        if (claimedExceptions.has(e)) return false;
        if (e.type !== item.type) return false;
        if (itemKey != null && e.key !== itemKey) return false;
        if (item.evidence?.label != null && e.label !== item.evidence.label) return false;
        if (item.evidence?.buttonIndex != null && e.buttonIndex !== item.evidence.buttonIndex) return false;
        if (item.evidence?.percent != null && e.percent !== item.evidence.percent) return false;
        return true;
    });
    if (!ex) {
        unmatched++;
        if (unmatchedSamples.length < 10) unmatchedSamples.push({ id: item.id, reason: 'no matching exception' });
        continue;
    }
    claimedExceptions.add(ex);
    ex.triage = { verdict: v.verdict, reason: v.reason };
    merged++;
}

writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));

process.stderr.write(`Merged ${merged} verdicts; missing-verdict ${missingVerdict}; unmatched ${unmatched}.\n`);
process.stderr.write(`By verdict: ${JSON.stringify(counts)}\n`);
if (unmatchedSamples.length) {
    process.stderr.write(`Sample unmatched: ${JSON.stringify(unmatchedSamples)}\n`);
}
if (missingVerdict > 0 || unmatched > 0) {
    process.exit(1);
}
