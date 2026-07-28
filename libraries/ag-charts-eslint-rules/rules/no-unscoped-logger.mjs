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
 *   keyed on the imported module, so every route to the shared instance is covered: the `ambientLog`
 *   namespace, the `ambientLogger` instance, and direct named imports of the free functions.
 */

const BANNED_STATIC_METHODS = new Set(['log', 'warn', 'error', 'table', 'warnOnce', 'errorOnce', 'logGroup', 'reset']);

// Every name the logging module exports that reaches the process-wide ambient Logger. `Logger` itself is
// absent deliberately: importing the class is how a file declares a `Logger` parameter, which is the
// behaviour this rule is steering towards. Construction is policed separately by `allowNewIn`.
const AMBIENT_EXPORTS = new Set([...BANNED_STATIC_METHODS, 'ambientLog', 'ambientLogger']);

// The logging modules themselves, reached by relative path from inside core. A namespace import of
// either exposes every ambient emitter, so the whole module is in scope — not just named specifiers.
const isLoggingModule = (source) => /(^|\/)logging\/(logger|ambientLog)(\.[jt]s)?$/.test(source);

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
