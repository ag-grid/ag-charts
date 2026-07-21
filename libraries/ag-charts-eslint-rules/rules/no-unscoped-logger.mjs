// -*- Mode: js2; -*-
/**
 * @fileoverview Keep logging scoped to a chart. A chart owns a per-instance `Logger` exposed as
 * `ctx.logger`, so ambient logging via `new Logger()` or the static `Logger.warn()` family bypasses
 * that scoping and can leak across chart instances. This rule bans both: construct nothing (use the
 * chart's `ctx.logger`), and where no chart context exists reach for the explicit shared `Logger.default`
 * fallback rather than the ambient statics.
 *
 * Options: `{ allowNewIn?: string[], checkStatic?: boolean }`
 * - `allowNewIn` — path fragments of the sanctioned files permitted to call `new Logger()`.
 * - `checkStatic` — when true, also flag ambient static `Logger.<method>()` calls (off by default so the
 *   `new Logger()` ban can apply repo-wide while the static-emitter ban is rolled out package by package).
 */

const BANNED_STATIC_METHODS = new Set(['log', 'warn', 'error', 'table', 'warnOnce', 'errorOnce', 'logGroup', 'reset']);

/** @type {import('eslint').Rule.RuleModule} */
export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Ban unscoped `new Logger()` construction and ambient static `Logger.*` calls in favour of the per-chart `ctx.logger` or the explicit `Logger.default` fallback.',
        },
        messages: {
            noNewLogger:
                "Do not construct `new Logger()` — a chart's Logger is created for you and exposed as `ctx.logger`. For genuinely chart-less code use the shared `Logger.default` instance. (Add a sanctioned construction site to this rule's `allowNewIn` option.)",
            noStaticLogger:
                'Do not call the ambient static `Logger.{{method}}()` — route logging through the chart `ctx.logger` (or `this.logger`) where a chart context is available, or the explicit `Logger.default.{{method}}()` fallback for chart-less code.',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    allowNewIn: { type: 'array', items: { type: 'string' } },
                    checkStatic: { type: 'boolean' },
                },
                additionalProperties: false,
            },
        ],
    },

    create(context) {
        const options = context.options[0] ?? {};
        const allowNewIn = options.allowNewIn ?? [];
        const checkStatic = options.checkStatic ?? false;
        const filename = context.filename ?? context.getFilename();

        return {
            NewExpression(node) {
                if (node.callee.type !== 'Identifier' || node.callee.name !== 'Logger') return;
                if (allowNewIn.some((fragment) => filename.includes(fragment))) return;

                context.report({ node, messageId: 'noNewLogger' });
            },

            CallExpression(node) {
                if (!checkStatic) return;

                const callee = node.callee;
                if (callee.type !== 'MemberExpression') return;
                // Only the ambient statics — `Logger.default.*`, `ctx.logger.*`, `this.logger.*` all have a
                // non-Identifier object here, so they are left alone.
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
