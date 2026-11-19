// -*- Mode: js2; -*-
/**
 * @fileoverview Keep raw DOM elements behind the widget module. Code outside it talks to a `Widget`
 * through its methods, so a zero-argument `.getElement()` call is reported: each one is a place where
 * the element escapes and the Widget can no longer track what is done to it.
 *
 * A legitimate escape is allowed with an `eslint-disable-next-line aglint/widget-boundary -- <reason>`
 * directive on the line above. Repo config sets `reportUnusedDisableDirectives: 'error'`, so a directive
 * goes stale (and fails lint) once its site stops escaping.
 *
 * `NativeWidget` and `DOMManagerWidget` are fallbacks that Phase 3 replaces with real Widget subclasses.
 * Constructing or extending either is reported unless a comment containing `PHASE_3_MARKER` sits directly
 * before the expression or one of its enclosing statements, declarations or class members, so that one
 * search for the marker finds every fallback.
 *
 * Calls with arguments are not reported: `Overlay.getElement(...)` renders user content and is not a Widget.
 */

const PHASE_3_MARKER = 'Phase 3 "Common Widget Ancestor"';
const FALLBACK_WIDGETS = new Set(['NativeWidget', 'DOMManagerWidget']);

function fallbackName(node) {
    if (node?.type === 'Identifier') return FALLBACK_WIDGETS.has(node.name) ? node.name : undefined;
    if (node?.type === 'MemberExpression' && !node.computed && node.property.type === 'Identifier') {
        return FALLBACK_WIDGETS.has(node.property.name) ? node.property.name : undefined;
    }
    return undefined;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Ban `Widget.getElement()` outside the widget module, and require a Phase 3 TODO on each NativeWidget or DOMManagerWidget fallback.',
        },
        messages: {
            getElement:
                'Do not reach through a Widget to its raw element. Use (or add) a Widget method instead. If the escape is unavoidable, allow it with `// eslint-disable-next-line aglint/widget-boundary -- <reason>`.',
            fallbackWithoutTodo: `\`{{name}}\` is a fallback that Phase 3 removes. Put \`// TODO: ${PHASE_3_MARKER} - <why>\` directly before this statement or declaration.`,
        },
        schema: [],
    },

    create(context) {
        const { sourceCode } = context;

        const hasMarker = (node) => {
            for (let current = node; current != null; current = current.parent) {
                if (sourceCode.getCommentsBefore(current).some((comment) => comment.value.includes(PHASE_3_MARKER))) {
                    return true;
                }
            }
            return false;
        };

        const checkFallback = (node, target) => {
            const name = fallbackName(target);
            if (name == null || hasMarker(node)) return;
            context.report({ node: target, messageId: 'fallbackWithoutTodo', data: { name } });
        };

        return {
            CallExpression(node) {
                const { callee } = node;
                if (
                    node.arguments.length === 0 &&
                    callee.type === 'MemberExpression' &&
                    !callee.computed &&
                    callee.property.type === 'Identifier' &&
                    callee.property.name === 'getElement'
                ) {
                    context.report({ node: callee.property, messageId: 'getElement' });
                }
            },
            NewExpression(node) {
                checkFallback(node, node.callee);
            },
            'ClassDeclaration, ClassExpression'(node) {
                checkFallback(node, node.superClass);
            },
        };
    },
};
