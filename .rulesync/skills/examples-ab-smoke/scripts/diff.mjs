// Pixel-diff every paired screenshot from results.json. Emits diff/<…>.png
// for any pair whose pixel difference exceeds threshold and updates results.json
// in place with per-screenshot imageDiff metadata.
//
// Tunables (override via env):
//   PIXEL_THRESHOLD            pixelmatch sensitivity, 0..1, default 0.05
//   CHANGED_PCT_MINOR_FLAG     flag `image-diff` at this fraction, default 0.0005 (0.05%)
//   CHANGED_PCT_MAJOR_FLAG     escalate to `image-diff-major` at this fraction, default 0.01 (1%)
// Untriaged `image-diff-major` rows default to `regression` in the report.

import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const OUTPUT_DIR = resolve(process.env.OUTPUT_DIR ?? '.');
const RESULTS_PATH = `${OUTPUT_DIR}/results.json`;
const DIFF_DIR = `${OUTPUT_DIR}/diff`;
const PIXEL_THRESHOLD = parseFloat(process.env.PIXEL_THRESHOLD ?? '0.05');
const CHANGED_PCT_MINOR_FLAG = parseFloat(process.env.CHANGED_PCT_MINOR_FLAG ?? '0.0005');
const CHANGED_PCT_MAJOR_FLAG = parseFloat(process.env.CHANGED_PCT_MAJOR_FLAG ?? '0.01');

function loadDeps() {
    // Resolve from any node_modules above OUTPUT_DIR (typically the repo root).
    let pixelmatch, PNG;
    try {
        pixelmatch = require('pixelmatch');
        if (typeof pixelmatch !== 'function') pixelmatch = pixelmatch.default;
        PNG = require('pngjs').PNG;
    } catch (err) {
        console.error('diff.mjs requires `pixelmatch` and `pngjs` to be resolvable from this script.');
        console.error('Either run from a directory under the repo root, or `npm i pixelmatch pngjs` here.');
        process.exit(2);
    }
    return { pixelmatch, PNG };
}

const { pixelmatch, PNG } = loadDeps();

function readPng(path) {
    if (!existsSync(path)) return null;
    try {
        const data = readFileSync(path);
        return PNG.sync.read(data);
    } catch {
        return null;
    }
}

function diffPair(leftPath, rightPath, outPath) {
    const left = readPng(leftPath);
    const right = readPng(rightPath);
    if (!left || !right) {
        return { ok: false, reason: !left ? 'left-missing' : 'right-missing' };
    }
    if (left.width !== right.width || left.height !== right.height) {
        return {
            ok: true,
            sizeMismatch: true,
            leftSize: { w: left.width, h: left.height },
            rightSize: { w: right.width, h: right.height },
            changed: left.width * left.height,
            total: left.width * left.height,
            percent: 1,
            severity: 'major',
        };
    }
    const { width, height } = left;
    const total = width * height;
    const out = new PNG({ width, height });
    const changed = pixelmatch(left.data, right.data, out.data, width, height, {
        threshold: PIXEL_THRESHOLD,
        includeAA: true,
    });
    const percent = total === 0 ? 0 : changed / total;
    if (percent >= CHANGED_PCT_MINOR_FLAG) {
        mkdirSync(dirname(outPath), { recursive: true });
        writeFileSync(outPath, PNG.sync.write(out));
        const severity = percent >= CHANGED_PCT_MAJOR_FLAG ? 'major' : 'minor';
        return { ok: true, changed, total, percent, severity, diffPath: outPath };
    }
    return { ok: true, changed, total, percent };
}

function pairScreenshots(leftPhase, rightPhase) {
    const map = new Map();
    for (const s of leftPhase?.screenshots ?? []) map.set(screenshotKey(s), { left: s.path });
    for (const s of rightPhase?.screenshots ?? []) {
        const k = screenshotKey(s);
        const slot = map.get(k) ?? {};
        slot.right = s.path;
        slot.label = s.label;
        slot.buttonIndex = s.buttonIndex;
        map.set(k, slot);
    }
    return [...map.entries()].map(([key, value]) => ({ key, ...value }));
}

function screenshotKey(s) {
    return s.buttonIndex != null ? `${s.phase}#${s.buttonIndex}` : s.phase;
}

const data = JSON.parse(readFileSync(RESULTS_PATH, 'utf8'));
let exceptionsAdded = 0;
let pairs = 0;

for (const entry of data.results) {
    if (entry.error) continue;
    const phaseNames = Object.keys(entry.left?.phases ?? {});
    for (const phaseName of phaseNames) {
        const lp = entry.left.phases[phaseName];
        const rp = entry.right.phases[phaseName];
        if (!rp) continue;
        // Reset diff metadata before recomputing so reruns replace rather than
        // append to the prior diff results.
        lp.imageDiffs = [];
        lp.exceptions = (lp.exceptions ?? []).filter(
            (e) => e.type !== 'image-diff' && e.type !== 'image-diff-major'
        );
        const paired = pairScreenshots(lp, rp);
        for (const p of paired) {
            pairs++;
            if (!p.left || !p.right) continue;
            const baseName = p.key.replace(/[#/]/g, '-');
            const outPath = `${DIFF_DIR}/${entry.page}-${entry.example}-${entry.framework}-${baseName}.png`;
            const r = diffPair(p.left, p.right, outPath);
            lp.imageDiffs.push({ key: p.key, label: p.label, ...r });
            if (r.ok && (r.diffPath || r.sizeMismatch)) {
                const exception = {
                    type: r.severity === 'major' ? 'image-diff-major' : 'image-diff',
                    key: p.key,
                    label: p.label,
                    percent: r.percent,
                    changed: r.changed,
                    total: r.total,
                };
                if (r.diffPath) exception.diffPath = r.diffPath;
                if (r.sizeMismatch) {
                    exception.sizeMismatch = true;
                    exception.leftSize = r.leftSize;
                    exception.rightSize = r.rightSize;
                }
                lp.exceptions.push(exception);
                exceptionsAdded++;
            }
        }
    }
}

writeFileSync(RESULTS_PATH, JSON.stringify(data, null, 2));
process.stderr.write(`Compared ${pairs} screenshot pairs; added ${exceptionsAdded} image-diff exceptions.\n`);
process.stderr.write(`Diff PNGs (where over threshold) under ${DIFF_DIR}/\n`);
