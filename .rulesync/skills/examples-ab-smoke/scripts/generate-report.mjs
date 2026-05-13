// Generates report.html from results.json + (optional) triage-queue.json with verdicts.
//
// Run: node generate-report.mjs   (or set OUTPUT_DIR to point elsewhere)

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';

const OUTPUT_DIR = resolve(process.env.OUTPUT_DIR ?? '.');
const RESULTS_PATH = `${OUTPUT_DIR}/results.json`;
const TRIAGE_PATH = `${OUTPUT_DIR}/triage-queue.json`;
const REPORT_PATH = `${OUTPUT_DIR}/report.html`;

const data = JSON.parse(readFileSync(RESULTS_PATH, 'utf8'));
const triage = existsSync(TRIAGE_PATH) ? JSON.parse(readFileSync(TRIAGE_PATH, 'utf8')) : { items: [] };
const triageById = new Map(triage.items.map((t) => [t.id, t]));

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

function renderFigure(label, path) {
    if (!path) return `<figure><figcaption>${escapeHtml(label)}</figcaption><div class="missing">no screenshot</div></figure>`;
    return `<figure><figcaption>${escapeHtml(label)}</figcaption><a href="${rel(path)}" target="_blank"><img src="${rel(path)}" loading="lazy" /></a></figure>`;
}

function renderPhasePairs(entry, phaseName) {
    const lp = entry.left?.phases?.[phaseName];
    const rp = entry.right?.phases?.[phaseName];
    const pairs = pairScreenshots(lp, rp);
    if (!pairs.length) return '<div class="meta">no screenshots in this phase</div>';
    const blocks = pairs.map((p) => {
        const diffEntry = (lp?.imageDiffs ?? []).find((d) => d.key === p.key);
        const diffPercent = diffEntry?.percent;
        const diffPath = (lp?.exceptions ?? []).find((e) => e.key === p.key && (e.type === 'image-diff' || e.type === 'image-diff-major'))?.diffPath;
        const tag = p.label ? ` <span class="meta">${escapeHtml(p.label)}</span>` : '';
        const diffSummary = diffPercent != null
            ? `<span class="meta">diff ${(diffPercent * 100).toFixed(2)}%</span>`
            : '';
        return `
        <div class="pair">
          <div class="pair-head">${escapeHtml(p.key)}${tag} ${diffSummary}</div>
          <div class="ex-figs">
            ${renderFigure(data.sides.left.name, p.left)}
            ${renderFigure(data.sides.right.name, p.right)}
            ${diffPath ? renderFigure('diff', diffPath) : ''}
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
            <div class="ex-head">${escapeHtml(ex.phase ?? '-')} · ${escapeHtml(ex.type)} · <span class="meta">side: ${escapeHtml(ex.side ?? '-')}</span></div>
            <div>${renderExceptionDetail(ex)}</div>
          </div>`
              )
              .join('');

    const issueBlocks = issuePhases
        .map(
            (p) => `<details class="phase phase-issue" open>
          <summary><strong>${escapeHtml(p.name)}</strong> <span class="meta">issue</span></summary>
          <div class="phase-body">${renderPhasePairs(e, p.name)}</div>
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
                <div class="phase-body">${renderPhasePairs(e, p.name)}</div>
              </details>`
                  )
                  .join('')}
            </div>
          </details>`
        : '';

    return `<details class="row" data-status="${row.status}" data-id="${escapeHtml(id)}" ${open ? 'open' : ''}>
  <summary>
    <span class="badge b-${row.status}">${row.status}</span>
    <span><strong>${escapeHtml(e.page)}</strong>/${escapeHtml(e.example)} <span class="meta">[${escapeHtml(e.framework)}]</span></span>
    <span class="links">
      <a href="${escapeHtml(leftUrl)}#e2e=true" target="_blank">${escapeHtml(data.sides.left.name)} ↗</a>
      <a href="${escapeHtml(rightUrl)}#e2e=true" target="_blank">${escapeHtml(data.sides.right.name)} ↗</a>
    </span>
    <span class="meta" style="margin-left:auto">${row.exceptions.length} exception${row.exceptions.length === 1 ? '' : 's'}</span>
  </summary>
  <div class="body">
    ${exceptionGroups ? `<div class="exception-list">${exceptionGroups}</div>` : ''}
    ${issueBlocks}
    ${cleanBlock}
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
  body { font: 13px/1.4 -apple-system, system-ui, sans-serif; margin: 0; padding: 16px 20px; color: #222; }
  h1 { font-size: 20px; margin: 0 0 12px 0; }
  .summary { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; margin: 0 0 12px 0; padding: 10px 14px; background: #f4f5f7; border-radius: 6px; }
  .summary span { font-weight: 600; }
  .meta-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 0 0 18px 0; }
  .side-meta { padding: 10px 12px; background: #fafbfc; border: 1px solid #e1e3e6; border-radius: 6px; font-size: 12px; }
  .side-meta .side-meta-name { font-size: 13px; margin-bottom: 4px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
  .b-clean { background: #d8f3dc; color: #1b4332; }
  .b-untriaged { background: #ffe5b4; color: #6b3a00; }
  .b-triaged-benign { background: #cfe8fc; color: #084c8e; }
  .b-regression { background: #ffd6d6; color: #8a1414; }
  .b-needs-human { background: #ffe066; color: #5a3e00; }
  .b-error { background: #f5c2c7; color: #58151c; }
  .b-one-sided { background: #ead4ff; color: #4a148c; }
  .filters { display: flex; gap: 14px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
  .filters label { user-select: none; }
  input[type=text] { padding: 6px 10px; border: 1px solid #ccc; border-radius: 4px; min-width: 260px; }
  details.row { border: 1px solid #e1e3e6; border-radius: 6px; margin: 6px 0; padding: 0; background: #fff; }
  details.row > summary { cursor: pointer; padding: 8px 12px; font-weight: 500; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  details.row > .body { padding: 6px 14px 14px 14px; }
  .links { font-size: 12px; }
  .links a { color: #0656a8; text-decoration: none; margin-right: 10px; }
  .links a:hover { text-decoration: underline; }
  .exception-list { margin-bottom: 8px; }
  .exception { border-top: 1px solid #eee; padding: 8px 0; }
  .exception-list .exception:first-child { border-top: none; }
  .ex-head { font-weight: 600; font-size: 12px; }
  details.phase { border: 1px solid #ececec; border-radius: 4px; margin: 4px 0; }
  details.phase > summary { cursor: pointer; padding: 6px 10px; }
  details.phase-issue > summary { background: #fff5f5; }
  details.phase-clean > summary { background: #f6fcf7; }
  details.phase > .phase-body { padding: 6px 12px 10px 12px; }
  .phases-group { margin-top: 8px; border: 1px dashed #ccd; border-radius: 4px; }
  .phases-group > summary { cursor: pointer; padding: 6px 10px; color: #555; }
  .phases-group-body { padding: 4px 8px 8px 8px; }
  .pair { margin: 6px 0; }
  .pair-head { font-size: 11px; color: #666; margin-bottom: 4px; }
  .ex-figs { display: flex; gap: 10px; flex-wrap: wrap; margin: 4px 0 6px 0; }
  .ex-figs figure { margin: 0; }
  .ex-figs figcaption { font-size: 11px; color: #555; margin-bottom: 4px; }
  .ex-figs img { max-width: 320px; max-height: 200px; border: 1px solid #ddd; border-radius: 3px; cursor: zoom-in; }
  .ex-figs .missing { font-size: 11px; color: #aaa; padding: 16px; border: 1px dashed #ddd; border-radius: 3px; }
  pre { font-size: 11px; max-height: 180px; overflow: auto; background: #fafbfc; padding: 6px 8px; border: 1px solid #eee; border-radius: 3px; }
  code { background: #f4f5f7; padding: 1px 4px; border-radius: 3px; font-size: 11px; }
  .verdict { padding: 1px 6px; border-radius: 3px; font-weight: 600; font-size: 11px; }
  .v-regression { background: #ffd6d6; color: #8a1414; }
  .v-benign-cosmetic, .v-benign-flake { background: #cfe8fc; color: #084c8e; }
  .v-needs-human { background: #ffe066; color: #5a3e00; }
  .meta { color: #666; font-size: 11px; }
  .one-sided-panel { padding: 10px 14px; margin: 0 0 12px 0; background: #f7f3ff; border: 1px solid #e1d4f5; border-radius: 6px; font-size: 12px; }
  .one-sided-panel ul { margin: 4px 0 0 18px; padding: 0; columns: 2; }
</style></head><body>
<h1>AG Charts Examples A/B Smoke Report</h1>
<div class="meta-row">
  ${renderSideMeta('left', data.sides.left, data.sideMetadata?.left)}
  ${renderSideMeta('right', data.sides.right, data.sideMetadata?.right)}
</div>
<div class="summary">
  <span class="badge b-clean">${counts.clean} clean</span>
  <span class="badge b-untriaged">${counts.untriaged} untriaged</span>
  <span class="badge b-triaged-benign">${counts['triaged-benign']} triaged-benign</span>
  <span class="badge b-regression">${counts.regression} regression</span>
  <span class="badge b-needs-human">${counts['needs-human']} needs-human</span>
  <span class="badge b-error">${counts.error} runner-error</span>
  <span class="badge b-one-sided">${counts['one-sided']} one-sided</span>
  <span style="color:#666">total: ${data.results.length}</span>
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
<div class="filters">
  <input type="text" id="filter" placeholder="filter by page/example/framework">
  <label><input type="checkbox" data-status="regression" checked> regression</label>
  <label><input type="checkbox" data-status="needs-human" checked> needs-human</label>
  <label><input type="checkbox" data-status="untriaged" checked> untriaged</label>
  <label><input type="checkbox" data-status="error" checked> error</label>
  <label><input type="checkbox" data-status="one-sided" checked> one-sided</label>
  <label><input type="checkbox" data-status="triaged-benign"> triaged-benign</label>
  <label><input type="checkbox" data-status="clean"> clean</label>
</div>
<div id="rows">
${rows.map(renderRow).join('\n')}
</div>
<script>
  const filter = document.getElementById('filter');
  const checks = [...document.querySelectorAll('.filters input[type=checkbox]')];
  function apply() {
    const q = filter.value.toLowerCase().trim();
    const enabled = new Set(checks.filter((c) => c.checked).map((c) => c.dataset.status));
    for (const row of document.querySelectorAll('.row')) {
      const visible = (!q || row.dataset.id.toLowerCase().includes(q)) && enabled.has(row.dataset.status);
      row.style.display = visible ? '' : 'none';
    }
  }
  filter.addEventListener('input', apply);
  for (const c of checks) c.addEventListener('change', apply);
  apply();
</script>
</body></html>`;

writeFileSync(REPORT_PATH, html);
process.stderr.write(`Wrote report → ${REPORT_PATH}\n`);
