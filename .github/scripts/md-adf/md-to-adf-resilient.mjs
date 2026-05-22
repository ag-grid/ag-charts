#!/usr/bin/env node
// Block-level resilient wrapper around the jira skill's md-to-adf.js.
//
// Splits the markdown on blank lines, converts each block independently,
// and falls back to a single-block codeBlock for any block the underlying
// converter rejects. The well-formed parts of agent-generated state files
// keep their structural rendering (headings, lists, tables, fenced code);
// only the malformed chunks degrade to inline code.
//
// Usage:
//     node md-to-adf-resilient.mjs <path-to-md-to-adf.js> < input.md > out.json
//
// The underlying md-to-adf.js calls process.exit(2) on parse errors. We
// monkey-patch process.exit to throw so try/catch can recover per-block.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);

const mdToAdfPath = process.argv[2];
if (!mdToAdfPath) {
    process.stderr.write('usage: md-to-adf-resilient.mjs <path-to-md-to-adf.js>\n');
    process.exit(2);
}
const { convert } = require(resolve(mdToAdfPath));

const md = readFileSync(0, 'utf8');

// Split on blank lines; preserve fenced-code blocks and tables (which span
// multiple non-blank lines) as one block. A naive blank-line split already
// achieves this because the agent's output uses blank lines as block
// separators, and fenced code / tables don't contain internal blank lines.
const blocks = md
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

const origExit = process.exit;

let recovered = 0;
const content = [];
for (const block of blocks) {
    let doc;
    try {
        // Intercept the converter's process.exit(2) and turn it into a throw
        // so per-block fallback can kick in. Restore after each call so
        // unrelated exits (none expected, but defensive) still propagate.
        process.exit = (code) => {
            throw new Error(`md-to-adf exit ${code}`);
        };
        doc = convert(block);
    } catch (err) {
        recovered++;
        process.stderr.write(`[md-to-adf-resilient] block fell back to codeBlock: ${err.message}\n`);
        doc = {
            type: 'doc',
            content: [
                {
                    type: 'codeBlock',
                    attrs: { language: 'markdown' },
                    content: [{ type: 'text', text: block }],
                },
            ],
        };
    } finally {
        process.exit = origExit;
    }
    if (doc && Array.isArray(doc.content)) content.push(...doc.content);
}

if (recovered > 0) {
    process.stderr.write(`[md-to-adf-resilient] ${recovered}/${blocks.length} block(s) used the codeBlock fallback\n`);
}

process.stdout.write(JSON.stringify({ version: 1, type: 'doc', content }, null, 2) + '\n');
