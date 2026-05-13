// Walks results.json and emits triage-queue.json: one item per per-(entry, phase, screenshot)
// exception, with all the evidence the LLM triage step needs. The triage step itself is
// driven by the calling skill via Task subagents — see SKILL.md step 6.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const OUTPUT_DIR = resolve(process.env.OUTPUT_DIR ?? '.');
const RESULTS_PATH = `${OUTPUT_DIR}/results.json`;
const QUEUE_PATH = `${OUTPUT_DIR}/triage-queue.json`;

const data = JSON.parse(readFileSync(RESULTS_PATH, 'utf8'));

function findScreenshot(phase, key) {
    if (!phase?.screenshots) return null;
    return phase.screenshots.find((s) => (s.buttonIndex != null ? `${s.phase}#${s.buttonIndex}` : s.phase) === key);
}

const queue = [];
let id = 1;

for (const entry of data.results) {
    if (entry.error) {
        queue.push({
            id: `t${id++}`,
            type: 'runner-error',
            page: entry.page,
            example: entry.example,
            framework: entry.framework,
            evidence: { error: entry.error },
        });
        continue;
    }
    const phaseNames = new Set([
        ...Object.keys(entry.left?.phases ?? {}),
        ...Object.keys(entry.right?.phases ?? {}),
    ]);
    for (const phaseName of phaseNames) {
        const lp = entry.left?.phases[phaseName];
        const rp = entry.right?.phases[phaseName];
        const allExceptions = [
            ...((lp?.exceptions ?? []).map((e) => ({ ...e, side: 'left' }))),
            ...((rp?.exceptions ?? []).map((e) => ({ ...e, side: 'right' }))),
        ];
        for (const ex of allExceptions) {
            const item = {
                id: `t${id++}`,
                type: ex.type,
                side: ex.side,
                page: entry.page,
                example: entry.example,
                framework: entry.framework,
                phase: phaseName,
                evidence: {
                    leftScreenshot: ex.key ? findScreenshot(lp, ex.key)?.path : lp?.screenshots?.[0]?.path,
                    rightScreenshot: ex.key ? findScreenshot(rp, ex.key)?.path : rp?.screenshots?.[0]?.path,
                    diffPath: ex.diffPath,
                    consoleErrors: (ex.side === 'left' ? entry.left : entry.right)?.consoleErrors ?? [],
                    pageErrors: (ex.side === 'left' ? entry.left : entry.right)?.pageErrors ?? [],
                    label: ex.label,
                    buttonIndex: ex.buttonIndex,
                    percent: ex.percent,
                    changed: ex.changed,
                    total: ex.total,
                    httpStatus: ex.httpStatus,
                    error: ex.error,
                },
            };
            queue.push(item);
        }
    }
}

writeFileSync(QUEUE_PATH, JSON.stringify({ count: queue.length, items: queue }, null, 2));
process.stderr.write(`Wrote ${queue.length} triage items to ${QUEUE_PATH}\n`);
