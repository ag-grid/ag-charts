const acorn = require('acorn');

// Deferred scopes: calls inside these node types only execute when invoked,
// not at module initialisation time, so they are not top-level side effects.
// Note: ClassBody is intentionally NOT here — static field initialisers inside class
// bodies execute at definition time and are genuine side effects. Method bodies are
// FunctionExpression/ArrowFunctionExpression which are already covered.
const DEFERRED_BODY = new Set(['FunctionExpression', 'FunctionDeclaration', 'ArrowFunctionExpression']);
const CALL_LIKE = new Set(['CallExpression', 'NewExpression', 'TaggedTemplateExpression']);

function containsEager(node, matches) {
    if (!node) return false;
    if (DEFERRED_BODY.has(node.type)) return false;
    if (matches(node)) return true;
    for (const key of Object.keys(node)) {
        const val = node[key];
        if (val && typeof val === 'object') {
            if (Array.isArray(val)) {
                for (const item of val) {
                    if (item?.type && containsEager(item, matches)) return true;
                }
            } else if (val.type && containsEager(val, matches)) {
                return true;
            }
        }
    }
    return false;
}

const isCallOrSpread = (node) => CALL_LIKE.has(node.type) || node.type === 'SpreadElement';
// esbuild keeps spreads and property reads, since either may invoke a getter; it drops a pure call's callee.
const hasSideEffect = (node) => containsEager(node, (n) => isCallOrSpread(n) || n.type === 'MemberExpression');
const hasCalleeSideEffect = (node) => containsEager(node, isCallOrSpread);

/**
 * Rename every reference to `from` inside `node` to `to`, using identifier positions from
 * the AST. Property names and string contents are left alone, so a static such as
 * `Foo.className = "Foo"` keeps its literal.
 */
function renameReferences(code, node, from, to) {
    const ranges = [];
    const visit = (n, parent, key) => {
        if (!n || typeof n !== 'object') return;
        if (Array.isArray(n)) {
            for (const item of n) visit(item, parent, key);
            return;
        }
        if (!n.type) return;
        if (n.type === 'Property' && n.shorthand && n.value.type === 'Identifier') {
            // `{ Foo }` shares one range between key and value, so expand it to `Foo: _c$0`.
            if (n.value.name === from) ranges.push([n.start, n.end, `${from}: ${to}`]);
            return;
        }
        if (n.type === 'Identifier') {
            const isPropertyName =
                (parent?.type === 'MemberExpression' && key === 'property' && !parent.computed) ||
                (parent?.type === 'Property' && key === 'key' && !parent.computed);
            if (n.name === from && !isPropertyName) ranges.push([n.start, n.end, to]);
            return;
        }
        for (const childKey of Object.keys(n)) {
            if (childKey === 'type' || childKey === 'start' || childKey === 'end') continue;
            visit(n[childKey], n, childKey);
        }
    };
    visit(node, null, null);

    let result = code.slice(node.start, node.end);
    for (const [start, end, text] of ranges.reverse()) {
        const s = start - node.start;
        const e = end - node.start;
        result = result.slice(0, s) + text + result.slice(e);
    }
    return result;
}

/**
 * Marks a top-level initialiser as droppable. Bundlers drop an annotated call but still evaluate the calls,
 * spreads and property reads in its arguments, so only a call whose arguments are free of those is annotated in place.
 */
function annotateInitialiser(code, init, edits) {
    if (!hasSideEffect(init)) return;
    const [callee, args] =
        init.type === 'TaggedTemplateExpression' ? [init.tag, [init.quasi]] : [init.callee, init.arguments ?? []];
    if (CALL_LIKE.has(init.type) && !hasCalleeSideEffect(callee) && !args.some(hasSideEffect)) {
        edits.push({ pos: init.start, text: '/*#__PURE__*/ ' });
        return;
    }
    const initCode = code.slice(init.start, init.end);
    edits.push({ pos: init.start, end: init.end, replace: `/*#__PURE__*/ (() => (${initCode}))()` });
}

// Bare side-effect imports from AG Charts packages are artefacts of esbuild bundling
// type-only imports from external dependencies. Safe to remove.
const AG_PACKAGES = new Set(['ag-charts-core', 'ag-charts-community', 'ag-charts-locale', 'ag-charts-types']);

// Patterns for expression statements that can be merged into their parent class IIFE.
// These reference a class variable (e.g. _Foo.prototype, _Foo.bar) and only affect that class.
const CLASS_EXPR_PATTERN = /^(__decorateClass\(\[[\s\S]*?],\s*)(_?[A-Z][a-zA-Z0-9$]*)\.|^(_?[A-Z][a-zA-Z0-9$]*)\./;
// `export * as ns` compiles to `var ns_exports = {}; __export(ns_exports, { ...getters });`.
const NAMESPACE_EXPORT_PATTERN = /^__export\d*\(([\w$]+),/;
// __VERIFY statements are build-time checks, safe to drop unconditionally.
const SAFE_VERIFY_PATTERN = /^__VERIFY/;

function annotatePureToplevel(code) {
    let ast;
    try {
        ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
    } catch {
        return code;
    }

    const edits = [];
    const body = ast.body;

    // Pass 1: Identify variable declarations and collect trailing expression statements
    //         that reference the declared variable. These will be merged into a single
    //         #__PURE__ IIFE so the entire group is tree-shakeable as a unit.
    //
    // Pattern in esbuild output:
    //   var _Foo = class { ... };
    //   __decorateClass([...], _Foo.prototype, "bar", 2);
    //   _Foo.staticProp = value;
    //
    // Becomes:
    //   var _Foo = /*#__PURE__*/ (() => { var _cls = class { ... }; __decorateClass(...); _cls.staticProp = value; return _cls; })();

    let i = 0;
    let tmpVarCounter = 0;
    while (i < body.length) {
        const node = body[i];

        // 0. Bare side-effect imports of AG Charts packages — artefacts of esbuild bundling
        //    type-only imports. These trigger warnings in downstream bundlers.
        if (node.type === 'ImportDeclaration' && node.specifiers.length === 0) {
            if (AG_PACKAGES.has(node.source.value)) {
                edits.push({ pos: node.start, end: node.end, replace: '' });
            }
            i++;
            continue;
        }

        // 1. __VERIFY statements — safe to drop unconditionally.
        if (node.type === 'ExpressionStatement') {
            if (SAFE_VERIFY_PATTERN.test(code.slice(node.start, node.start + 40))) {
                const orig = code.slice(node.start, node.end);
                edits.push({ pos: node.start, end: node.end, replace: `/*#__PURE__*/ (() => { ${orig} })();` });
            }
            i++;
            continue;
        }

        // 2. Variable declarations — annotate initialisers and merge trailing expr statements.
        if (node.type === 'VariableDeclaration' && node.declarations.length === 1) {
            const decl = node.declarations[0];
            if (decl.id?.type === 'Identifier' && decl.init) {
                const varName = decl.id.name;

                // Collect trailing expression statements that reference this variable.
                const trailingExprs = [];
                let j = i + 1;
                while (j < body.length && body[j].type === 'ExpressionStatement') {
                    const exprText = code.slice(body[j].start, body[j].end);
                    const match = CLASS_EXPR_PATTERN.exec(exprText);
                    const namespaceMatch = NAMESPACE_EXPORT_PATTERN.exec(exprText);
                    if ((match && (match[2] ?? match[3]) === varName) || namespaceMatch?.[1] === varName) {
                        trailingExprs.push(body[j]);
                        j++;
                    } else {
                        break;
                    }
                }

                if (trailingExprs.length > 0) {
                    // Merge: var _Foo = <init>; <expr1>; <expr2>; →
                    //        var _Foo = /*#__PURE__*/ (() => { var _c$0 = <init>; <expr1_rewritten>; return _c$0; })();
                    const initCode = code.slice(decl.init.start, decl.init.end);
                    const tmpVar = `_c$${tmpVarCounter++}`;
                    const exprsCode = trailingExprs.map((e) => renameReferences(code, e, varName, tmpVar)).join(' ');
                    const lastExpr = trailingExprs[trailingExprs.length - 1];
                    edits.push({
                        pos: decl.init.start,
                        end: lastExpr.end,
                        replace: `/*#__PURE__*/ (() => { var ${tmpVar} = ${initCode}; ${exprsCode} return ${tmpVar}; })()`,
                    });
                    i = j;
                    continue;
                }

                // No trailing exprs — just annotate the initialiser if it has side effects.
                annotateInitialiser(code, decl.init, edits);
            }
        } else if (node.type === 'VariableDeclaration') {
            // Multi-declarator — annotate each initialiser individually.
            for (const decl of node.declarations) {
                if (decl.init) annotateInitialiser(code, decl.init, edits);
            }
        }

        i++;
    }

    if (edits.length === 0) return code;

    // Apply in reverse source-position order so earlier edits don't shift later positions.
    let result = code;
    edits.sort((a, b) => b.pos - a.pos);
    for (const edit of edits) {
        if (edit.replace !== undefined) {
            result = result.slice(0, edit.pos) + edit.replace + result.slice(edit.end);
        } else {
            result = result.slice(0, edit.pos) + edit.text + result.slice(edit.pos);
        }
    }
    return result;
}

module.exports = { annotatePureToplevel };
