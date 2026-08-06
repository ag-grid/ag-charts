// -*- Mode: js2; -*-
/**
 * @fileoverview Keep logging scoped to a chart. A chart owns a per-instance `Logger` exposed as
 * `ctx.logger`, so ambient logging bypasses that scoping and can leak across chart instances. This
 * rule bans constructing a `Logger` and calling static `Logger.*` emitters. Code that genuinely has
 * no chart uses the `ambientLog` free functions, restricted to the files listed in `allowAmbientIn`.
 *
 * Options: `{ allowNewIn?: string[], checkStatic?: boolean, allowAmbientIn?: string[] }`
 * - `allowNewIn` — path fragments of the sanctioned files permitted to call `new Logger()`.
 * - `checkStatic` — when true, also flag static `Logger.<method>()` calls (off by default so the
 *   `new Logger()` ban can apply repo-wide while the static-emitter ban is rolled out package by package).
 * - `allowAmbientIn` — path fragments of the files permitted to reach the ambient logger. Omit to allow
 *   it everywhere; supply a list to freeze the chart-less residue at exactly those files. Enforcement is
 *   keyed on the imported/re-exported module, so every route to the shared instance is covered: the
 *   `ambientLog` namespace, the `ambientLogger` instance, direct named imports of the free functions, and
 *   `export … from`/`export * from` re-exports of any of the above (`ImportDeclaration`,
 *   `ExportNamedDeclaration` and `ExportAllDeclaration` are all handled). A barrel-of-a-barrel `export *`
 *   that re-publishes a logging module indirectly (e.g. `export * from 'ag-charts-core'` from a package
 *   that is not itself the core barrel) is not a logging-module specifier and is deliberately left
 *   uncovered — see the `isLoggingModule`/`ag-charts-core` check below.
 */

const BANNED_STATIC_METHODS = new Set(['log', 'warn', 'error', 'table', 'warnOnce', 'errorOnce', 'logGroup', 'reset']);

// Every name the logging module exports that reaches the process-wide ambient Logger. `Logger` itself is
// absent deliberately: importing the class is how a file declares a `Logger` parameter, which is the
// behaviour this rule is steering towards. Construction is policed separately by `allowNewIn`.
const AMBIENT_EXPORTS = new Set([...BANNED_STATIC_METHODS, 'ambientLog', 'ambientLogger']);

// The logging modules themselves, matched either by a `logging/` path segment (reached by relative path
// from inside core, e.g. `../logging/logger`) or by an exact sibling specifier (`./logger`,
// `./ambientLog`, from a file that already lives alongside them inside `logging/`). A namespace import or
// `export *` of either form exposes every ambient emitter, so the whole module is in scope — not just
// named specifiers. Deliberately not a bare `(logger|ambientLog)$` suffix match: that would also catch
// `../logging/debugLogger` and flag namespace imports that have nothing to do with the ambient logger.
const isLoggingModule = (source) =>
    /(^|\/)logging\/(logger|ambientLog)(\.[jt]s)?$/.test(source) || /^\.\/(logger|ambientLog)(\.[jt]s)?$/.test(source);

/** @type {import('eslint').Rule.RuleModule} */
export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Ban `new Logger()` construction, static `Logger.*` calls, and unsanctioned `ambientLog` use in favour of the per-chart `ctx.logger`.',
        },
        messages: {
            noNewLogger:
                "Do not construct `new Logger()` — a chart's Logger is created for you and exposed as `ctx.logger`. Code with no chart logs via the `ambientLog` free functions. (Add a sanctioned construction site to this rule's `allowNewIn` option.)",
            noStaticLogger:
                'There is no static `Logger.{{method}}()` — route logging through the chart `ctx.logger` (or `this.logger`), or `ambientLog.{{method}}()` if the code genuinely has no chart.',
            noAmbientLog:
                "`ambientLog` is not scoped to a chart, so its output cannot be attributed or captured per instance. Thread the owning chart's `ctx.logger` to this code instead. (If it genuinely cannot reach a chart, add it to this rule's `allowAmbientIn` option and say why.)",
        },
        schema: [
            {
                type: 'object',
                properties: {
                    allowNewIn: { type: 'array', items: { type: 'string' } },
                    checkStatic: { type: 'boolean' },
                    allowAmbientIn: { type: 'array', items: { type: 'string' } },
                },
                additionalProperties: false,
            },
        ],
    },

    create(context) {
        const options = context.options[0] ?? {};
        const allowNewIn = options.allowNewIn ?? [];
        const checkStatic = options.checkStatic ?? false;
        const allowAmbientIn = options.allowAmbientIn;
        const filename = context.filename ?? context.getFilename();
        const matches = (fragments) => fragments.some((fragment) => filename.includes(fragment));

        return {
            NewExpression(node) {
                if (node.callee.type !== 'Identifier' || node.callee.name !== 'Logger') return;
                if (matches(allowNewIn)) return;

                context.report({ node, messageId: 'noNewLogger' });
            },

            ImportDeclaration(node) {
                if (allowAmbientIn == null || matches(allowAmbientIn)) return;
                // Type-only imports erase at compile time and cannot emit anything.
                if (node.importKind === 'type') return;

                // Keyed on the module rather than the local name: `import { warnOnce } from '../logging/logger'`
                // reaches the same ambient instance as `ambientLog.warnOnce`, so both must be caught.
                const fromLoggingModule = isLoggingModule(node.source.value);
                if (!fromLoggingModule && node.source.value !== 'ag-charts-core') return;

                for (const specifier of node.specifiers) {
                    if (specifier.type === 'ImportSpecifier') {
                        if (specifier.importKind === 'type') continue;
                        if (AMBIENT_EXPORTS.has(specifier.imported.name)) {
                            context.report({ node: specifier, messageId: 'noAmbientLog' });
                        }
                    } else if (fromLoggingModule) {
                        // A namespace or default import of the logging module itself exposes every
                        // ambient emitter. The `ag-charts-core` barrel is far wider, so a namespace
                        // import of it says nothing about logging and is left alone.
                        context.report({ node: specifier, messageId: 'noAmbientLog' });
                    }
                }
            },

            ExportNamedDeclaration(node) {
                if (allowAmbientIn == null || matches(allowAmbientIn)) return;
                // A local `export { x }` (no `from`) re-exports something already declared in this
                // file, which is covered by the `ImportDeclaration`/`NewExpression` checks above.
                if (node.source == null) return;
                // `export type { X } from '...'` erases at compile time and cannot emit anything.
                if (node.exportKind === 'type') return;

                const fromLoggingModule = isLoggingModule(node.source.value);
                if (!fromLoggingModule && node.source.value !== 'ag-charts-core') return;

                for (const specifier of node.specifiers) {
                    if (specifier.exportKind === 'type') continue;
                    // `specifier.local` is the name as it appears in the *source* module — the same
                    // thing `ImportSpecifier.imported` names on the import side — so it is what must be
                    // checked against `AMBIENT_EXPORTS`, not `specifier.exported`.
                    if (AMBIENT_EXPORTS.has(specifier.local.name)) {
                        context.report({ node: specifier, messageId: 'noAmbientLog' });
                    }
                }
            },

            ExportAllDeclaration(node) {
                if (allowAmbientIn == null || matches(allowAmbientIn)) return;
                if (node.exportKind === 'type') return;
                // Mirrors the namespace-import branch above: `export * from '../logging/logger'` (and
                // its aliased form, `export * as ambientLog from './logging/ambientLog'`) republishes
                // every ambient emitter, so only the logging module itself is in scope here — the wider
                // `ag-charts-core` barrel check does not apply, so a barrel-of-a-barrel `export *` (e.g.
                // `export * from 'ag-charts-core'`) is deliberately left uncovered.
                if (!isLoggingModule(node.source.value)) return;

                context.report({ node, messageId: 'noAmbientLog' });
            },

            CallExpression(node) {
                if (!checkStatic) return;

                const callee = node.callee;
                if (callee.type !== 'MemberExpression') return;
                // Only the statics — `ctx.logger.*` and `this.logger.*` have a non-Identifier object here.
                if (callee.object.type !== 'Identifier' || callee.object.name !== 'Logger') return;
                if (callee.property.type !== 'Identifier' || !BANNED_STATIC_METHODS.has(callee.property.name)) {
                    return;
                }

                context.report({
                    node,
                    messageId: 'noStaticLogger',
                    data: { method: callee.property.name },
                });
            },
        };
    },
};
