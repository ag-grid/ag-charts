/**
 * Test-only evaluator for the Apache directive subset the generated `.htaccess` emits, so its
 * tests can assert behaviour - status, Location, the file served and the response headers - for a
 * request, rather than restating the rule text.
 *
 * Modelled on Apache 2.4 as observed against the generated files (mod_rewrite, mod_dir,
 * mod_headers, mod_mime, ErrorDocument):
 * - Rewrite rules run per-directory: the pattern sees the path below the `.htaccess` directory
 *   (the deployed base), and the base's own slash-less URL is skipped unless `RewriteOptions
 *   AllowNoSlash` is set. An internal rewrite re-runs the rules on the new URI.
 * - A rule whose conditions test `HTTP_ACCEPT` adds `Vary: Accept` when it applies.
 * - A redirect target is escaped (`#` becomes `%23`) unless the rule carries `[NE]`.
 * - mod_dir serves `<dir>/index.html` for a slashed directory URL as an internal redirect, so the
 *   rules and every `<If>` see `…/index.html`; a slash-less directory URL gets mod_dir's slash
 *   redirect on the requesting host.
 * - A 404 is served from the ErrorDocument as an internal redirect: REQUEST_URI becomes the error
 *   document's path and REQUEST_STATUS stays 404.
 * - `Header` without `always` applies to 2xx and ErrorDocument responses only; `always` applies to
 *   every response, redirects included. `<If>` sections apply after every other directive in the
 *   file, whatever their position (Apache's section merge order).
 *
 * Only the child `.htaccess` is evaluated. Directives the grid root `.htaccess` adds for this path
 * (its own headers, archive caching) are out of scope, and are the root's to test. Any directive
 * or flag outside the supported subset throws, so a new kind of rule cannot pass unexamined.
 */

export interface SimulatedRequest {
    /** Defaults to the canonical `www.ag-grid.com`. */
    host?: string;
    /** REQUEST_URI: the full path, without a query string. */
    uri: string;
    /** The Accept request header, if any. */
    accept?: string;
}

export interface SimulatedSite {
    htaccess: string;
    /** The directory holding the `.htaccess`, without a trailing slash, e.g. `/charts`. */
    basePath: string;
    /** Document-root-relative paths of the files on disk, e.g. `/charts/react/bar-series/index.html`. */
    files?: Iterable<string>;
}

export interface SimulatedResponse {
    status: number;
    location?: string;
    /** The file whose body is sent: after rewrites, DirectoryIndex and ErrorDocument. */
    servedFile?: string;
    contentType?: string;
    /** Response headers set by this `.htaccess`, keyed by lower-case name. */
    headers: Record<string, string>;
}

export const DEFAULT_HOST = 'www.ag-grid.com';

// Apache's own body for a redirect or a status it generates itself.
const APACHE_GENERATED_CONTENT_TYPE = 'text/html; charset=iso-8859-1';

const BUILT_IN_TYPES: Record<string, string> = {
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    svg: 'image/svg+xml',
    txt: 'text/plain',
    xml: 'application/xml',
    mp4: 'video/mp4',
    woff2: 'font/woff2',
};

interface Condition {
    test: string;
    pattern: string;
    flags: string[];
}

interface Rule {
    pattern: string;
    substitution: string;
    flags: string[];
    conditions: Condition[];
}

interface HeaderDirective {
    always: boolean;
    action: 'set' | 'append' | 'unset' | 'merge';
    name: string;
    value?: string;
    expr?: string;
}

interface ParsedHtaccess {
    rules: Rule[];
    allowNoSlash: boolean;
    errorDocuments: Map<number, string>;
    types: Map<string, string>;
    charsets: Map<string, string>;
    /** Headers outside any `<If>`, then each `<If>` with its headers, in file order. */
    headers: HeaderDirective[];
    ifSections: { expr: string; headers: HeaderDirective[] }[];
}

/** Split a directive line into arguments, honouring double quotes and backslash escapes. */
function tokenize(line: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inQuotes = false;
    let hasToken = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '\\' && i + 1 < line.length && (line[i + 1] === '"' || line[i + 1] === '\\')) {
            current += line[++i];
            hasToken = true;
        } else if (ch === '"') {
            inQuotes = !inQuotes;
            hasToken = true;
        } else if (!inQuotes && /\s/.test(ch)) {
            if (hasToken) {
                tokens.push(current);
            }
            current = '';
            hasToken = false;
        } else {
            current += ch;
            hasToken = true;
        }
    }
    if (inQuotes) {
        throw new Error(`Unbalanced quotes in: ${line}`);
    }
    if (hasToken) {
        tokens.push(current);
    }
    return tokens;
}

const flagList = (token: string | undefined): string[] => {
    if (token == null) {
        return [];
    }
    if (!/^\[.*\]$/.test(token)) {
        throw new Error(`Expected a [flags] argument, got: ${token}`);
    }
    return token.slice(1, -1).split(',');
};

function parseHeader(args: string[], line: string): HeaderDirective {
    let i = 0;
    let always = false;
    if (args[i] === 'always' || args[i] === 'onsuccess') {
        always = args[i] === 'always';
        i++;
    }
    const action = args[i++];
    if (action !== 'set' && action !== 'append' && action !== 'unset' && action !== 'merge') {
        throw new Error(`Unsupported Header action: ${line}`);
    }
    const name = args[i++];
    const value = action === 'unset' ? undefined : args[i++];
    let expr: string | undefined;
    const rest = args.slice(i);
    if (rest.length === 1 && rest[0].startsWith('expr=')) {
        expr = rest[0].slice('expr='.length);
    } else if (rest.length > 0) {
        throw new Error(`Unsupported Header arguments: ${line}`);
    }
    return { always, action, name: name.toLowerCase(), value, expr };
}

function parseHtaccess(htaccess: string): ParsedHtaccess {
    const parsed: ParsedHtaccess = {
        rules: [],
        allowNoSlash: false,
        errorDocuments: new Map(),
        types: new Map(),
        charsets: new Map(),
        headers: [],
        ifSections: [],
    };
    let pendingConditions: Condition[] = [];
    let currentIf: { expr: string; headers: HeaderDirective[] } | undefined;
    const containers: string[] = [];

    for (const raw of htaccess.split('\n')) {
        const line = raw.trim();
        if (line === '' || line.startsWith('#')) {
            continue;
        }
        const ifOpen = line.match(/^<If\s+"(.*)">$/);
        if (ifOpen) {
            if (currentIf) {
                throw new Error('Nested <If> sections are not supported');
            }
            currentIf = { expr: ifOpen[1], headers: [] };
            containers.push('If');
            continue;
        }
        if (/^<IfModule\s+mod_(rewrite|headers|mime|dir)\.c>$/.test(line)) {
            containers.push('IfModule');
            continue;
        }
        const close = line.match(/^<\/(If|IfModule)>$/);
        if (close) {
            if (containers.pop() !== close[1]) {
                throw new Error(`Mismatched </${close[1]}>`);
            }
            if (close[1] === 'If') {
                parsed.ifSections.push(currentIf!);
                currentIf = undefined;
            }
            continue;
        }
        if (line.startsWith('<')) {
            throw new Error(`Unsupported section: ${line}`);
        }

        const [directive, ...args] = tokenize(line);
        if (currentIf && directive !== 'Header') {
            throw new Error(`Only Header directives are supported inside <If>: ${line}`);
        }
        switch (directive) {
            case 'RewriteEngine':
            case 'Options':
                break;
            case 'RewriteOptions':
                if (args.join(' ') !== 'AllowNoSlash') {
                    throw new Error(`Unsupported RewriteOptions: ${line}`);
                }
                parsed.allowNoSlash = true;
                break;
            case 'RewriteCond':
                pendingConditions.push({ test: args[0], pattern: args[1], flags: flagList(args[2]) });
                break;
            case 'RewriteRule':
                parsed.rules.push({
                    pattern: args[0],
                    substitution: args[1],
                    flags: flagList(args[2]),
                    conditions: pendingConditions,
                });
                pendingConditions = [];
                break;
            case 'ErrorDocument':
                parsed.errorDocuments.set(Number(args[0]), args[1]);
                break;
            case 'AddType':
                for (const ext of args.slice(1)) {
                    parsed.types.set(ext.replace(/^\./, ''), args[0]);
                }
                break;
            case 'AddCharset':
                for (const ext of args.slice(1)) {
                    parsed.charsets.set(ext.replace(/^\./, ''), args[0]);
                }
                break;
            case 'Header':
                (currentIf ? currentIf.headers : parsed.headers).push(parseHeader(args, line));
                break;
            default:
                throw new Error(`Unsupported directive: ${line}`);
        }
    }
    if (containers.length > 0 || pendingConditions.length > 0) {
        throw new Error('Unterminated section or RewriteCond without a RewriteRule');
    }
    return parsed;
}

// ---------------------------------------------------------------------------------------------
// ap_expr: the subset used in <If> and Header expr= (comparisons on %{VAR}, && || ! and parens).

type ExprVars = Record<string, string>;

function evaluateExpr(source: string, vars: ExprVars): boolean {
    let pos = 0;
    const skipSpace = () => {
        while (pos < source.length && /\s/.test(source[pos])) {
            pos++;
        }
    };
    const peek = (token: string) => {
        skipSpace();
        return source.startsWith(token, pos);
    };
    const expect = (token: string) => {
        if (!peek(token)) {
            throw new Error(`Expected "${token}" at ${pos} in: ${source}`);
        }
        pos += token.length;
    };

    const parseOperand = (): string | RegExp => {
        skipSpace();
        const variable = source.slice(pos).match(/^%\{([A-Z_]+)\}/);
        if (variable) {
            pos += variable[0].length;
            if (!(variable[1] in vars)) {
                throw new Error(`Unsupported expression variable: ${variable[1]}`);
            }
            return vars[variable[1]];
        }
        if (source[pos] === 'm' && /[#/|]/.test(source[pos + 1])) {
            const delimiter = source[pos + 1];
            const end = source.indexOf(delimiter, pos + 2);
            const body = source.slice(pos + 2, end);
            pos = end + 1;
            const flags = source.slice(pos).match(/^i/) ? 'i' : '';
            pos += flags.length;
            return new RegExp(body, flags);
        }
        const quoted = source.slice(pos).match(/^'([^']*)'/);
        if (quoted) {
            pos += quoted[0].length;
            return quoted[1];
        }
        const number = source.slice(pos).match(/^-?\d+/);
        if (number) {
            pos += number[0].length;
            return number[0];
        }
        throw new Error(`Unsupported expression operand at ${pos} in: ${source}`);
    };

    const parseComparison = (): boolean => {
        const left = parseOperand();
        skipSpace();
        const op = ['=~', '!~', '==', '!='].find((candidate) => source.startsWith(candidate, pos));
        if (op == null) {
            throw new Error(`Unsupported expression operator at ${pos} in: ${source}`);
        }
        pos += op.length;
        const right = parseOperand();
        if (typeof left !== 'string') {
            throw new Error(`A regex must be on the right of a comparison: ${source}`);
        }
        if (op === '=~' || op === '!~') {
            if (!(right instanceof RegExp)) {
                throw new Error(`=~ needs a regex: ${source}`);
            }
            return right.test(left) === (op === '=~');
        }
        return (left === right) === (op === '==');
    };

    const parseUnary = (): boolean => {
        if (peek('!') && !peek('!~') && !peek('!=')) {
            pos++;
            return !parseUnary();
        }
        if (peek('(')) {
            pos++;
            const value = parseOr();
            expect(')');
            return value;
        }
        return parseComparison();
    };
    const parseAnd = (): boolean => {
        let value = parseUnary();
        while (peek('&&')) {
            pos += 2;
            value = parseUnary() && value;
        }
        return value;
    };
    const parseOr = (): boolean => {
        let value = parseAnd();
        while (peek('||')) {
            pos += 2;
            value = parseAnd() || value;
        }
        return value;
    };

    const result = parseOr();
    skipSpace();
    if (pos !== source.length) {
        throw new Error(`Unparsed expression tail at ${pos} in: ${source}`);
    }
    return result;
}

// ---------------------------------------------------------------------------------------------
// mod_rewrite

type RewriteResult =
    | { kind: 'none' }
    | { kind: 'gone' }
    | { kind: 'forbidden' }
    | { kind: 'redirect'; status: number; location: string }
    | { kind: 'internal'; uri: string };

const SUPPORTED_RULE_FLAGS = /^(L|NE|G|F|NC|R=30[12378])$/;
const SUPPORTED_COND_FLAGS = /^(NC|OR)$/;

function substitute(
    template: string,
    vars: (name: string) => string,
    ruleMatch: RegExpMatchArray,
    condMatch: RegExpMatchArray | null
) {
    return template
        .replace(/%\{([A-Z_]+)\}/g, (_, name: string) => vars(name))
        .replace(/\$(\d)/g, (_, n: string) => ruleMatch[Number(n)] ?? '')
        .replace(/%(\d)/g, (_, n: string) => condMatch?.[Number(n)] ?? '');
}

function runRewrite(
    parsed: ParsedHtaccess,
    basePath: string,
    request: Required<Pick<SimulatedRequest, 'host'>> & SimulatedRequest,
    uri: string,
    fs: SimulatedFs,
    varyHeaders: Set<string>
): RewriteResult {
    let relative: string | null = null;
    if (uri === basePath) {
        relative = parsed.allowNoSlash ? '' : null;
    } else if (uri.startsWith(`${basePath}/`)) {
        relative = uri.slice(basePath.length + 1);
    }
    if (relative == null) {
        return { kind: 'none' };
    }

    const serverVar = (name: string): string => {
        switch (name) {
            case 'HTTP_HOST':
                return request.host;
            case 'REQUEST_URI':
                return uri;
            case 'HTTP_ACCEPT':
                return request.accept ?? '';
            case 'DOCUMENT_ROOT':
                return '';
            case 'REQUEST_FILENAME':
                return uri;
            default:
                throw new Error(`Unsupported server variable: ${name}`);
        }
    };

    for (const rule of parsed.rules) {
        for (const flag of rule.flags) {
            if (!SUPPORTED_RULE_FLAGS.test(flag)) {
                throw new Error(`Unsupported RewriteRule flag: ${flag}`);
            }
        }
        const ruleMatch = relative.match(new RegExp(rule.pattern, rule.flags.includes('NC') ? 'i' : ''));
        if (!ruleMatch) {
            continue;
        }

        let condMatch: RegExpMatchArray | null = null;
        let ok = true;
        let orSatisfied = false;
        const testedHeaders = new Set<string>();
        for (const cond of rule.conditions) {
            for (const flag of cond.flags) {
                if (!SUPPORTED_COND_FLAGS.test(flag)) {
                    throw new Error(`Unsupported RewriteCond flag: ${flag}`);
                }
            }
            const isOr = cond.flags.includes('OR');
            if (orSatisfied) {
                // A condition in an [OR] chain that has already held is skipped.
                orSatisfied = isOr;
                continue;
            }
            if (cond.test.includes('%{HTTP_ACCEPT}')) {
                testedHeaders.add('Accept');
            }
            const testString = substitute(cond.test, serverVar, ruleMatch, condMatch);
            const negate = cond.pattern.startsWith('!');
            const pattern = negate ? cond.pattern.slice(1) : cond.pattern;
            let holds: boolean;
            if (pattern === '-f') {
                holds = fs.isFile(testString);
            } else if (pattern === '-d') {
                holds = fs.isDirectory(testString);
            } else {
                const match = testString.match(new RegExp(pattern, cond.flags.includes('NC') ? 'i' : ''));
                holds = match != null;
                if (match && !negate) {
                    condMatch = match;
                }
            }
            holds = holds !== negate;
            if (holds) {
                orSatisfied = isOr;
            } else if (!isOr) {
                ok = false;
                break;
            }
        }
        if (!ok) {
            continue;
        }

        for (const header of testedHeaders) {
            varyHeaders.add(header);
        }
        if (rule.flags.includes('G')) {
            return { kind: 'gone' };
        }
        if (rule.flags.includes('F')) {
            return { kind: 'forbidden' };
        }
        if (rule.substitution === '-') {
            continue;
        }
        let target = substitute(rule.substitution, serverVar, ruleMatch, condMatch);
        const redirectFlag = rule.flags.find((flag) => flag.startsWith('R='));
        if (redirectFlag != null || /^https?:\/\//.test(target)) {
            if (!rule.flags.includes('NE')) {
                target = target.replace(/#/g, '%23');
            }
            return {
                kind: 'redirect',
                status: redirectFlag == null ? 302 : Number(redirectFlag.slice(2)),
                location: target,
            };
        }
        if (!target.startsWith('/')) {
            throw new Error(`Relative internal rewrite targets are not supported: ${rule.substitution}`);
        }
        if (!rule.flags.includes('L')) {
            throw new Error(`Internal rewrites are expected to end the round with [L]: ${rule.substitution}`);
        }
        return { kind: 'internal', uri: target };
    }
    return { kind: 'none' };
}

// ---------------------------------------------------------------------------------------------

class SimulatedFs {
    private readonly files: Set<string>;

    constructor(files: Iterable<string> = []) {
        this.files = new Set(files);
    }

    isFile(path: string): boolean {
        return this.files.has(path);
    }

    isDirectory(path: string): boolean {
        const prefix = path.endsWith('/') ? path : `${path}/`;
        for (const file of this.files) {
            if (file.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }
}

function contentTypeFor(parsed: ParsedHtaccess, file: string): string | undefined {
    const ext = file.match(/\.([^./]+)$/)?.[1]?.toLowerCase();
    if (ext == null) {
        return undefined;
    }
    const type = parsed.types.get(ext) ?? BUILT_IN_TYPES[ext];
    if (type == null) {
        return undefined;
    }
    const charset = parsed.charsets.get(ext);
    return charset == null ? type : `${type}; charset=${charset}`;
}

function applyHeaders(table: Map<string, string>, directive: HeaderDirective) {
    const existing = table.get(directive.name);
    switch (directive.action) {
        case 'set':
            table.set(directive.name, directive.value!);
            break;
        case 'append':
            table.set(directive.name, existing == null ? directive.value! : `${existing}, ${directive.value}`);
            break;
        case 'merge': {
            const present = (existing ?? '').split(',').map((v) => v.trim());
            if (!present.includes(directive.value!)) {
                table.set(directive.name, existing == null ? directive.value! : `${existing}, ${directive.value}`);
            }
            break;
        }
        case 'unset':
            table.delete(directive.name);
            break;
    }
}

const MAX_INTERNAL_REDIRECTS = 10;

/** Evaluate one request against the site's `.htaccess`. */
export function simulateRequest(site: SimulatedSite, request: SimulatedRequest): SimulatedResponse {
    const parsed = parseHtaccess(site.htaccess);
    const fs = new SimulatedFs(site.files);
    const fullRequest = { ...request, host: request.host ?? DEFAULT_HOST };
    const varyHeaders = new Set<string>();

    let uri = request.uri;
    let status = 200;
    let location: string | undefined;
    let servedFile: string | undefined;
    let generatedByApache = false;

    for (let round = 0; ; round++) {
        if (round > MAX_INTERNAL_REDIRECTS) {
            throw new Error(`Internal redirect loop for ${request.uri}`);
        }
        const result = runRewrite(parsed, site.basePath, fullRequest, uri, fs, varyHeaders);
        if (result.kind === 'internal') {
            uri = result.uri;
            continue;
        }
        if (result.kind === 'redirect') {
            status = result.status;
            location = result.location;
            generatedByApache = true;
        } else if (result.kind === 'gone') {
            status = 410;
            generatedByApache = true;
        } else if (result.kind === 'forbidden') {
            status = 403;
            generatedByApache = true;
        } else if (uri.endsWith('/')) {
            // mod_dir: the index document, as an internal redirect the rules see again.
            if (fs.isFile(`${uri}index.html`)) {
                uri = `${uri}index.html`;
                continue;
            }
            status = fs.isDirectory(uri) ? 403 : 404;
        } else if (fs.isFile(uri)) {
            servedFile = uri;
        } else if (fs.isDirectory(uri)) {
            // mod_dir's DirectorySlash redirect, which stays on the requesting host.
            status = 301;
            location = `http://${fullRequest.host}${uri}/`;
            generatedByApache = true;
        } else {
            status = 404;
        }
        break;
    }

    if (status === 404 || status === 403) {
        const errorDocument = parsed.errorDocuments.get(status);
        if (errorDocument != null && fs.isFile(errorDocument)) {
            uri = errorDocument;
            servedFile = errorDocument;
        } else {
            generatedByApache = true;
        }
    }

    const contentType = generatedByApache ? APACHE_GENERATED_CONTENT_TYPE : contentTypeFor(parsed, servedFile!);
    const exprVars: ExprVars = {
        REQUEST_URI: uri,
        CONTENT_TYPE: contentType ?? '',
        REQUEST_STATUS: String(status),
        HTTP_HOST: fullRequest.host,
        HTTP_ACCEPT: request.accept ?? '',
    };

    const onSuccess = new Map<string, string>();
    const always = new Map<string, string>();
    if (varyHeaders.size > 0) {
        always.set('vary', [...varyHeaders].join(', '));
    }
    const apply = (directive: HeaderDirective) => {
        if (directive.expr != null && !evaluateExpr(directive.expr, exprVars)) {
            return;
        }
        applyHeaders(directive.always ? always : onSuccess, directive);
    };
    for (const directive of parsed.headers) {
        apply(directive);
    }
    for (const section of parsed.ifSections) {
        if (evaluateExpr(section.expr, exprVars)) {
            section.headers.forEach(apply);
        }
    }

    // Apache-generated responses (redirects, 410, a 404 with no error document) carry only the
    // `always` table; served documents, error documents included, carry both.
    const headers: Record<string, string> = {};
    const tables = generatedByApache ? [always] : [onSuccess, always];
    for (const table of tables) {
        for (const [name, value] of table) {
            headers[name] = name in headers ? `${headers[name]}, ${value}` : value;
        }
    }

    return {
        status,
        ...(location == null ? {} : { location }),
        ...(servedFile != null && !generatedByApache ? { servedFile } : {}),
        ...(contentType == null ? {} : { contentType }),
        headers,
    };
}

/**
 * Follow redirects from a request until a non-redirect response, for hop-count assertions. Only
 * redirects back onto `www.ag-grid.com` (or a relative target) are followed; the hop list is the
 * sequence of Location values.
 */
export function followRedirects(
    site: SimulatedSite,
    request: SimulatedRequest,
    maxHops = 5
): { hops: string[]; final: SimulatedResponse } {
    const hops: string[] = [];
    let current = request;
    for (;;) {
        const response = simulateRequest(site, current);
        if (response.location == null || response.status < 300 || response.status >= 400) {
            return { hops, final: response };
        }
        hops.push(response.location);
        if (hops.length > maxHops) {
            throw new Error(`Redirect chain longer than ${maxHops} hops: ${hops.join(' -> ')}`);
        }
        const target = new URL(response.location, `https://${current.host ?? DEFAULT_HOST}`);
        current = { ...current, host: target.host, uri: decodeURI(target.pathname) };
    }
}
