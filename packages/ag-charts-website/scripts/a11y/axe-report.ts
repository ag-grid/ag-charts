export type AxePassName = 'load' | 'focus';

export type AxeImpact = 'critical' | 'serious' | 'moderate' | 'minor';

export interface CompactNode {
    target: string[];
    html: string;
    failureSummary?: string;
    /** `null` when the target cannot be resolved in the top-level document (iframe or shadow DOM). */
    inChart: boolean | null;
}

export interface CompactViolation {
    id: string;
    impact: AxeImpact | null;
    help: string;
    helpUrl: string;
    nodes: CompactNode[];
}

export interface AxePassResult {
    pass: AxePassName;
    violations?: CompactViolation[];
    axeVersion?: string;
    error?: string;
}

export interface AxeExampleResult {
    page: string;
    example: string;
    framework: string;
    url: string;
    passes: AxePassResult[];
}

export interface AxeRuleExample {
    page: string;
    example: string;
    pass: AxePassName;
    url: string;
    nodes: CompactNode[];
}

export interface AxeRuleGroup {
    id: string;
    impact: AxeImpact | null;
    help: string;
    helpUrl: string;
    examples: AxeRuleExample[];
    exampleCount: number;
    nodeCount: number;
    inChartNodes: number;
    outsideChartNodes: number;
    byPass: Record<AxePassName, number>;
}

export interface AxeScanError {
    page: string;
    example: string;
    pass: AxePassName;
    url: string;
    error: string;
}

export interface AxeGroupedReport {
    examplesScanned: number;
    axeVersion: string | null;
    scanErrors: AxeScanError[];
    rules: AxeRuleGroup[];
}

const IMPACT_ORDER: Record<AxeImpact, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 };

function impactRank(impact: AxeImpact | null) {
    return impact == null ? Object.keys(IMPACT_ORDER).length : IMPACT_ORDER[impact];
}

export function groupAxeResults(entries: AxeExampleResult[]): AxeGroupedReport {
    const rules = new Map<string, AxeRuleGroup & { exampleKeys: Set<string> }>();
    const scanErrors: AxeScanError[] = [];
    let axeVersion: string | null = null;

    for (const entry of entries) {
        const exampleKey = `${entry.page}/${entry.example}`;
        for (const pass of entry.passes) {
            axeVersion ??= pass.axeVersion ?? null;
            if (pass.error != null) {
                scanErrors.push({
                    page: entry.page,
                    example: entry.example,
                    pass: pass.pass,
                    url: entry.url,
                    error: pass.error,
                });
                continue;
            }
            for (const violation of pass.violations ?? []) {
                let rule = rules.get(violation.id);
                if (rule == null) {
                    rule = {
                        id: violation.id,
                        impact: violation.impact,
                        help: violation.help,
                        helpUrl: violation.helpUrl,
                        examples: [],
                        exampleCount: 0,
                        nodeCount: 0,
                        inChartNodes: 0,
                        outsideChartNodes: 0,
                        byPass: { load: 0, focus: 0 },
                        exampleKeys: new Set(),
                    };
                    rules.set(violation.id, rule);
                }
                rule.examples.push({
                    page: entry.page,
                    example: entry.example,
                    pass: pass.pass,
                    url: entry.url,
                    nodes: violation.nodes,
                });
                rule.exampleKeys.add(exampleKey);
                rule.byPass[pass.pass] += 1;
                rule.nodeCount += violation.nodes.length;
                for (const node of violation.nodes) {
                    if (node.inChart === true) rule.inChartNodes += 1;
                    else if (node.inChart === false) rule.outsideChartNodes += 1;
                }
            }
        }
    }

    const grouped = Array.from(rules.values(), ({ exampleKeys, ...rule }) => ({
        ...rule,
        exampleCount: exampleKeys.size,
    }));
    grouped.sort((a, b) => {
        const byImpact = impactRank(a.impact) - impactRank(b.impact);
        return byImpact === 0 ? b.exampleCount - a.exampleCount : byImpact;
    });

    return { examplesScanned: entries.length, axeVersion, scanErrors, rules: grouped };
}

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function escapeHtml(value: unknown) {
    return String(value).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

function renderRule(rule: AxeRuleGroup) {
    const examples = rule.examples
        .map((ex) => {
            const nodes = ex.nodes
                .map(
                    (node) =>
                        `<li><code>${escapeHtml(node.target.join(' '))}</code>${node.inChart === false ? ' <em>(outside chart)</em>' : ''}<pre>${escapeHtml(node.html)}</pre></li>`
                )
                .join('');
            return `<li><a href="${escapeHtml(ex.url)}">${escapeHtml(`${ex.page}/${ex.example}`)}</a> (${escapeHtml(ex.pass)})<ul>${nodes}</ul></li>`;
        })
        .join('');
    return `<details><summary><a href="${escapeHtml(rule.helpUrl)}">${escapeHtml(rule.id)}</a> (${escapeHtml(rule.impact ?? 'unknown')}): ${escapeHtml(rule.help)}</summary><ul>${examples}</ul></details>`;
}

export function renderAxeReportHtml(report: AxeGroupedReport) {
    const rows = report.rules
        .map(
            (rule) =>
                `<tr><td>${escapeHtml(rule.id)}</td><td>${escapeHtml(rule.impact ?? 'unknown')}</td><td>${rule.exampleCount}</td><td>${rule.nodeCount}</td><td>${rule.inChartNodes} / ${rule.outsideChartNodes}</td></tr>`
        )
        .join('');
    const errors = report.scanErrors
        .map(
            (err) =>
                `<li><a href="${escapeHtml(err.url)}">${escapeHtml(`${err.page}/${err.example}`)}</a> (${escapeHtml(err.pass)}): ${escapeHtml(err.error)}</li>`
        )
        .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>AG Charts axe accessibility report</title>
<style>
body { font-family: sans-serif; margin: 2rem; }
table { border-collapse: collapse; }
th, td { border: 1px solid #ccc; padding: 0.25rem 0.5rem; text-align: left; }
pre { white-space: pre-wrap; background: #f5f5f5; padding: 0.25rem; }
</style>
</head>
<body>
<h1>AG Charts axe accessibility report</h1>
<p>${report.examplesScanned} examples scanned, ${report.rules.length} rules violated, ${report.scanErrors.length} scan errors (axe ${escapeHtml(report.axeVersion ?? 'unknown')}).</p>
<table>
<thead><tr><th>Rule</th><th>Impact</th><th>Examples</th><th>Nodes</th><th>In chart / outside</th></tr></thead>
<tbody>${rows}</tbody>
</table>
<h2>Rules</h2>
${report.rules.map(renderRule).join('\n')}
<h2>Scan errors</h2>
<ul>${errors}</ul>
</body>
</html>
`;
}

function escapeMarkdownCell(value: unknown) {
    return String(value)
        .replace(/\|/g, '\\|')
        .replace(/\s*\n\s*/g, ' ');
}

/** A short summary for a CI job summary page; the HTML report carries the per-node detail. */
export function renderAxeReportMarkdown(report: AxeGroupedReport) {
    const lines = [
        '## AG Charts axe accessibility report',
        '',
        `${report.examplesScanned} examples scanned, ${report.rules.length} rules violated, ${report.scanErrors.length} scan errors (axe ${escapeMarkdownCell(report.axeVersion ?? 'unknown')}). Report-only: findings do not fail CI.`,
    ];
    if (report.rules.length > 0) {
        lines.push(
            '',
            '| Rule | Impact | Examples | Nodes | In chart / outside |',
            '| --- | --- | --- | --- | --- |',
            ...report.rules.map(
                (rule) =>
                    `| [${escapeMarkdownCell(rule.id)}](${rule.helpUrl}) | ${escapeMarkdownCell(rule.impact ?? 'unknown')} | ${rule.exampleCount} | ${rule.nodeCount} | ${rule.inChartNodes} / ${rule.outsideChartNodes} |`
            )
        );
    }
    if (report.scanErrors.length > 0) {
        lines.push(
            '',
            '### Scan errors',
            '',
            ...report.scanErrors.map(
                (err) =>
                    `- ${escapeMarkdownCell(`${err.page}/${err.example}`)} (${err.pass}): ${escapeMarkdownCell(err.error)}`
            )
        );
    }
    return `${lines.join('\n')}\n`;
}
