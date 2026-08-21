#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Two-stage hot-path detector for PR review.
 *
 * Stage 1 classifies the changed non-test files against the tier globs in
 * hot-path-index.json. Stage 2 scores each hit: hot-path signals (loops, TypedArrays,
 * per-datum/per-frame entry points, update-type and DOM calls) in the added lines or
 * their surrounding context, changes landing near an existing hot-path marker comment,
 * and added lines that execute inside a loop. A file triggers at the index's threshold.
 *
 * The tier globs are deliberately broad, so stage 1 alone matches about two thirds of
 * merged PRs; the scoring narrows that to roughly a quarter, which is what makes the
 * analysis pass affordable. See the `hot-paths` skill for the full calibration.
 *
 * CLI usage:
 *   node detect.js                            # working tree vs merge-base with latest
 *   node detect.js --base <ref>               # explicit base ref
 *   node detect.js --range <base>..<head>     # explicit commit range
 *   node detect.js --pr <number>              # PR head vs its merge-base, via gh
 *   node detect.js --summary                  # human-readable instead of JSON
 *
 * Exit status is 0 whether or not a hot path was touched; read `triggered`.
 */

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const INDEX = JSON.parse(fs.readFileSync(path.join(__dirname, 'hot-path-index.json'), 'utf8'));
const REPO_ROOT = path.resolve(__dirname, '../..');

function git(args) {
    return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
}

// Sentinels for the wildcard forms, so the literal text can be escaped in one pass
// without the escape touching the replacements. Control characters cannot occur in
// a path pattern, so they are unambiguous.
const SLASH_GLOBSTAR = '\u0000';
const GLOBSTAR = '\u0001';
const STAR = '\u0002';

function globToRegExp(glob) {
    // `/**/` matches zero or more directories, so `series/**/*Node.ts` covers a
    // direct child as well as a nested one. A bare `**` crosses directory
    // boundaries, `*` does not, and everything else is literal.
    const source = glob
        .replace(/\/\*\*\//g, SLASH_GLOBSTAR)
        .replace(/\*\*/g, GLOBSTAR)
        .replace(/\*/g, STAR)
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .split(SLASH_GLOBSTAR)
        .join('/(?:.*/)?')
        .split(GLOBSTAR)
        .join('.*')
        .split(STAR)
        .join('[^/]*');
    return new RegExp(`^${source}$`);
}

// Specificity = literal characters in the glob. The most specific matching glob
// wins, so `series/**/*Node.ts` classifies as per-frame rather than being
// swallowed by the broader per-datum `series/**`.
const TIERS = INDEX.tiers.map((tier) => ({
    ...tier,
    matchers: tier.globs.map((glob) => ({ re: globToRegExp(glob), specificity: glob.replace(/\*/g, '').length })),
}));
const SIGNAL_GROUPS = Object.entries(INDEX.signals).filter(([key]) => !key.startsWith('$'));
const WEIGHTS = INDEX.signalWeights;
// Patterns are matched with `-`/space interchangeable, so `hot path`, `hot-path`
// and `Hot-loop` all hit without listing every spelling in the index.
const MARKER_RE = new RegExp(
    INDEX.markerComments.patterns
        .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[\s-]+/g, '[\\s-]+'))
        .join('|'),
    'i'
);

/** Resolve the diff endpoints from the CLI arguments. */
function resolveRange(argv) {
    const opt = (name) => {
        const i = argv.indexOf(name);
        return i !== -1 ? argv[i + 1] : undefined;
    };

    const range = opt('--range');
    if (range) {
        const [base, head] = range.split('..');
        return { base, head: head || 'HEAD', label: range };
    }

    const pr = opt('--pr');
    if (pr) {
        // Compare against the merge-base, matching benchmark.yml: the base-branch
        // tip would charge the PR for changes merged after it forked.
        const head = execFileSync('gh', ['pr', 'view', pr, '--json', 'headRefOid', '-q', '.headRefOid'], {
            encoding: 'utf8',
        }).trim();
        const baseRef = execFileSync('gh', ['pr', 'view', pr, '--json', 'baseRefName', '-q', '.baseRefName'], {
            encoding: 'utf8',
        }).trim();
        // An explicit refspec for the base: fetching it by name alone leaves
        // updating `origin/<baseRef>` to git's opportunistic behaviour, and a stale
        // remote-tracking ref would silently move the merge-base.
        git(['fetch', '--quiet', 'origin', head, `+refs/heads/${baseRef}:refs/remotes/origin/${baseRef}`]);
        let base = git(['merge-base', `origin/${baseRef}`, head]).trim();

        if (base === head) {
            // The head is already an ancestor of the base — the PR is merged, and the
            // merge-base is the head itself, so the diff would be empty. Fall back to
            // the merge commit's first-parent range, which is the change as landed.
            const merge = execFileSync('gh', ['pr', 'view', pr, '--json', 'mergeCommit', '-q', '.mergeCommit.oid'], {
                encoding: 'utf8',
            }).trim();
            if (!merge) {
                throw new Error(
                    `PR #${pr} head is an ancestor of ${baseRef} but has no merge commit — nothing to compare.`
                );
            }
            git(['fetch', '--quiet', 'origin', merge]);
            base = `${merge}^1`;
            return { base, head: merge, label: `PR #${pr} as merged (${merge.slice(0, 10)}^1..${merge.slice(0, 10)})` };
        }

        return { base, head, label: `PR #${pr} (${base.slice(0, 10)}..${head.slice(0, 10)})` };
    }

    const baseRef = opt('--base') ?? 'latest';
    const base = git(['merge-base', baseRef, 'HEAD']).trim();
    return { base, head: undefined, label: `${baseRef}...HEAD` };
}

const isSource = (f) => f.endsWith('.ts') && !f.endsWith('.test.ts');

/**
 * The changed source files, and which of them are untracked.
 *
 * `git diff` never lists an untracked file, so in working-tree mode a brand-new
 * hot-path file would read as no change at all until it was staged — the one case
 * where the answer matters most.
 */
function changedFiles({ base, head }) {
    const args = head ? ['diff', '--name-only', base, head] : ['diff', '--name-only', base];
    const tracked = git(args).split('\n').filter(Boolean).filter(isSource);
    const untracked = head
        ? []
        : git(['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean).filter(isSource);
    return { files: [...new Set([...tracked, ...untracked])], untracked: new Set(untracked) };
}

/** An untracked file has no diff — it is entirely new, so every line is an added line. */
function wholeFileAsAdded(lines) {
    if (lines === null) return { added: [], context: [] };
    return { added: lines.map((text, i) => ({ line: i + 1, text })), context: [] };
}

function classify(files) {
    const hits = [];
    for (const file of files) {
        let best;
        for (const tier of TIERS) {
            for (const matcher of tier.matchers) {
                if (!matcher.re.test(file)) continue;
                if (!best || matcher.specificity > best.specificity) {
                    best = { specificity: matcher.specificity, tier };
                }
            }
        }
        if (best) hits.push({ file, tier: best.tier.tier, tierId: best.tier.id });
    }
    return hits;
}

const CONTEXT_LINES = 20;

/**
 * The changed hunks of a file: added lines, plus the surrounding context.
 *
 * Signals are scanned over the context as well as the additions. A change that
 * lands inside an existing hot loop — a new guard around a per-datum call, say —
 * usually mentions none of the loop machinery in its own added lines, so
 * added-line-only scanning misses exactly the changes that matter most.
 */
function changedHunks({ base, head }, file) {
    const range = head ? [base, head] : [base];
    const out = git(['diff', `-U${CONTEXT_LINES}`, ...range, '--', file]);
    const added = [];
    const context = [];
    let next = 0;
    for (const line of out.split('\n')) {
        const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
        if (hunk) {
            next = Number(hunk[1]);
            continue;
        }
        // Only the file headers, which always carry a space before the path — a
        // removed line of code starting `--` (e.g. `--count;`) must not be skipped.
        if (/^(\+\+\+|---) /.test(line)) continue;
        if (line.startsWith('+')) {
            added.push({ line: next, text: line.slice(1) });
            next += 1;
        } else if (line.startsWith('-')) {
            // Removed lines carry no new-file number, but their content still
            // shows what the change displaced.
            context.push({ line: next, text: line.slice(1), removed: true });
        } else if (line.startsWith(' ')) {
            context.push({ line: next, text: line.slice(1) });
            next += 1;
        }
    }
    return { added, context };
}

function signalsIn({ added, context }) {
    const found = new Map();
    const scan = (lines, where) => {
        for (const { line, text } of lines) {
            for (const [group, needles] of SIGNAL_GROUPS) {
                for (const needle of needles) {
                    if (!text.includes(needle)) continue;
                    if (!found.has(group)) found.set(group, []);
                    const entries = found.get(group);
                    if (entries.length < 5) entries.push({ line, needle, where, text: text.trim().slice(0, 160) });
                }
            }
        }
    };
    scan(added, 'added');
    scan(context, 'context');
    return Object.fromEntries(found);
}

const LOOP_OPENER_RE = /\b(for|while)\s*\(|\.(forEach|map|filter|reduce|flatMap)\(/;
const BLOCK_BOUNDARY_RE = /\b(function\b|class\b|constructor\b|override\b|private\b|protected\b|public\b|static\b)/;

/**
 * Whether a line executes inside a loop, by walking outwards through decreasing
 * indentation in the head revision.
 *
 * This is the sharpest signal available without a parser: a change *inside* an
 * existing loop in a hot-path file runs per datum whether or not its own added
 * text mentions any loop machinery, which is precisely the case token matching
 * misses. The codebase is Prettier-formatted at a fixed indent, so indentation
 * tracks nesting reliably. A function or class boundary ends the walk — a loop
 * further out belongs to a different scope.
 */
function insideLoop(lines, lineNo) {
    const target = lines[lineNo - 1];
    if (target === undefined) return null;
    let indent = target.search(/\S/);
    if (indent < 0) return null;

    // A loop whose body is on its own line: `data.map((d) => ({ x: d.x }))` is
    // per-datum work that the outward walk cannot see, because the loop it runs in
    // is the line itself. A trailing `{` means the body is on later lines instead,
    // and those lines are scored in their own right.
    if (LOOP_OPENER_RE.test(target) && !/\{\s*$/.test(target)) {
        return { line: lineNo, text: target.trim().slice(0, 160) };
    }

    for (let i = lineNo - 2; i >= 0; i--) {
        const text = lines[i];
        const at = text.search(/\S/);
        if (at < 0 || at >= indent) continue;
        indent = at;
        if (LOOP_OPENER_RE.test(text)) return { line: i + 1, text: text.trim().slice(0, 160) };
        if (BLOCK_BOUNDARY_RE.test(text)) return null;
    }
    return null;
}

/** The head revision of a file, split into lines, or null when it no longer exists. */
function headLines({ base, head }, file) {
    try {
        const content = head ? git(['show', `${head}:${file}`]) : fs.readFileSync(path.join(REPO_ROOT, file), 'utf8');
        return content.split('\n');
    } catch {
        return null; // Deleted at head — nothing to read.
    }
}

/** Marker comments in the head revision, filtered to those a change landed near. */
function markerProximity(lines, added) {
    if (lines === null) return [];
    const markers = [];
    lines.forEach((text, i) => {
        if (MARKER_RE.test(text)) markers.push({ line: i + 1, text: text.trim().slice(0, 160) });
    });
    if (markers.length === 0) return [];

    const window = INDEX.markerComments.proximityLines;
    return markers.filter((m) => added.some((a) => Math.abs(a.line - m.line) <= window));
}

/** The added lines that execute inside a loop, with the loop that encloses them. */
function loopHits(lines, added) {
    if (lines === null) return [];
    const hits = [];
    for (const { line } of added) {
        const loop = insideLoop(lines, line);
        if (loop && hits.length < 5 && !hits.some((h) => h.loopLine === loop.line)) {
            hits.push({ line, loopLine: loop.line, loop: loop.text });
        }
    }
    return hits;
}

/**
 * Weighted stage-2 score for one file. Signals seen in the change's own added
 * lines count for their full weight; signals only in the surrounding context
 * count for half, since the change merely landed near them rather than
 * introducing them. Each group counts once however many times it matches.
 */
function scoreOf(file) {
    let score = 0;
    for (const [group, entries] of Object.entries(file.signals)) {
        const weight = WEIGHTS[group] ?? 1;
        const inAdded = entries.some((e) => e.where === 'added');
        score += inAdded ? weight : Math.max(1, Math.floor(weight / 2));
    }
    if (file.markers.length > 0) score += WEIGHTS.markerWeight;
    if (file.loops.length > 0) score += WEIGHTS.loopWeight;
    return score;
}

function analyse(range) {
    const { files, untracked } = changedFiles(range);
    const tierHits = classify(files);

    const perFile = tierHits.map((hit) => {
        const lines = headLines(range, hit.file);
        const hunks = untracked.has(hit.file) ? wholeFileAsAdded(lines) : changedHunks(range, hit.file);
        return {
            ...hit,
            addedLineCount: hunks.added.length,
            signals: signalsIn(hunks),
            markers: markerProximity(lines, hunks.added),
            loops: loopHits(lines, hunks.added),
        };
    });

    for (const file of perFile) {
        file.score = scoreOf(file);
    }
    const withEvidence = perFile.filter((f) => f.score >= WEIGHTS.threshold);
    const tiers = [...new Set(withEvidence.map((f) => f.tier))].sort();
    // Tier 4 is a size-limit note, not a runtime hot path — it never warrants the
    // analysis pass on its own.
    const triggered = tiers.some((t) => t <= 3);

    return {
        range: range.label,
        changedSourceFiles: files.length,
        maxScore: perFile.reduce((max, f) => Math.max(max, f.score), 0),
        stage1: { files: tierHits.length, tiers: [...new Set(tierHits.map((f) => f.tier))].sort() },
        stage2: { files: withEvidence.length, tiers },
        triggered,
        hits: withEvidence,
        invariants: Object.fromEntries(
            tiers.map((t) => {
                const tier = TIERS.find((x) => x.tier === t);
                return [tier.id, { frequency: tier.frequency, invariants: tier.invariants }];
            })
        ),
        evidence: INDEX.evidence,
    };
}

function summarise(result) {
    const out = [];
    out.push(`range: ${result.range}`);
    out.push(`changed source files: ${result.changedSourceFiles}`);
    out.push(`stage 1 (tier globs):  ${result.stage1.files} file(s), tiers [${result.stage1.tiers.join(', ')}]`);
    out.push(`stage 2 (hot signals): ${result.stage2.files} file(s), tiers [${result.stage2.tiers.join(', ')}]`);
    out.push(`triggered: ${result.triggered}`);
    for (const hit of result.hits) {
        out.push('');
        out.push(`  ${hit.file}  [tier ${hit.tier} — ${hit.tierId}, +${hit.addedLineCount} lines, score ${hit.score}]`);
        for (const [group, entries] of Object.entries(hit.signals)) {
            out.push(
                `    ${group}: ${entries.map((e) => `${e.needle}@${e.line}${e.where === 'context' ? '~' : ''}`).join(', ')}`
            );
        }
        for (const marker of hit.markers) {
            out.push(`    marker@${marker.line}: ${marker.text}`);
        }
        for (const loop of hit.loops) {
            out.push(`    in-loop@${loop.line} (loop at ${loop.loopLine}): ${loop.loop}`);
        }
    }
    return out.join('\n');
}

function main() {
    const argv = process.argv.slice(2);
    const result = analyse(resolveRange(argv));
    console.log(argv.includes('--summary') ? summarise(result) : JSON.stringify(result, null, 2));
}

if (require.main === module) {
    main();
}

module.exports = { analyse, resolveRange, globToRegExp, insideLoop };
