// Generates report.html from results.json + (optional) triage-queue.json with verdicts.
//
// Run: node generate-report.mjs   (or set OUTPUT_DIR to point elsewhere)

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';

const OUTPUT_DIR = resolve(process.env.OUTPUT_DIR ?? '.');
const RESULTS_PATH = `${OUTPUT_DIR}/results.json`;
const TRIAGE_PATH = `${OUTPUT_DIR}/triage-queue.json`;
const MATRIX_PATH = `${OUTPUT_DIR}/matrix.json`;
const REPORT_PATH = `${OUTPUT_DIR}/report.html`;

const data = JSON.parse(readFileSync(RESULTS_PATH, 'utf8'));
const triage = existsSync(TRIAGE_PATH) ? JSON.parse(readFileSync(TRIAGE_PATH, 'utf8')) : { items: [] };
const triageById = new Map(triage.items.map((t) => [t.id, t]));

// Overlay matrix-level metadata (randomData, etc.) onto results. The runner
// stores this on its own results, but rerun-mode runs leave non-re-run rows
// without the flag — reading matrix.json fills the gap so the report is
// consistent regardless of how the sweep was invoked.
const matrix = existsSync(MATRIX_PATH) ? JSON.parse(readFileSync(MATRIX_PATH, 'utf8')) : [];
const matrixByKey = new Map(matrix.map((m) => [`${m.page}/${m.example}/${m.framework}`, m]));
for (const entry of data.results) {
    if (entry.randomData) continue;
    const m = matrixByKey.get(`${entry.page}/${entry.example}/${entry.framework}`);
    if (m?.randomData) entry.randomData = m.randomData;
}

function rel(p) {
    if (!p) return '';
    return relative(dirname(REPORT_PATH), p);
}

function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function buildExampleUrl(side, entry) {
    const base = side.baseUrl.replace(/\/$/, '');
    return entry.page === 'gallery'
        ? `${base}/gallery/examples/${entry.example}`
        : `${base}/${entry.framework}/${entry.page}/examples/${entry.example}`;
}

const PHASE_ORDER = ['initial', 'controls', 'tooltip', 'legend-hover', 'legend-toggle'];

function classifyPhase(phase) {
    if (!phase) return { status: 'no-data', exceptions: [], imageDiffs: [] };
    const exceptions = phase.exceptions ?? [];
    const imageDiffs = phase.imageDiffs ?? [];
    const hasNonZero = imageDiffs.some((d) => typeof d.percent === 'number' && d.percent > 0);
    const hasException = exceptions.length > 0;
    if (!hasNonZero && !hasException) return { status: 'clean', exceptions, imageDiffs };
    return { status: 'issue', exceptions, imageDiffs };
}

function classifyEntry(entry) {
    if (entry.error) return { status: 'error', exceptions: [{ type: 'runner-error', error: entry.error }] };
    const exceptions = [];
    let leftHasPhases = false;
    let rightHasPhases = false;
    for (const sideKey of ['left', 'right']) {
        const side = entry[sideKey];
        if (!side?.phases) continue;
        if (sideKey === 'left') leftHasPhases = Object.keys(side.phases).length > 0;
        else rightHasPhases = Object.keys(side.phases).length > 0;
        for (const [phaseName, phase] of Object.entries(side.phases)) {
            for (const ex of phase.exceptions ?? []) {
                exceptions.push({ side: sideKey, phase: phaseName, ...ex });
            }
        }
    }
    // One-sided: navigation-error on one side, phases on the other → page exists on only one side.
    const navErrors = exceptions.filter((e) => e.type === 'navigation-error');
    const oneSided =
        (leftHasPhases && !rightHasPhases && navErrors.some((e) => e.side === 'right')) ||
        (rightHasPhases && !leftHasPhases && navErrors.some((e) => e.side === 'left'));
    if (oneSided) return { status: 'one-sided', exceptions };
    if (exceptions.length === 0) return { status: 'clean', exceptions };

    // Auto-suppress symmetric noise: if every exception is a control-no-render
    // that fired on BOTH sides for the same (phase, button label) AND no
    // image-diff exists for that pair, the control simply doesn't trigger a
    // canvas redraw — that's a property of the example, not a regression.
    // Drop those exceptions from consideration before final classification.
    const filtered = exceptions.filter((ex) => {
        if (ex.type !== 'control-no-render') return true;
        const counterpart = exceptions.some(
            (other) =>
                other !== ex &&
                other.type === 'control-no-render' &&
                other.phase === ex.phase &&
                other.label === ex.label &&
                other.side !== ex.side
        );
        if (!counterpart) return true;
        // Also require the corresponding image-diff for this control pair was clean.
        const pairKey = ex.key ?? (ex.buttonIndex != null ? `${ex.phase}#${ex.buttonIndex}` : ex.phase);
        const hasImageDiff = exceptions.some(
            (other) => (other.type === 'image-diff' || other.type === 'image-diff-major') && (other.key ?? other.phase) === pairKey
        );
        return hasImageDiff;
    });
    if (filtered.length === 0) {
        return { status: 'clean', exceptions, autoSuppressed: exceptions.length };
    }
    exceptions.length = 0;
    exceptions.push(...filtered);
    const verdicts = exceptions.map((ex) => ex.triage?.verdict).filter(Boolean);
    if (verdicts.length === exceptions.length && verdicts.every((v) => v.startsWith('benign'))) {
        return { status: 'triaged-benign', exceptions };
    }
    if (verdicts.some((v) => v === 'regression')) return { status: 'regression', exceptions };
    if (exceptions.some((ex) => ex.type === 'image-diff-major' && !ex.triage)) return { status: 'regression', exceptions };
    if (verdicts.some((v) => v === 'needs-human')) return { status: 'needs-human', exceptions };
    return { status: 'untriaged', exceptions };
}

function findScreenshot(phase, key) {
    if (!phase?.screenshots?.length) return null;
    if (key) {
        const m = phase.screenshots.find((s) => (s.buttonIndex != null ? `${s.phase}#${s.buttonIndex}` : s.phase) === key);
        if (m) return m.path;
    }
    return phase.screenshots[0]?.path ?? null;
}

function pairScreenshots(lp, rp) {
    const keyOf = (s) => (s.buttonIndex != null ? `${s.phase}#${s.buttonIndex}` : s.phase);
    const merged = new Map();
    for (const s of lp?.screenshots ?? []) {
        const k = keyOf(s);
        merged.set(k, { key: k, label: s.label, left: s.path, right: null });
    }
    for (const s of rp?.screenshots ?? []) {
        const k = keyOf(s);
        const ex = merged.get(k) ?? { key: k, label: s.label };
        ex.right = s.path;
        if (!merged.has(k)) merged.set(k, ex);
    }
    return [...merged.values()];
}

function renderFigure(pairId, pos, label, path) {
    if (!path) return `<figure class="fig"><figcaption>${escapeHtml(label)}</figcaption><div class="missing">no screenshot</div></figure>`;
    return `<figure class="fig" data-pair-id="${escapeHtml(pairId)}" data-pos="${pos}" data-src="${rel(path)}">
        <figcaption>${escapeHtml(label)}</figcaption>
        <img src="${rel(path)}" loading="lazy" />
      </figure>`;
}

function renderPhasePairs(entry, phaseName, rowId) {
    const lp = entry.left?.phases?.[phaseName];
    const rp = entry.right?.phases?.[phaseName];
    const pairs = pairScreenshots(lp, rp);
    if (!pairs.length) return '<div class="meta">no screenshots in this phase</div>';
    const blocks = pairs.map((p) => {
        const diffEntry = (lp?.imageDiffs ?? []).find((d) => d.key === p.key);
        const diffPercent = diffEntry?.percent;
        const diffPath = (lp?.exceptions ?? []).find((e) => e.key === p.key && (e.type === 'image-diff' || e.type === 'image-diff-major'))?.diffPath;
        const pairId = `${rowId}::${p.key}`;
        const tag = p.label ? ` <span class="meta">${escapeHtml(p.label)}</span>` : '';
        const diffSummary = diffPercent != null
            ? `<span class="diff-pill ${diffPercent >= 0.01 ? 'major' : 'minor'}">${(diffPercent * 100).toFixed(2)}% diff</span>`
            : '<span class="diff-pill clean">no diff</span>';
        return `
        <div class="pair" data-pair-id="${escapeHtml(pairId)}" data-row-id="${escapeHtml(rowId)}" data-phase="${escapeHtml(phaseName)}">
          <div class="pair-head"><span class="pair-key">${escapeHtml(p.key)}</span>${tag} ${diffSummary}</div>
          <div class="ex-figs">
            ${renderFigure(pairId, 'left', data.sides.left.name, p.left)}
            ${renderFigure(pairId, 'right', data.sides.right.name, p.right)}
            ${diffPath ? renderFigure(pairId, 'diff', 'diff', diffPath) : ''}
          </div>
        </div>`;
    });
    return blocks.join('');
}

function renderExceptionDetail(ex) {
    const bits = [];
    if (ex.percent != null) bits.push(`${(ex.percent * 100).toFixed(2)}% pixels changed (${ex.changed}/${ex.total})`);
    if (ex.label) bits.push(`button: <code>${escapeHtml(ex.label)}</code>`);
    if (ex.httpStatus) bits.push(`HTTP ${ex.httpStatus}`);
    if (ex.error) bits.push(`<code>${escapeHtml(ex.error)}</code>`);
    if (ex.newCount) bits.push(`+${ex.newCount} console errors`);
    if (ex.newConsoleErrors?.length) bits.push(`<details><summary>console errors</summary><pre>${escapeHtml(ex.newConsoleErrors.join('\n'))}</pre></details>`);
    if (ex.triage) bits.push(`<span class="verdict v-${ex.triage.verdict}">${escapeHtml(ex.triage.verdict)}</span>: ${escapeHtml(ex.triage.reason)}`);
    return bits.join(' · ');
}

function renderRow(row) {
    const e = row.entry;
    const id = `${e.page}/${e.example}/${e.framework}`;
    const open = ['regression', 'needs-human', 'untriaged', 'error', 'one-sided'].includes(row.status);
    const leftUrl = buildExampleUrl(data.sides.left, e);
    const rightUrl = buildExampleUrl(data.sides.right, e);

    // Annotate each phase
    const phaseEntries = PHASE_ORDER.map((p) => ({
        name: p,
        left: classifyPhase(e.left?.phases?.[p]),
        right: classifyPhase(e.right?.phases?.[p]),
    }));
    const issuePhases = phaseEntries.filter((p) => p.left.status === 'issue' || p.right.status === 'issue');
    const cleanPhases = phaseEntries.filter((p) =>
        (p.left.status === 'clean' || p.right.status === 'clean') &&
        p.left.status !== 'issue' && p.right.status !== 'issue'
    );

    const exceptionGroups = e.error
        ? `<div class="exception"><div class="ex-head">runner-error</div><div><code>${escapeHtml(e.error)}</code></div></div>`
        : row.exceptions
              .map(
                  (ex) => `<div class="exception">
            <div class="ex-head">${escapeHtml(ex.phase ?? '-')} <span class="pill ${escapeHtml(ex.type)}">${escapeHtml(ex.type)}</span> <span class="meta">side: ${escapeHtml(ex.side ?? '-')}</span></div>
            <div>${renderExceptionDetail(ex)}</div>
          </div>`
              )
              .join('');

    const issueBlocks = issuePhases
        .map(
            (p) => `<details class="phase phase-issue" open>
          <summary><strong>${escapeHtml(p.name)}</strong> <span class="meta">issue</span></summary>
          <div class="phase-body">${renderPhasePairs(e, p.name, id)}</div>
        </details>`
        )
        .join('');

    const cleanBlock = cleanPhases.length
        ? `<details class="phases-group">
            <summary><strong>${cleanPhases.length}</strong> clean phase${cleanPhases.length === 1 ? '' : 's'}: ${cleanPhases.map((p) => escapeHtml(p.name)).join(', ')}</summary>
            <div class="phases-group-body">
              ${cleanPhases
                  .map(
                      (p) => `<details class="phase phase-clean">
                <summary><strong>${escapeHtml(p.name)}</strong> <span class="meta">clean</span></summary>
                <div class="phase-body">${renderPhasePairs(e, p.name, id)}</div>
              </details>`
                  )
                  .join('')}
            </div>
          </details>`
        : '';

    const feedbackBlock = row.status === 'clean'
        ? ''
        : `<div class="feedback" data-feedback-id="${escapeHtml(id)}">
        <div class="fb-head">Feedback <span class="meta">stored locally; export below</span></div>
        <div class="fb-verdicts">
          ${['regression', 'benign-cosmetic', 'benign-flake', 'needs-human', 'skip']
              .map((v) => `<label class="fb-v"><input type="radio" name="verdict-${escapeHtml(id)}" value="${v}"> ${v}</label>`)
              .join('')}
        </div>
        <textarea class="fb-note" rows="2" placeholder="notes / quirks / repro hint"></textarea>
        <div class="fb-status meta"></div>
      </div>`;

    // De-duplicated exception type list for row summary
    const typeCounts = {};
    for (const ex of row.exceptions) typeCounts[ex.type] = (typeCounts[ex.type] ?? 0) + 1;
    const typeBadges = Object.entries(typeCounts)
        .map(([t, n]) => `<span class="pill ${escapeHtml(t)}">${escapeHtml(t)}${n > 1 ? ` ×${n}` : ''}</span>`)
        .join(' ');

    const rd = e.randomData;
    const randomFlag = rd && (rd.unseeded || rd.seeded)
        ? `<span class="random-flag" title="${rd.unseeded ? 'Uses Math.random — non-deterministic data' : 'Uses seededRandom helper (introduced post-13.3.0) — likely diffs vs older archive'}">🎲 ${rd.unseeded ? 'unseeded' : 'seeded-now'}</span>`
        : '';
    const dataTags = ['status:' + row.status, ...(rd?.unseeded ? ['random:unseeded'] : []), ...(rd?.seeded ? ['random:seeded'] : [])].join(' ');

    return `<details class="row" data-status="${row.status}" data-id="${escapeHtml(id)}" data-types="${escapeHtml(Object.keys(typeCounts).join(' '))}" data-tags="${escapeHtml(dataTags)}" ${open ? 'open' : ''}>
  <summary>
    <span class="badge b-${row.status}">${row.status}</span>
    <span class="fb-mark" data-fb-mark-for="${escapeHtml(id)}"></span>
    <span class="row-title">${escapeHtml(e.page)}/${escapeHtml(e.example)} <span class="meta">[${escapeHtml(e.framework)}]</span></span>
    ${randomFlag}
    <span class="links">
      <a href="${escapeHtml(leftUrl)}#e2e=true" target="_blank">${escapeHtml(data.sides.left.name)} ↗</a>
      <a href="${escapeHtml(rightUrl)}#e2e=true" target="_blank">${escapeHtml(data.sides.right.name)} ↗</a>
    </span>
    <span class="row-meta-right">${typeBadges} <span class="meta">${row.exceptions.length} exc.</span></span>
  </summary>
  <div class="body">
    ${exceptionGroups ? `<div class="exception-list">${exceptionGroups}</div>` : ''}
    ${issueBlocks}
    ${cleanBlock}
    ${feedbackBlock}
  </div>
</details>`;
}

const counts = { clean: 0, untriaged: 0, 'triaged-benign': 0, regression: 0, 'needs-human': 0, error: 0, 'one-sided': 0 };
const rows = [];
for (const entry of data.results) {
    const c = classifyEntry(entry);
    counts[c.status]++;
    rows.push({ entry, ...c });
}

const oneSided = rows.filter((r) => r.status === 'one-sided');
const oneSidedByDirection = { onlyLeft: [], onlyRight: [] };
for (const r of oneSided) {
    const navOnRight = r.exceptions.some((e) => e.type === 'navigation-error' && e.side === 'right');
    if (navOnRight) oneSidedByDirection.onlyLeft.push(r);
    else oneSidedByDirection.onlyRight.push(r);
}

function renderSideMeta(label, side, sideMeta) {
    const parts = [
        `<div class="side-meta-name"><strong>${escapeHtml(label)}</strong>: ${escapeHtml(side.name)}</div>`,
        `<div class="meta">${escapeHtml(side.baseUrl)}</div>`,
    ];
    const m = sideMeta?.meta;
    if (m) {
        if (m.versions?.charts) parts.push(`<div>charts <code>${escapeHtml(m.versions.charts)}</code></div>`);
        if (m.git?.shortHash) parts.push(`<div class="meta">git ${escapeHtml(m.git.shortHash)} · ${escapeHtml(m.git.date ?? '')}</div>`);
        if (m.buildDate) parts.push(`<div class="meta">built ${escapeHtml(m.buildDate)}</div>`);
    } else if (sideMeta?.error) {
        parts.push(`<div class="meta">/debug/meta.json: ${escapeHtml(sideMeta.error)}</div>`);
    }
    return `<div class="side-meta">${parts.join('')}</div>`;
}

function renderOneSidedList(rows, otherSideName) {
    if (!rows.length) return '';
    return `<details>
      <summary>${rows.length} only on ${escapeHtml(otherSideName)}</summary>
      <ul>${rows.map((r) => `<li><strong>${escapeHtml(r.entry.page)}</strong>/${escapeHtml(r.entry.example)} <span class="meta">[${escapeHtml(r.entry.framework)}]</span></li>`).join('')}</ul>
    </details>`;
}

const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>AG Charts Examples A/B Smoke Report</title>
<style>
  :root {
    --bg: #f7f8fa;
    --card: #ffffff;
    --border: #e1e4ea;
    --border-soft: #ececf1;
    --text: #1f2328;
    --muted: #57606a;
    --link: #0656a8;
    --accent: #0656a8;
    --clean-bg: #e6f4ea; --clean-fg: #1b5e20;
    --untriaged-bg: #fff1d6; --untriaged-fg: #7a4a00;
    --triaged-bg: #d6e9f9; --triaged-fg: #0b4a82;
    --regression-bg: #fde0e0; --regression-fg: #8a1414;
    --needs-bg: #fff1a8; --needs-fg: #5a3e00;
    --error-bg: #f5c2c7; --error-fg: #58151c;
    --onesided-bg: #ecdcfa; --onesided-fg: #4a148c;
  }
  * { box-sizing: border-box; }
  body { font: 13px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; margin: 0; padding: 0 0 24px 0; color: var(--text); background: var(--bg); }
  .container { max-width: 1400px; margin: 0 auto; padding: 0 20px; }
  h1 { font-size: 20px; margin: 16px 0 4px 0; }
  .subtitle { color: var(--muted); margin-bottom: 16px; font-size: 13px; }
  .meta-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 0 0 14px 0; }
  .side-meta { padding: 10px 14px; background: var(--card); border: 1px solid var(--border); border-radius: 8px; font-size: 12px; }
  .side-meta .side-meta-name { font-size: 13px; margin-bottom: 4px; }
  .side-meta.left { border-left: 3px solid #0a8fb8; }
  .side-meta.right { border-left: 3px solid #b85e0a; }

  /* Sticky toolbar with filter chips */
  .toolbar { position: sticky; top: 0; z-index: 50; background: var(--bg); padding: 10px 0 6px 0; margin-bottom: 8px; border-bottom: 1px solid var(--border); }
  .chips { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  .chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;
          background: var(--card); border: 1px solid var(--border); cursor: pointer; user-select: none; transition: background 0.1s; }
  .chip:hover { background: #eef1f5; }
  .chip[aria-pressed="true"] { border-color: transparent; }
  .chip .count { font-variant-numeric: tabular-nums; font-weight: 700; opacity: 0.9; }
  .chip-clean[aria-pressed="true"] { background: var(--clean-bg); color: var(--clean-fg); }
  .chip-untriaged[aria-pressed="true"] { background: var(--untriaged-bg); color: var(--untriaged-fg); }
  .chip-triaged-benign[aria-pressed="true"] { background: var(--triaged-bg); color: var(--triaged-fg); }
  .chip-regression[aria-pressed="true"] { background: var(--regression-bg); color: var(--regression-fg); }
  .chip-needs-human[aria-pressed="true"] { background: var(--needs-bg); color: var(--needs-fg); }
  .chip-error[aria-pressed="true"] { background: var(--error-bg); color: var(--error-fg); }
  .chip-one-sided[aria-pressed="true"] { background: var(--onesided-bg); color: var(--onesided-fg); }
  .chip-divider { width: 1px; align-self: stretch; background: var(--border); margin: 0 4px; }
  .chip-action { background: var(--card); }
  .chip-action.active { background: #ffe66e; }

  .filter-row { display: flex; gap: 10px; align-items: center; margin-top: 8px; flex-wrap: wrap; }
  input[type=text] { padding: 6px 10px; border: 1px solid var(--border); border-radius: 6px; min-width: 280px; font: inherit; background: var(--card); }
  .shown-count { color: var(--muted); font-size: 12px; }
  .shown-count strong { color: var(--text); }

  .fb-bar { display: flex; gap: 10px; align-items: center; padding: 8px 0; font-size: 12px; flex-wrap: wrap; }
  .fb-bar button { padding: 4px 10px; font-size: 12px; cursor: pointer; border: 1px solid var(--border); background: var(--card); border-radius: 4px; }
  .fb-bar button:hover { background: #eef1f5; }
  .fb-bar input[type=file] { font-size: 11px; }
  .kbd-hint { color: var(--muted); font-size: 11px; }
  .kbd-hint kbd { display: inline-block; padding: 1px 5px; background: var(--card); border: 1px solid var(--border); border-bottom-width: 2px; border-radius: 3px; font-size: 10px; font-family: ui-monospace, monospace; margin: 0 1px; }

  /* Rows */
  details.row { border: 1px solid var(--border); border-radius: 8px; margin: 6px 0; padding: 0; background: var(--card); }
  details.row > summary { cursor: pointer; padding: 10px 14px; font-weight: 500; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; list-style: none; }
  details.row > summary::-webkit-details-marker { display: none; }
  details.row[open] > summary { border-bottom: 1px solid var(--border-soft); }
  details.row > .body { padding: 10px 14px 14px 14px; }
  .row-title { font-weight: 600; }
  .row-title .meta { color: var(--muted); font-weight: 400; }
  .links { font-size: 12px; }
  .links a { color: var(--link); text-decoration: none; margin-right: 10px; }
  .links a:hover { text-decoration: underline; }
  .row-meta-right { margin-left: auto; display: flex; gap: 10px; align-items: center; font-size: 11px; color: var(--muted); }

  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em; }
  .b-clean { background: var(--clean-bg); color: var(--clean-fg); }
  .b-untriaged { background: var(--untriaged-bg); color: var(--untriaged-fg); }
  .b-triaged-benign { background: var(--triaged-bg); color: var(--triaged-fg); }
  .b-regression { background: var(--regression-bg); color: var(--regression-fg); }
  .b-needs-human { background: var(--needs-bg); color: var(--needs-fg); }
  .b-error { background: var(--error-bg); color: var(--error-fg); }
  .b-one-sided { background: var(--onesided-bg); color: var(--onesided-fg); }

  .exception-list { margin-bottom: 10px; }
  .exception { border-top: 1px solid var(--border-soft); padding: 8px 0; }
  .exception-list .exception:first-child { border-top: none; padding-top: 0; }
  .ex-head { font-weight: 600; font-size: 12px; }
  .ex-head .pill { font-weight: 500; padding: 1px 6px; border-radius: 3px; font-size: 10.5px; background: var(--border); margin-left: 4px; }
  .ex-head .pill.image-diff { background: #fff1d6; color: #7a4a00; }
  .ex-head .pill.image-diff-major { background: #fde0e0; color: #8a1414; }
  .ex-head .pill.navigation-error, .ex-head .pill.page-error, .ex-head .pill.canvas-missing { background: var(--error-bg); color: var(--error-fg); }
  .ex-head .pill.control-no-render, .ex-head .pill.legend-asymmetry { background: #d6e9f9; color: #0b4a82; }
  .ex-head .pill.chart-not-settled { background: #ffe5b4; color: #6b3a00; }
  .ex-head .pill.console-error { background: #fff1a8; color: #5a3e00; }

  details.phase { border: 1px solid var(--border-soft); border-radius: 6px; margin: 6px 0; background: #fafbfc; }
  details.phase > summary { cursor: pointer; padding: 6px 12px; font-weight: 500; list-style: none; }
  details.phase > summary::-webkit-details-marker { display: none; }
  details.phase-issue > summary { background: #fff5f5; border-radius: 6px 6px 0 0; }
  details.phase-clean > summary { background: #f4faf6; border-radius: 6px 6px 0 0; }
  details.phase > .phase-body { padding: 8px 14px 10px 14px; background: var(--card); border-radius: 0 0 6px 6px; }

  .phases-group { margin-top: 8px; }
  .phases-group > summary { cursor: pointer; padding: 6px 0; color: var(--muted); font-size: 12px; }
  .phases-group-body { padding: 4px 0 0 0; }

  .pair { margin: 8px 0 12px 0; }
  .pair-head { font-size: 11px; color: var(--muted); margin-bottom: 6px; display: flex; gap: 8px; align-items: center; }
  .pair-head .pair-key { font-family: ui-monospace, monospace; color: var(--text); }
  .diff-pill { padding: 1px 7px; border-radius: 999px; font-size: 10.5px; font-weight: 600; }
  .diff-pill.clean { background: var(--clean-bg); color: var(--clean-fg); }
  .diff-pill.minor { background: var(--untriaged-bg); color: var(--untriaged-fg); }
  .diff-pill.major { background: var(--regression-bg); color: var(--regression-fg); }

  .ex-figs { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px; margin: 4px 0; max-width: 1100px; }
  .ex-figs figure { margin: 0; }
  .ex-figs figcaption { font-size: 11px; color: var(--muted); margin-bottom: 4px; }
  .ex-figs img { width: 100%; max-height: 240px; object-fit: contain; background: #fff; border: 1px solid var(--border); border-radius: 4px; cursor: zoom-in; transition: border-color 0.1s; }
  .ex-figs img:hover { border-color: var(--accent); }
  .ex-figs .missing { font-size: 11px; color: #aaa; padding: 24px; border: 1px dashed var(--border); border-radius: 4px; text-align: center; background: #fafbfc; }

  pre { font-size: 11px; max-height: 180px; overflow: auto; background: #f6f8fa; padding: 8px 10px; border: 1px solid var(--border-soft); border-radius: 4px; }
  code { background: #f6f8fa; padding: 1px 5px; border-radius: 3px; font-size: 11px; font-family: ui-monospace, monospace; }
  .verdict { padding: 1px 6px; border-radius: 3px; font-weight: 600; font-size: 11px; }
  .v-regression { background: var(--regression-bg); color: var(--regression-fg); }
  .v-benign-cosmetic, .v-benign-flake { background: var(--triaged-bg); color: var(--triaged-fg); }
  .v-needs-human { background: var(--needs-bg); color: var(--needs-fg); }
  .meta { color: var(--muted); font-size: 11px; }

  .one-sided-panel { padding: 12px 14px; margin: 0 0 12px 0; background: var(--card); border: 1px solid var(--onesided-bg); border-left: 3px solid #b06af0; border-radius: 6px; font-size: 12px; }
  .one-sided-panel ul { margin: 4px 0 0 18px; padding: 0; columns: 2; }

  .feedback { margin-top: 12px; padding: 10px 12px; background: #fffbe9; border: 1px solid #f3eccb; border-radius: 6px; }
  .fb-head { font-weight: 600; font-size: 12px; margin-bottom: 6px; }
  .fb-verdicts { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; }
  .fb-v { user-select: none; cursor: pointer; padding: 3px 10px; border-radius: 999px; border: 1px solid var(--border); background: var(--card); font-size: 12px; }
  .fb-v input { display: none; }
  .fb-v:has(input:checked) { background: var(--accent); color: white; border-color: var(--accent); }
  .fb-note { width: 100%; padding: 6px 8px; border: 1px solid var(--border); border-radius: 4px; font: 12px/1.4 -apple-system, system-ui, sans-serif; resize: vertical; background: var(--card); }
  .fb-status { margin-top: 4px; min-height: 14px; }
  .fb-mark { font-size: 10.5px; padding: 1px 6px; border-radius: 3px; font-weight: 600; }
  .fb-mark[data-v=regression] { background: var(--regression-bg); color: var(--regression-fg); }
  .fb-mark[data-v=benign-cosmetic], .fb-mark[data-v=benign-flake] { background: var(--triaged-bg); color: var(--triaged-fg); }
  .fb-mark[data-v=needs-human] { background: var(--needs-bg); color: var(--needs-fg); }
  .fb-mark[data-v=skip] { background: #e6e6e6; color: #555; }
  .random-flag { font-size: 10.5px; padding: 1px 7px; border-radius: 999px; background: #f0e6ff; color: #4a148c; border: 1px solid #d4baf0; font-weight: 600; }

  /* Lightbox */
  .lb { position: fixed; inset: 0; background: rgba(15, 18, 22, 0.96); z-index: 1000; display: none; flex-direction: column; }
  .lb.open { display: flex; }
  .lb-head { padding: 10px 16px; color: #e8e8ea; display: flex; gap: 14px; align-items: center; border-bottom: 1px solid #2a2d33; font-size: 12px; flex-wrap: wrap; }
  .lb-head .lb-title { font-weight: 600; }
  .lb-head .lb-sub { color: #9aa0a6; }
  .lb-head .lb-spacer { flex: 1; }
  .lb-tabs { display: flex; gap: 4px; }
  .lb-tab { padding: 4px 10px; border-radius: 4px; cursor: pointer; color: #ccc; background: #1f2228; border: 1px solid #2f333a; font-size: 12px; }
  .lb-tab:hover { background: #2a2f37; }
  .lb-tab[aria-pressed="true"] { background: #2f80ed; color: white; border-color: #2f80ed; }
  .lb-close { background: none; border: none; color: #ddd; font-size: 24px; cursor: pointer; padding: 0 6px; line-height: 1; }
  .lb-body { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 14px; overflow: hidden; gap: 10px; }
  .lb-stage { display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; overflow: auto; }
  .lb-stage img { max-width: 100%; max-height: calc(100vh - 200px); display: block; }
  .lb-side-by-side { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; height: 100%; }
  .lb-side-by-side > div { display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; }
  .lb-side-by-side .lb-label { color: #ccc; font-size: 12px; margin-bottom: 6px; }
  .lb-side-by-side img { max-width: 100%; max-height: calc(100vh - 220px); }
  .lb-compare-wrap { position: relative; width: 100%; max-width: min(1600px, 98%); max-height: calc(100vh - 200px); display: flex; align-items: center; justify-content: center; }
  .lb-compare { position: relative; max-width: 100%; max-height: calc(100vh - 200px); display: inline-block; }
  .lb-compare img { display: block; max-width: 100%; max-height: calc(100vh - 200px); user-select: none; pointer-events: none; }
  .lb-compare .lb-img-a { position: absolute; inset: 0; }
  .lb-compare.mode-overlay .lb-img-a { mix-blend-mode: normal; }
  .lb-compare.mode-swipe .lb-img-a { clip-path: inset(0 var(--swipe-r, 50%) 0 0); }
  .lb-divider { position: absolute; top: 0; bottom: 0; width: 3px; background: #2f80ed; cursor: ew-resize; transform: translateX(-1.5px); display: none; box-shadow: 0 0 0 1px rgba(0,0,0,0.4); }
  .lb-compare.mode-swipe .lb-divider { display: block; }
  .lb-divider::before { content: '⇔'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #2f80ed; color: white; padding: 4px 6px; border-radius: 4px; font-size: 12px; }
  .lb-controls { display: flex; gap: 12px; align-items: center; color: #ccc; font-size: 12px; padding: 4px 8px; background: #1c1f25; border: 1px solid #2a2d33; border-radius: 6px; }
  .lb-controls input[type=range] { width: 240px; }
  .lb-foot { color: #9aa0a6; font-size: 11px; padding: 8px 16px; border-top: 1px solid #2a2d33; display: flex; gap: 16px; flex-wrap: wrap; }
  .lb-foot kbd { display: inline-block; padding: 1px 6px; background: #2a2d33; border: 1px solid #3a3e46; border-bottom-width: 2px; border-radius: 3px; font-size: 10px; font-family: ui-monospace, monospace; color: #ddd; }
  .lb-pos-tabs { display: flex; gap: 4px; }
  .lb-pos-tabs .lb-tab { padding: 3px 8px; }
</style></head><body>
<div class="container">
<h1>AG Charts Examples A/B Smoke Report</h1>
<div class="subtitle">${escapeHtml(data.sides.left.name)} vs ${escapeHtml(data.sides.right.name)} · framework <code>${escapeHtml(data.sides.framework ?? 'vanilla')}</code> · ${data.results.length} examples</div>
<div class="meta-row">
  ${renderSideMeta('left', data.sides.left, data.sideMetadata?.left).replace('class="side-meta"', 'class="side-meta left"')}
  ${renderSideMeta('right', data.sides.right, data.sideMetadata?.right).replace('class="side-meta"', 'class="side-meta right"')}
</div>
${counts['one-sided'] > 0
    ? `<div class="one-sided-panel">
        <strong>Examples present on only one side</strong>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:6px">
          <div>${renderOneSidedList(oneSidedByDirection.onlyLeft, data.sides.left.name)}</div>
          <div>${renderOneSidedList(oneSidedByDirection.onlyRight, data.sides.right.name)}</div>
        </div>
      </div>`
    : ''}

<div class="toolbar">
  <div class="chips" role="group" aria-label="Status filter chips">
    <button class="chip chip-regression" data-status="regression" aria-pressed="true">regression <span class="count">${counts.regression}</span></button>
    <button class="chip chip-needs-human" data-status="needs-human" aria-pressed="true">needs human <span class="count">${counts['needs-human']}</span></button>
    <button class="chip chip-untriaged" data-status="untriaged" aria-pressed="true">untriaged <span class="count">${counts.untriaged}</span></button>
    <button class="chip chip-error" data-status="error" aria-pressed="true">runner error <span class="count">${counts.error}</span></button>
    <button class="chip chip-one-sided" data-status="one-sided" aria-pressed="true">one-sided <span class="count">${counts['one-sided']}</span></button>
    <span class="chip-divider"></span>
    <button class="chip chip-triaged-benign" data-status="triaged-benign" aria-pressed="false">triaged-benign <span class="count">${counts['triaged-benign']}</span></button>
    <button class="chip chip-clean" data-status="clean" aria-pressed="false">clean <span class="count">${counts.clean}</span></button>
    <span class="chip-divider"></span>
    <button class="chip chip-action" id="chip-only-feedback" aria-pressed="false">only with feedback</button>
    <button class="chip chip-action" id="chip-only-random" aria-pressed="false" title="Examples with Math.random or seededRandom — likely false-positive diffs vs older archives">🎲 only non-deterministic data (${rows.filter((r) => r.entry.randomData?.unseeded || r.entry.randomData?.seeded).length})</button>
    <button class="chip chip-action" id="chip-hide-random" aria-pressed="false" title="Hide examples with non-deterministic data">hide non-deterministic</button>
    <button class="chip chip-action" id="chip-all" title="Show all categories">all</button>
    <button class="chip chip-action" id="chip-none" title="Hide all categories">none</button>
  </div>
  <div class="filter-row">
    <input type="text" id="filter" placeholder="filter by page / example / framework / exception type">
    <span class="shown-count"><strong id="shown-n">0</strong> of <strong id="total-n">${data.results.length}</strong> shown</span>
    <span class="kbd-hint">Click any image to open lightbox · <kbd>←</kbd><kbd>→</kbd> switch view · <kbd>↑</kbd><kbd>↓</kbd> next pair · <kbd>O</kbd>verlay · <kbd>S</kbd>wipe</span>
  </div>
  <div class="fb-bar">
    <strong>Feedback:</strong>
    <span id="fb-count" class="meta">0 entries</span>
    <button id="fb-export">Export JSON</button>
    <button id="fb-export-csv">Export CSV</button>
    <label>Import: <input type="file" id="fb-import" accept="application/json"></label>
    <button id="fb-clear">Clear all</button>
    <span class="meta">stored as <code id="fb-key"></code></span>
  </div>
</div>

<div id="rows">
${rows.map(renderRow).join('\n')}
</div>
</div>

<!-- Lightbox -->
<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="Image viewer">
  <div class="lb-head">
    <span class="lb-title" id="lb-title"></span>
    <span class="lb-sub" id="lb-sub"></span>
    <span class="lb-spacer"></span>
    <span class="lb-pos-tabs" id="lb-pos-tabs"></span>
    <span class="lb-tabs">
      <button class="lb-tab" data-mode="single" aria-pressed="true">Single</button>
      <button class="lb-tab" data-mode="side">Side-by-side</button>
      <button class="lb-tab" data-mode="overlay">Overlay</button>
      <button class="lb-tab" data-mode="swipe">Swipe</button>
    </span>
    <button class="lb-close" id="lb-close" aria-label="Close">×</button>
  </div>
  <div class="lb-body" id="lb-body"></div>
  <div class="lb-foot">
    <span><kbd>←</kbd><kbd>→</kbd> left / right / diff view</span>
    <span><kbd>↑</kbd><kbd>↓</kbd> previous / next pair</span>
    <span><kbd>1</kbd>–<kbd>4</kbd> modes</span>
    <span><kbd>O</kbd>verlay · <kbd>S</kbd>wipe · <kbd>D</kbd>iff · <kbd>Esc</kbd> close</span>
  </div>
</div>
<script>
  // Storage key is unique per (left+right side names) so different runs don't collide.
  const STORAGE_KEY = 'ab-smoke-feedback:' + ${JSON.stringify(`${data.sides.left.name}__vs__${data.sides.right.name}__${data.sides.framework ?? 'vanilla'}`)};
  document.getElementById('fb-key').textContent = STORAGE_KEY;

  function loadFeedback() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  }
  function saveFeedback(fb) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fb));
    updateCount(fb);
  }
  function updateCount(fb) {
    const n = Object.values(fb).filter((v) => v && (v.verdict || (v.note && v.note.trim()))).length;
    document.getElementById('fb-count').textContent = n + ' entr' + (n === 1 ? 'y' : 'ies');
  }

  const fb = loadFeedback();
  // Apply stored values to UI
  for (const block of document.querySelectorAll('.feedback')) {
    const id = block.dataset.feedbackId;
    const entry = fb[id];
    if (!entry) continue;
    if (entry.verdict) {
      const r = block.querySelector('input[type=radio][value="' + entry.verdict + '"]');
      if (r) r.checked = true;
      const mark = document.querySelector('[data-fb-mark-for="' + CSS.escape(id) + '"]');
      if (mark) { mark.textContent = '✓ ' + entry.verdict; mark.dataset.v = entry.verdict; }
    }
    if (entry.note) block.querySelector('.fb-note').value = entry.note;
  }
  updateCount(fb);

  function setEntry(id, partial) {
    const cur = fb[id] || {};
    fb[id] = { ...cur, ...partial, ts: new Date().toISOString() };
    if (!fb[id].verdict && !(fb[id].note && fb[id].note.trim())) delete fb[id];
    saveFeedback(fb);
    const mark = document.querySelector('[data-fb-mark-for="' + CSS.escape(id) + '"]');
    if (mark) {
      const v = fb[id]?.verdict;
      if (v) { mark.textContent = '✓ ' + v; mark.dataset.v = v; }
      else { mark.textContent = ''; mark.removeAttribute('data-v'); }
    }
  }

  document.addEventListener('change', (ev) => {
    const t = ev.target;
    if (!t.matches('.feedback input[type=radio]')) return;
    const block = t.closest('.feedback');
    const id = block.dataset.feedbackId;
    setEntry(id, { verdict: t.value });
    block.querySelector('.fb-status').textContent = 'saved';
    setTimeout(() => block.querySelector('.fb-status').textContent = '', 1200);
  });
  document.addEventListener('input', (ev) => {
    const t = ev.target;
    if (!t.matches('.feedback .fb-note')) return;
    const block = t.closest('.feedback');
    const id = block.dataset.feedbackId;
    clearTimeout(t._dbnc);
    t._dbnc = setTimeout(() => {
      setEntry(id, { note: t.value });
      block.querySelector('.fb-status').textContent = 'saved';
      setTimeout(() => block.querySelector('.fb-status').textContent = '', 1200);
    }, 350);
  });

  document.getElementById('fb-export').addEventListener('click', () => {
    const out = { storageKey: STORAGE_KEY, exportedAt: new Date().toISOString(), entries: fb };
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ab-smoke-feedback-' + Date.now() + '.json';
    a.click();
  });
  document.getElementById('fb-export-csv').addEventListener('click', () => {
    const rows = [['id', 'page', 'example', 'framework', 'status', 'verdict', 'note', 'ts']];
    for (const [id, entry] of Object.entries(fb)) {
      const row = document.querySelector('.row[data-id="' + CSS.escape(id) + '"]');
      const status = row?.dataset.status ?? '';
      const [page, example, framework] = id.split('/');
      rows.push([id, page, example, framework, status, entry.verdict ?? '', (entry.note ?? '').replace(/\\n/g, ' '), entry.ts ?? '']);
    }
    const csv = rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ab-smoke-feedback-' + Date.now() + '.csv';
    a.click();
  });
  document.getElementById('fb-import').addEventListener('change', async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const incoming = parsed.entries ?? parsed;
      Object.assign(fb, incoming);
      saveFeedback(fb);
      location.reload();
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
  });
  document.getElementById('fb-clear').addEventListener('click', () => {
    if (!confirm('Clear all feedback for this run?')) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });

  // --- Filter chips + search + counter ---
  const filter = document.getElementById('filter');
  const chips = [...document.querySelectorAll('.chip[data-status]')];
  const chipOnlyFb = document.getElementById('chip-only-feedback');
  const chipOnlyRandom = document.getElementById('chip-only-random');
  const chipHideRandom = document.getElementById('chip-hide-random');
  const chipAll = document.getElementById('chip-all');
  const chipNone = document.getElementById('chip-none');
  const shownN = document.getElementById('shown-n');

  function apply() {
    const q = filter.value.toLowerCase().trim();
    const enabled = new Set(chips.filter((c) => c.getAttribute('aria-pressed') === 'true').map((c) => c.dataset.status));
    const onlyFb = chipOnlyFb.getAttribute('aria-pressed') === 'true';
    const onlyRandom = chipOnlyRandom.getAttribute('aria-pressed') === 'true';
    const hideRandom = chipHideRandom.getAttribute('aria-pressed') === 'true';
    let shown = 0;
    for (const row of document.querySelectorAll('.row')) {
      const id = row.dataset.id;
      const hasFb = !!fb[id];
      const types = row.dataset.types ?? '';
      const tags = row.dataset.tags ?? '';
      const isRandom = tags.includes('random:');
      const matchText = !q || id.toLowerCase().includes(q) || types.toLowerCase().includes(q);
      let visible = matchText && enabled.has(row.dataset.status) && (!onlyFb || hasFb);
      if (visible && onlyRandom && !isRandom) visible = false;
      if (visible && hideRandom && isRandom) visible = false;
      row.style.display = visible ? '' : 'none';
      if (visible) shown++;
    }
    shownN.textContent = shown;
  }
  filter.addEventListener('input', apply);
  for (const c of chips) {
    c.addEventListener('click', () => {
      const pressed = c.getAttribute('aria-pressed') === 'true';
      c.setAttribute('aria-pressed', String(!pressed));
      apply();
    });
  }
  chipOnlyFb.addEventListener('click', () => {
    const pressed = chipOnlyFb.getAttribute('aria-pressed') === 'true';
    chipOnlyFb.setAttribute('aria-pressed', String(!pressed));
    chipOnlyFb.classList.toggle('active', !pressed);
    apply();
  });
  chipOnlyRandom.addEventListener('click', () => {
    const pressed = chipOnlyRandom.getAttribute('aria-pressed') === 'true';
    chipOnlyRandom.setAttribute('aria-pressed', String(!pressed));
    chipOnlyRandom.classList.toggle('active', !pressed);
    if (!pressed) { chipHideRandom.setAttribute('aria-pressed', 'false'); chipHideRandom.classList.remove('active'); }
    apply();
  });
  chipHideRandom.addEventListener('click', () => {
    const pressed = chipHideRandom.getAttribute('aria-pressed') === 'true';
    chipHideRandom.setAttribute('aria-pressed', String(!pressed));
    chipHideRandom.classList.toggle('active', !pressed);
    if (!pressed) { chipOnlyRandom.setAttribute('aria-pressed', 'false'); chipOnlyRandom.classList.remove('active'); }
    apply();
  });
  chipAll.addEventListener('click', () => {
    for (const c of chips) c.setAttribute('aria-pressed', 'true');
    apply();
  });
  chipNone.addEventListener('click', () => {
    for (const c of chips) c.setAttribute('aria-pressed', 'false');
    apply();
  });
  apply();

  // --- Lightbox ---
  const lb = document.getElementById('lb');
  const lbBody = document.getElementById('lb-body');
  const lbTitle = document.getElementById('lb-title');
  const lbSub = document.getElementById('lb-sub');
  const lbPosTabs = document.getElementById('lb-pos-tabs');
  const lbState = { pairs: [], idx: 0, pos: 'left', mode: 'single', swipeR: 0.5 };

  function collectPairs() {
    // Gather pairs from currently visible rows in DOM order.
    const out = [];
    for (const row of document.querySelectorAll('.row')) {
      if (row.style.display === 'none') continue;
      const id = row.dataset.id;
      for (const pair of row.querySelectorAll('.pair[data-pair-id]')) {
        const figs = {};
        for (const f of pair.querySelectorAll('figure.fig[data-pos]')) {
          figs[f.dataset.pos] = f.dataset.src;
        }
        if (!figs.left && !figs.right && !figs.diff) continue;
        out.push({
          pairId: pair.dataset.pairId,
          rowId: id,
          phase: pair.dataset.phase,
          key: pair.querySelector('.pair-key')?.textContent ?? '',
          left: figs.left,
          right: figs.right,
          diff: figs.diff,
        });
      }
    }
    return out;
  }

  function openLightbox(pairId, pos) {
    lbState.pairs = collectPairs();
    lbState.idx = Math.max(0, lbState.pairs.findIndex((p) => p.pairId === pairId));
    lbState.pos = pos && lbState.pairs[lbState.idx]?.[pos] ? pos : ['left', 'right', 'diff'].find((k) => lbState.pairs[lbState.idx]?.[k]) ?? 'left';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    render();
  }
  function closeLightbox() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }
  function setMode(m) {
    lbState.mode = m;
    for (const t of lb.querySelectorAll('.lb-tab[data-mode]')) {
      t.setAttribute('aria-pressed', String(t.dataset.mode === m));
    }
    render();
  }
  function setPos(p) {
    if (!lbState.pairs[lbState.idx]?.[p]) return;
    lbState.pos = p;
    render();
  }
  function moveIdx(delta) {
    const next = lbState.idx + delta;
    if (next < 0 || next >= lbState.pairs.length) return;
    lbState.idx = next;
    if (!lbState.pairs[next][lbState.pos]) {
      lbState.pos = ['left', 'right', 'diff'].find((k) => lbState.pairs[next][k]) ?? 'left';
    }
    render();
  }

  function render() {
    const p = lbState.pairs[lbState.idx];
    if (!p) return;
    const [page, example, framework] = p.rowId.split('/');
    lbTitle.textContent = page + '/' + example;
    lbSub.textContent = '[' + framework + '] · ' + p.phase + ' · ' + p.key + ' · ' + (lbState.idx + 1) + '/' + lbState.pairs.length;

    // Position tabs (left / right / diff) — only show if image exists
    lbPosTabs.innerHTML = '';
    for (const pos of ['left', 'right', 'diff']) {
      if (!p[pos]) continue;
      const b = document.createElement('button');
      b.className = 'lb-tab';
      b.dataset.pos = pos;
      b.textContent = pos === 'left' ? ${JSON.stringify(data.sides.left.name)}
                    : pos === 'right' ? ${JSON.stringify(data.sides.right.name)}
                    : 'diff';
      b.setAttribute('aria-pressed', String(lbState.pos === pos));
      b.addEventListener('click', () => setPos(pos));
      lbPosTabs.appendChild(b);
    }

    if (lbState.mode === 'single') {
      lbBody.innerHTML = '';
      const stage = document.createElement('div');
      stage.className = 'lb-stage';
      const img = document.createElement('img');
      img.src = p[lbState.pos] ?? p.left ?? p.right ?? '';
      stage.appendChild(img);
      lbBody.appendChild(stage);
    } else if (lbState.mode === 'side') {
      lbBody.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.className = 'lb-side-by-side';
      for (const [pos, label] of [['left', ${JSON.stringify(data.sides.left.name)}], ['right', ${JSON.stringify(data.sides.right.name)}]]) {
        const c = document.createElement('div');
        const lbl = document.createElement('div');
        lbl.className = 'lb-label';
        lbl.textContent = label;
        c.appendChild(lbl);
        if (p[pos]) {
          const img = document.createElement('img');
          img.src = p[pos];
          c.appendChild(img);
        } else {
          const m = document.createElement('div');
          m.textContent = 'no screenshot';
          m.style.color = '#888';
          c.appendChild(m);
        }
        wrap.appendChild(c);
      }
      lbBody.appendChild(wrap);
    } else {
      // overlay or swipe — needs both left and right
      lbBody.innerHTML = '';
      if (!p.left || !p.right) {
        const m = document.createElement('div');
        m.style.color = '#aaa';
        m.textContent = 'Need both screenshots for ' + lbState.mode + ' mode — only one side has an image.';
        lbBody.appendChild(m);
        return;
      }
      const wrap = document.createElement('div');
      wrap.className = 'lb-compare-wrap';
      const cmp = document.createElement('div');
      cmp.className = 'lb-compare mode-' + lbState.mode;

      const imgB = document.createElement('img');
      imgB.className = 'lb-img-b';
      imgB.src = p.right;
      const imgA = document.createElement('img');
      imgA.className = 'lb-img-a';
      imgA.src = p.left;
      if (lbState.mode === 'overlay') {
        imgA.style.opacity = String(1 - lbState.swipeR);
      } else {
        imgA.style.opacity = '1';
        cmp.style.setProperty('--swipe-r', (lbState.swipeR * 100).toFixed(1) + '%');
      }

      cmp.appendChild(imgB);
      cmp.appendChild(imgA);

      const divider = document.createElement('div');
      divider.className = 'lb-divider';
      divider.style.left = (lbState.swipeR * 100).toFixed(1) + '%';
      cmp.appendChild(divider);

      wrap.appendChild(cmp);

      const controls = document.createElement('div');
      controls.className = 'lb-controls';
      const lbl = document.createElement('span');
      lbl.textContent = lbState.mode === 'overlay'
        ? 'A (left) opacity:'
        : 'Divider position:';
      const range = document.createElement('input');
      range.type = 'range';
      range.min = 0;
      range.max = 100;
      range.value = String(lbState.swipeR * 100);
      range.addEventListener('input', () => {
        lbState.swipeR = range.valueAsNumber / 100;
        if (lbState.mode === 'overlay') imgA.style.opacity = String(1 - lbState.swipeR);
        else {
          cmp.style.setProperty('--swipe-r', lbState.swipeR * 100 + '%');
          divider.style.left = lbState.swipeR * 100 + '%';
        }
      });
      controls.appendChild(lbl);
      controls.appendChild(range);
      const aLabel = document.createElement('span');
      aLabel.textContent = 'A = ' + ${JSON.stringify(data.sides.left.name)} + ' · B = ' + ${JSON.stringify(data.sides.right.name)};
      controls.appendChild(aLabel);

      lbBody.appendChild(wrap);
      lbBody.appendChild(controls);

      // Drag-to-swipe on the divider in swipe mode (also lets user click anywhere in the compare to set divider position).
      if (lbState.mode === 'swipe') {
        const onMove = (clientX) => {
          const rect = cmp.getBoundingClientRect();
          const r = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
          lbState.swipeR = r;
          range.value = String(r * 100);
          cmp.style.setProperty('--swipe-r', r * 100 + '%');
          divider.style.left = r * 100 + '%';
        };
        let dragging = false;
        cmp.addEventListener('mousedown', (ev) => { dragging = true; onMove(ev.clientX); ev.preventDefault(); });
        window.addEventListener('mousemove', (ev) => { if (dragging) onMove(ev.clientX); });
        window.addEventListener('mouseup', () => { dragging = false; });
      }
    }
  }

  // Click handler on any pair image
  document.addEventListener('click', (ev) => {
    const fig = ev.target.closest && ev.target.closest('figure.fig[data-pair-id]');
    if (!fig) return;
    ev.preventDefault();
    openLightbox(fig.dataset.pairId, fig.dataset.pos);
  });

  // Lightbox controls
  document.getElementById('lb-close').addEventListener('click', closeLightbox);
  for (const t of lb.querySelectorAll('.lb-tab[data-mode]')) {
    t.addEventListener('click', () => setMode(t.dataset.mode));
  }
  // Background click to close (only outside the body content)
  lb.addEventListener('click', (ev) => { if (ev.target === lb) closeLightbox(); });

  // Keyboard
  window.addEventListener('keydown', (ev) => {
    if (!lb.classList.contains('open')) return;
    if (ev.key === 'Escape') return closeLightbox();
    const positions = ['left', 'right', 'diff'].filter((k) => lbState.pairs[lbState.idx]?.[k]);
    const curPos = positions.indexOf(lbState.pos);
    if (ev.key === 'ArrowLeft') { ev.preventDefault(); if (positions.length) setPos(positions[(curPos - 1 + positions.length) % positions.length]); }
    else if (ev.key === 'ArrowRight') { ev.preventDefault(); if (positions.length) setPos(positions[(curPos + 1) % positions.length]); }
    else if (ev.key === 'ArrowDown') { ev.preventDefault(); moveIdx(1); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); moveIdx(-1); }
    else if (ev.key === '1') setMode('single');
    else if (ev.key === '2') setMode('side');
    else if (ev.key === '3' || ev.key.toLowerCase() === 'o') setMode('overlay');
    else if (ev.key === '4' || ev.key.toLowerCase() === 's') setMode('swipe');
    else if (ev.key.toLowerCase() === 'd') setPos('diff');
  });
</script>
</body></html>`;

writeFileSync(REPORT_PATH, html);
process.stderr.write(`Wrote report → ${REPORT_PATH}\n`);
