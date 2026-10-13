#!/usr/bin/env node
// Exempt a charts archive from caching while it is under test, by setting the charts rule in the
// in-flight block of a copy of the grid's root .htaccess, in place.
//
// A charts-only copy of the grid's own tool, scripts/uncached-archives.mjs in ag-grid, which is
// the source of truth: the block's markers and the rule line must stay byte for byte what that
// tool and the grid's .htaccess generator emit, so any change to the format must be made in both.
// This copy sets only the charts rule: a grid rule in the block is kept verbatim, ahead of it, as the
// grid tool orders them. It exits non-zero, writing nothing, on a bad version, a file with no marker
// block, or a block holding anything but one rule per product, which the grid tool refuses too.
import { readFileSync, writeFileSync } from 'node:fs';

const BEGIN = '# BEGIN in-flight release archives - patched in place, do not edit by hand';
const END = '# END in-flight release archives';
const USAGE = 'usage: node tools/archive/markChartsArchiveInFlight.mjs <htaccess> <charts version>';

const GRID_PREFIX = '/archive/';
const CHARTS_PREFIX = '/charts/archive/';
const rule = (prefix, v) =>
    `Header set Cache-Control "no-cache" "expr=%{REQUEST_URI} =~ m#^${prefix}${v.replace(/\./g, '\\.')}/#"`;

const [file, version] = process.argv.slice(2);

if (!file || !version) {
    console.error(USAGE);
    process.exit(2);
}
if (!/^\d+\.\d+\.\d+$/.test(version)) {
    console.error(`'${version}' is not a version of the form 14.2.0`);
    process.exit(2);
}

const source = readFileSync(file, 'utf8');
const b = source.indexOf(BEGIN);
const e = source.indexOf(END);
if (b < 0 || e < 0 || e < b) {
    console.error(`No in-flight marker block in ${file}.`);
    console.error('That file predates this feature, or is not the generated root .htaccess.');
    process.exit(1);
}

const head = source.slice(0, b + BEGIN.length);
const tail = source.slice(e);
// Each line in the block must be one product's rule, whole: the same classification as the grid tool.
const ruleLine = (prefix) =>
    new RegExp(
        `^Header set Cache-Control "no-cache" "expr=%\\{REQUEST_URI\\} =~ m#\\^${prefix}(\\d+\\\\\\.\\d+\\\\\\.\\d+)/#"$`
    );
const lines = { grid: [], charts: [] };
for (const line of source
    .slice(b + BEGIN.length, e)
    .split('\n')
    .filter((l) => l.trim() !== '')) {
    const product = ruleLine(GRID_PREFIX).test(line) ? 'grid' : ruleLine(CHARTS_PREFIX).test(line) ? 'charts' : null;
    if (product == null || lines[product].length > 0) {
        console.error(`REFUSING: the in-flight block in ${file} holds a line this tool does not expect:`);
        console.error(line);
        process.exit(1);
    }
    lines[product].push(line);
}
const next = head + '\n' + [...lines.grid, rule(CHARTS_PREFIX, version)].join('\n') + '\n' + tail;

if (next === source) {
    console.log(`already set: charts ${version}`);
    process.exit(0);
}
// next is built from source's own head and tail, so this guards the construction, not a diff.
if (!next.startsWith(head) || !next.endsWith(tail)) {
    console.error('REFUSING: the change would touch bytes outside the marker block.');
    process.exit(1);
}

writeFileSync(file, next);
console.log(`set charts ${version}`);
