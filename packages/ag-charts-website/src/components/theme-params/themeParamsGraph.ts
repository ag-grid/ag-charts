/**
 * Builds the theme params reference from the library's own theme defaults, so the page cannot drift from runtime
 * behaviour. Inputs are the raw (unresolved) public param defaults and the per-series theme templates, both of which
 * express inheritance as `{ $ref: '<param>' }` operations.
 */

type PlainObject = Record<string, unknown>;

export interface ParamOptionUsage {
    /** Option path relative to the chart options, e.g. `axes.number.label.color`. */
    path: string;
    /** Series types whose theme template sets this path from the param. */
    seriesTypes: string[];
    /** `false` when the param is only one input to a computed value, e.g. a colour blend. */
    direct: boolean;
}

export interface ThemeParamNode {
    name: string;
    /** Human-readable default, e.g. `textColor` or `textColor 62% + chartBackgroundColor 38%`. */
    defaultText: string;
    /** `true` when the default is a fixed value rather than derived from other params. */
    isRoot: boolean;
    /** Params this param's default is derived from, primary parent first. */
    parents: string[];
    /** Params whose defaults are derived from this one. */
    children: string[];
    /** Option paths whose theme defaults reference this param directly. */
    options: ParamOptionUsage[];
    /** Unique option paths affected by changing this param, including through descendants. */
    totalOptionCount: number;
    /** CSS custom property the chart exposes for the param. */
    cssVariable: string;
    /** Inheritance chain from this param up to its root, following primary parents. */
    chain: string[];
}

export interface ThemeParamsGraph {
    params: Map<string, ThemeParamNode>;
    seriesTypeCount: number;
}

const isPlainObject = (value: unknown): value is PlainObject =>
    value != null && typeof value === 'object' && !Array.isArray(value);

const operatorKey = (value: PlainObject): string | undefined => {
    const keys = Object.keys(value);
    return keys.length === 1 && keys[0].startsWith('$') ? keys[0] : undefined;
};

/** Params an operation reads, in the order they appear. `$foregroundBackgroundMix` and `$rem` read params implicitly. */
export function collectRefs(value: unknown, out: string[] = []): string[] {
    if (Array.isArray(value)) {
        for (const item of value) collectRefs(item, out);
        return out;
    }
    if (!isPlainObject(value)) return out;

    const op = operatorKey(value);
    if (op === '$ref' && typeof value.$ref === 'string') {
        out.push(value.$ref);
    } else if (op === '$foregroundBackgroundMix') {
        out.push('foregroundColor', 'backgroundColor');
    } else if (op === '$rem') {
        const [, param] = Array.isArray(value.$rem) ? value.$rem : [];
        out.push(typeof param === 'string' ? param : 'fontSize');
    } else {
        for (const child of Object.values(value)) collectRefs(child, out);
    }
    return out;
}

const percent = (ratio: number) => `${Math.round(ratio * 100)}%`;

const formatNumber = (value: number) => String(Math.round(value * 100) / 100);

/** Renders a param default operation as short, readable text. */
export function formatDefault(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return value.map(formatDefault).join(', ');
    if (!isPlainObject(value)) return String(value);

    const op = operatorKey(value);
    const args = op == null ? undefined : value[op];
    switch (op) {
        case '$ref':
            return String(args);
        case '$mix': {
            const [a, b, ratio] = args as [unknown, unknown, number];
            return `${formatDefault(a)} ${percent(1 - ratio)} + ${formatDefault(b)} ${percent(ratio)}`;
        }
        case '$foregroundBackgroundMix': {
            const ratio = args as number;
            return `foregroundColor ${percent(ratio)} + backgroundColor ${percent(1 - ratio)}`;
        }
        case '$rem': {
            const [ratio, param] = Array.isArray(args) ? args : [args];
            return `${typeof param === 'string' ? param : 'fontSize'} × ${formatNumber(ratio as number)}`;
        }
        case '$multiply': {
            const [a, b] = args as [unknown, unknown];
            return `${formatDefault(a)} × ${formatDefault(b)}`;
        }
        case undefined:
            // Composite params such as `buttonBorder: { color, width }`.
            return Object.keys(value)
                .map((key) => `${key}: ${formatDefault(value[key])}`)
                .join(', ');
        default: {
            const refs = [...new Set(collectRefs(value))];
            return refs.length > 0 ? `computed from ${refs.join(', ')}` : JSON.stringify(value);
        }
    }
}

const kebabCase = (name: string) => name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);

/**
 * Walks a theme template, recording every option path whose default references a param. Operator arguments are
 * descended into without extending the path, so `{ fill: { $mix: [{ $ref: 'a' }, ...] } }` records `fill` for `a`.
 */
export function collectOptionRefs(
    template: unknown,
    visit: (path: string, param: string, direct: boolean) => void,
    path: string[] = [],
    insideOperation = false
) {
    if (Array.isArray(template)) {
        for (const item of template) collectOptionRefs(item, visit, path, insideOperation);
        return;
    }
    if (!isPlainObject(template)) return;

    const op = operatorKey(template);
    if (op === '$ref') {
        if (typeof template.$ref === 'string' && path.length > 0) {
            visit(path.join('.'), template.$ref, !insideOperation);
        }
        return;
    }
    if (op != null) {
        collectOptionRefs(template[op], visit, path, true);
        return;
    }
    for (const key of Object.keys(template)) {
        if (key.startsWith('$')) continue;
        collectOptionRefs(template[key], visit, [...path, key], false);
    }
}

export function buildThemeParamsGraph(
    defaults: PlainObject,
    templatesBySeriesType: Record<string, unknown>
): ThemeParamsGraph {
    const names = Object.keys(defaults);
    const publicNames = new Set(names);
    const params = new Map<string, ThemeParamNode>();

    for (const name of names) {
        const raw = defaults[name];
        const parents = [...new Set(collectRefs(raw))].filter((parent) => publicNames.has(parent) && parent !== name);
        params.set(name, {
            name,
            defaultText: formatDefault(raw),
            isRoot: parents.length === 0,
            parents,
            children: [],
            options: [],
            totalOptionCount: 0,
            cssVariable: `--ag-charts-${kebabCase(name)}`,
            chain: [],
        });
    }

    for (const node of params.values()) {
        for (const parent of node.parents) params.get(parent)!.children.push(node.name);
    }

    // Option usages, merged across series types.
    const usages = new Map<string, Map<string, { seriesTypes: Set<string>; direct: boolean }>>();
    const seriesTypes = Object.keys(templatesBySeriesType);
    for (const seriesType of seriesTypes) {
        collectOptionRefs(templatesBySeriesType[seriesType], (path, param, direct) => {
            if (!publicNames.has(param)) return;
            let byPath = usages.get(param);
            if (byPath == null) {
                byPath = new Map();
                usages.set(param, byPath);
            }
            const usage = byPath.get(path);
            if (usage == null) {
                byPath.set(path, { seriesTypes: new Set([seriesType]), direct });
            } else {
                usage.seriesTypes.add(seriesType);
                usage.direct ||= direct;
            }
        });
    }
    for (const [param, byPath] of usages) {
        params.get(param)!.options = [...byPath.entries()]
            .map(([path, { seriesTypes: types, direct }]) => ({ path, seriesTypes: [...types].sort(), direct }))
            .sort((a, b) => a.path.localeCompare(b.path));
    }

    for (const node of params.values()) {
        node.chain = primaryChain(params, node.name);
        node.totalOptionCount = collectDescendantPaths(params, node.name).size;
    }

    return { params, seriesTypeCount: seriesTypes.length };
}

/** `[name, primaryParent, grandparent, ...]`, stopping on a cycle rather than looping. */
function primaryChain(params: Map<string, ThemeParamNode>, name: string): string[] {
    const chain: string[] = [];
    let current: string | undefined = name;
    while (current != null && !chain.includes(current)) {
        chain.push(current);
        current = params.get(current)?.parents[0];
    }
    return chain;
}

function collectDescendantPaths(params: Map<string, ThemeParamNode>, name: string): Set<string> {
    const paths = new Set<string>();
    const seen = new Set<string>();
    const stack = [name];
    while (stack.length > 0) {
        const current = stack.pop()!;
        if (seen.has(current)) continue;
        seen.add(current);
        const node = params.get(current);
        if (node == null) continue;
        for (const option of node.options) paths.add(option.path);
        stack.push(...node.children);
    }
    return paths;
}

/** Tree path for the grid: root first, following primary parents. */
export const treePath = (node: ThemeParamNode) => [...node.chain].reverse();
