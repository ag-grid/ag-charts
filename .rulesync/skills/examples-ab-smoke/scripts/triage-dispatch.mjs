// Split triage-queue.json into chunks for parallel Agent dispatch.
// Reads:  $OUTPUT_DIR/triage-queue.json
// Writes: $OUTPUT_DIR/triage-chunks/chunk-NNN.json
//         $OUTPUT_DIR/triage-manifest.json
//
// The orchestrating skill consumes triage-manifest.json to know how many
// Agents to launch and which (chunk, verdicts) path pair to give each one.
//
// Env:
//   OUTPUT_DIR  default '.'
//   CHUNK_SIZE  items per chunk, default 20

import { mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const OUTPUT_DIR = resolve(process.env.OUTPUT_DIR ?? '.');
const CHUNK_SIZE = Number(process.env.CHUNK_SIZE ?? 20);
const QUEUE_PATH = `${OUTPUT_DIR}/triage-queue.json`;
const CHUNK_DIR = `${OUTPUT_DIR}/triage-chunks`;
const VERDICT_DIR = `${OUTPUT_DIR}/triage-verdicts`;
const MANIFEST_PATH = `${OUTPUT_DIR}/triage-manifest.json`;

const queue = JSON.parse(readFileSync(QUEUE_PATH, 'utf8'));
const items = queue.items ?? [];

mkdirSync(CHUNK_DIR, { recursive: true });
mkdirSync(VERDICT_DIR, { recursive: true });
for (const f of readdirSync(CHUNK_DIR)) {
    if (f.endsWith('.json')) unlinkSync(`${CHUNK_DIR}/${f}`);
}

const chunks = [];
let n = 0;
for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const slice = items.slice(i, i + CHUNK_SIZE);
    const name = `chunk-${String(++n).padStart(3, '0')}.json`;
    const chunkPath = `${CHUNK_DIR}/${name}`;
    const verdictsPath = `${VERDICT_DIR}/${name}`;
    writeFileSync(chunkPath, JSON.stringify(slice, null, 2));
    chunks.push({ name, chunkPath, verdictsPath, itemCount: slice.length });
}

writeFileSync(MANIFEST_PATH, JSON.stringify({ chunkCount: chunks.length, chunkSize: CHUNK_SIZE, totalItems: items.length, chunks }, null, 2));
process.stderr.write(`Wrote ${chunks.length} chunks (size ${CHUNK_SIZE}, total ${items.length} items) → ${CHUNK_DIR}\n`);
process.stderr.write(`Manifest → ${MANIFEST_PATH}\n`);
