// Generates report.html from results.json + (optional) triage-queue.json with verdicts.
// Output focus: exceptions. Verified-clean rows are collapsed by default.
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

function classifyEntry(entry) {
    if (entry.error) return { status: 'error', exceptions: [{ type: 'runner-error', error: entry.error }] };
    const exceptions = [];
    for (const sideKey of ['left', 'right']) {
        const side = entry[sideKey];
        if (!side?.phases) continue;
        for (const [phaseName, phase] of Object.entries(side.phases)) {
            for (const ex of phase.exceptions ?? []) {
                exceptions.push({ side: sideKey, phase: phaseName, ...ex });
            }
        }
    }
    if (exceptions.length === 0) return { status: 'clean', exceptions };
    const verdicts = exceptions.map((ex) => ex.triage?.verdict).filter(Boolean);
    if (verdicts.length === exceptions.length && verdicts.every((v) => v.startsWith('benign'))) {
        return { status: 'triaged-benign', exceptions };
    }
    if (verdicts.some((v) => v === 'regression')) return { status: 'regression', exceptions };
    // Untriaged `image-diff-major` defaults to `regression`.
    if (exceptions.some((ex) => ex.type === 'image-diff-major' && !ex.triage)) return { status: 'regression', exceptions };
    if (verdicts.some((v) => v === 'needs-human')) return { status: 'needs-human', exceptions };
    return { status: 'untriaged', exceptions };
}

const counts = { clean: 0, untriaged: 0, 'triaged-benign': 0, regression: 0, 'needs-human': 0, error: 0 };
const rows = [];

for (const entry of data.results) {
    const c = classifyEntry(entry);
    counts[c.status]++;
    rows.push({ entry, ...c });
}

const total = data.results.length;

function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function exceptionEvidence(ex, entry) {
    const lp = entry.left?.phases?.[ex.phase];
    const rp = entry.right?.phases?.[ex.phase];
    const findScreenshot = (phase) => {
        if (!phase?.screenshots) return null;
        if (ex.key) {
            const m = phase.screenshots.find((s) => (s.buttonIndex != null ? `${s.phase}#${s.buttonIndex}` : s.phase) === ex.key);
            if (m) return m.path;
        }
        return phase.screenshots[0]?.path;
    };
    const left = findScreenshot(lp);
    const right = findScreenshot(rp);
    const diff = ex.diffPath;

    const imgs = [];
    if (left) imgs.push(`<figure><figcaption>${escapeHtml(data.sides.left.name)}</figcaption><a href="${rel(left)}" target="_blank"><img src="${rel(left)}" /></a></figure>`);
    if (right) imgs.push(`<figure><figcaption>${escapeHtml(data.sides.right.name)}</figcaption><a href="${rel(right)}" target="_blank"><img src="${rel(right)}" /></a></figure>`);
    if (diff) imgs.push(`<figure><figcaption>diff</figcaption><a href="${rel(diff)}" target="_blank"><img src="${rel(diff)}" /></a></figure>`);
    return imgs.join('');
}

function exceptionDetail(ex) {
    const bits = [];
    if (ex.percent != null) bits.push(`${(ex.percent * 100).toFixed(2)}% pixels changed (${ex.changed}/${ex.total})`);
    if (ex.label) bits.push(`button: <code>${escapeHtml(ex.label)}</code>`);
    if (ex.httpStatus) bits.push(`HTTP ${ex.httpStatus}`);
    if (ex.error) bits.push(`<code>${escapeHtml(ex.error)}</code>`);
    if (ex.newCount) bits.push(`+${ex.newCount} console errors`);
    if (ex.newConsoleErrors) bits.push(`<details><summary>console errors</summary><pre>${escapeHtml(ex.newConsoleErrors.join('\n'))}</pre></details>`);
    if (ex.triage) bits.push(`<span class="verdict v-${ex.triage.verdict}">${escapeHtml(ex.triage.verdict)}</span>: ${escapeHtml(ex.triage.reason)}`);
    return bits.join(' · ');
}

const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>AG Charts Examples A/B Smoke Report</title>
<style>
  body { font: 13px/1.4 -apple-system, system-ui, sans-serif; margin: 0; padding: 16px 20px; color: #222; }
  h1 { font-size: 20px; margin: 0 0 12px 0; }
  .summary { display: flex; gap: 14px; flex-wrap: wrap; margin: 0 0 18px 0; padding: 10px 14px; background: #f4f5f7; border-radius: 6px; }
  .summary span { font-weight: 600; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
  .b-clean { background: #d8f3dc; color: #1b4332; }
  .b-untriaged { background: #ffe5b4; color: #6b3a00; }
  .b-triaged-benign { background: #cfe8fc; color: #084c8e; }
  .b-regression { background: #ffd6d6; color: #8a1414; }
  .b-needs-human { background: #ffe066; color: #5a3e00; }
  .b-error { background: #f5c2c7; color: #58151c; }
  .filters { display: flex; gap: 14px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
  .filters label { user-select: none; }
  input[type=text] { padding: 6px 10px; border: 1px solid #ccc; border-radius: 4px; min-width: 260px; }
  details.row { border: 1px solid #e1e3e6; border-radius: 6px; margin: 6px 0; padding: 0; background: #fff; }
  details.row > summary { cursor: pointer; padding: 8px 12px; font-weight: 500; display: flex; gap: 10px; align-items: center; }
  details.row > .body { padding: 6px 14px 14px 14px; }
  .exception { border-top: 1px solid #eee; padding: 10px 0; }
  .exception:first-child { border-top: none; }
  .ex-head { font-weight: 600; font-size: 12px; }
  .ex-figs { display: flex; gap: 10px; flex-wrap: wrap; margin: 8px 0 6px 0; }
  .ex-figs figure { margin: 0; }
  .ex-figs figcaption { font-size: 11px; color: #555; margin-bottom: 4px; }
  .ex-figs img { max-width: 320px; max-height: 200px; border: 1px solid #ddd; border-radius: 3px; cursor: zoom-in; }
  pre { font-size: 11px; max-height: 180px; overflow: auto; background: #fafbfc; padding: 6px 8px; border: 1px solid #eee; border-radius: 3px; }
  code { background: #f4f5f7; padding: 1px 4px; border-radius: 3px; font-size: 11px; }
  .verdict { padding: 1px 6px; border-radius: 3px; font-weight: 600; font-size: 11px; }
  .v-regression { background: #ffd6d6; color: #8a1414; }
  .v-benign-cosmetic, .v-benign-flake { background: #cfe8fc; color: #084c8e; }
  .v-needs-human { background: #ffe066; color: #5a3e00; }
  .meta { color: #666; font-size: 11px; }
</style></head><body>
<h1>AG Charts Examples A/B Smoke Report</h1>
<div class="summary">
  <span class="badge b-clean">${counts.clean} clean</span>
  <span class="badge b-untriaged">${counts.untriaged} untriaged</span>
  <span class="badge b-triaged-benign">${counts['triaged-benign']} triaged-benign</span>
  <span class="badge b-regression">${counts.regression} regression</span>
  <span class="badge b-needs-human">${counts['needs-human']} needs-human</span>
  <span class="badge b-error">${counts.error} runner-error</span>
  <span style="color:#666">total: ${total}</span>
  <span style="color:#666">left: ${escapeHtml(data.sides.left.name)} (${escapeHtml(data.sides.left.baseUrl)})</span>
  <span style="color:#666">right: ${escapeHtml(data.sides.right.name)} (${escapeHtml(data.sides.right.baseUrl)})</span>
</div>
<div class="filters">
  <input type="text" id="filter" placeholder="filter by page/example/framework">
  <label><input type="checkbox" data-status="regression" checked> regression</label>
  <label><input type="checkbox" data-status="needs-human" checked> needs-human</label>
  <label><input type="checkbox" data-status="untriaged" checked> untriaged</label>
  <label><input type="checkbox" data-status="error" checked> error</label>
  <label><input type="checkbox" data-status="triaged-benign"> triaged-benign</label>
  <label><input type="checkbox" data-status="clean"> clean</label>
</div>
<div id="rows">
${rows
    .map((row) => {
        const e = row.entry;
        const id = `${e.page}/${e.example}/${e.framework}`;
        const open = ['regression', 'needs-human', 'untriaged', 'error'].includes(row.status);
        return `<details class="row" data-status="${row.status}" data-id="${escapeHtml(id)}" ${open ? 'open' : ''}>
  <summary>
    <span class="badge b-${row.status}">${row.status}</span>
    <span><strong>${escapeHtml(e.page)}</strong>/${escapeHtml(e.example)} <span class="meta">[${escapeHtml(e.framework)}]</span></span>
    <span class="meta" style="margin-left:auto">${row.exceptions.length} exception${row.exceptions.length === 1 ? '' : 's'}</span>
  </summary>
  <div class="body">
    ${row.exceptions
        .map(
            (ex) => `<div class="exception">
      <div class="ex-head">${escapeHtml(ex.phase ?? '-')} · ${escapeHtml(ex.type)} · <span class="meta">side: ${escapeHtml(ex.side ?? '-')}</span></div>
      <div>${exceptionDetail(ex)}</div>
      <div class="ex-figs">${exceptionEvidence(ex, e)}</div>
    </div>`
        )
        .join('')}
  </div>
</details>`;
    })
    .join('\n')}
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
