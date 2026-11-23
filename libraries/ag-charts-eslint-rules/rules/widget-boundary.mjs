// -*- Mode: js2; -*-
/**
 * @fileoverview Keep raw DOM elements behind the widget module. Code outside it talks to a `Widget`
 * through its methods, so every reference to a `getElement` member is reported: a call, a bracket
 * access, `.bind()` or passing the method on all let the element escape where the Widget can no longer
 * track what is done to it. A call with arguments is the exception: `Overlay.getElement(...)` renders
 * user content and is not a Widget.
 *
 * A legitimate escape is allowed with an `eslint-disable-next-line aglint/widget-boundary -- <reason>`
 * (or `eslint-disable-line`) directive. The companion `widget-boundary-directives` rule below requires
 * the reason and reports block or file-wide disables, so each allowance names one site and says why. Repo config sets
 * `reportUnusedDisableDirectives: 'error'`, so a directive goes stale (and fails lint) once its site
 * stops escaping.
 *
 * `NativeWidget` and `DOMManagerWidget` are fallbacks that Phase 3 replaces with real Widget subclasses.
 * Constructing or extending either is reported unless a comment containing `PHASE_3_MARKER` sits directly
 * before the statement holding the `new`, or before the class whose heritage clause names the fallback, so
 * that one search for the marker finds every fallback and each marker explains only its own site. Import
 * aliases and static member access (`ns.NativeWidget`, `ns['NativeWidget']`) are resolved; a fallback
 * reassigned to a local variable is not.
 */

const RULE_NAME = 'aglint/widget-boundary';
const PHASE_3_MARKER = 'Phase 3 "Common Widget Ancestor"';
const FALLBACK_WIDGETS = new Set(['NativeWidget', 'DOMManagerWidget']);

const DIRECTIVE = /^\s*eslint-disable(-next-line|-line)?(?:\s+([\s\S]*))?$/;

function staticPropertyName(member) {
    if (!member.computed) return member.property.type === 'Identifier' ? member.property.name : undefined;
    const { property } = member;
    if (property.type === 'Literal' && typeof property.value === 'string') return property.value;
    if (property.type === 'TemplateLiteral' && property.expressions.length === 0)
        return property.quasis[0].value.cooked;
    return undefined;
}

// The nearest node a marker comment may precede: the enclosing statement or class member, or the
// `export` wrapping a declaration.
function markerAnchors(node) {
    let current = node;
    while (
        current.parent != null &&
        !/(Statement|Declaration)$/.test(current.type) &&
        current.type !== 'PropertyDefinition'
    ) {
        current = current.parent;
    }
    const anchors = [current];
    const { parent } = current;
    if (parent?.type === 'ExportNamedDeclaration' || parent?.type === 'ExportDefaultDeclaration') anchors.push(parent);
    return anchors;
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
            getElement: `Do not reach through a Widget to its raw element. Use (or add) a Widget method instead. If the escape is unavoidable, allow it with \`// eslint-disable-next-line ${RULE_NAME} -- <reason>\`.`,
            fallbackWithoutTodo: `\`{{name}}\` is a fallback that Phase 3 removes. Put \`// TODO: ${PHASE_3_MARKER} - <why>\` directly before this statement, or before the class that extends it.`,
        },
        schema: [],
    },

    create(context) {
        const { sourceCode } = context;
        const aliases = new Map();

        const fallbackName = (node) => {
            if (node?.type === 'Identifier') {
                if (aliases.has(node.name)) return aliases.get(node.name);
                return FALLBACK_WIDGETS.has(node.name) ? node.name : undefined;
            }
            if (node?.type === 'MemberExpression') {
                const name = staticPropertyName(node);
                return FALLBACK_WIDGETS.has(name) ? name : undefined;
            }
            return undefined;
        };

        const hasMarker = (anchors) =>
            anchors.some((anchor) =>
                sourceCode.getCommentsBefore(anchor).some((comment) => comment.value.includes(PHASE_3_MARKER))
            );

        const checkFallback = (target, anchors) => {
            const name = fallbackName(target);
            if (name == null || hasMarker(anchors)) return;
            context.report({ node: target, messageId: 'fallbackWithoutTodo', data: { name } });
        };

        return {
            Program(program) {
                for (const statement of program.body) {
                    if (statement.type !== 'ImportDeclaration') continue;
                    for (const specifier of statement.specifiers) {
                        if (specifier.type !== 'ImportSpecifier') continue;
                        const imported = specifier.imported.name ?? specifier.imported.value;
                        if (FALLBACK_WIDGETS.has(imported)) aliases.set(specifier.local.name, imported);
                    }
                }
            },
            MemberExpression(node) {
                if (staticPropertyName(node) !== 'getElement') return;
                const { parent } = node;
                if (parent.type === 'CallExpression' && parent.callee === node && parent.arguments.length > 0) return;
                context.report({ node: node.property, messageId: 'getElement' });
            },
            NewExpression(node) {
                checkFallback(node.callee, markerAnchors(node));
            },
            'ClassDeclaration, ClassExpression'(node) {
                checkFallback(node.superClass, markerAnchors(node));
            },
        };
    },
};

/**
 * Companion rule: every directive that disables `aglint/widget-boundary` must exempt one line and give a
 * reason. It is a separate rule because a block or file-wide disable of `aglint/widget-boundary` would
 * otherwise suppress its own report. A directive that also disables this rule, or names no rules at all,
 * still silences it; that is left to review.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
export const widgetBoundaryDirectives = {
    meta: {
        type: 'problem',
        docs: {
            description: `Require a single-line scope and a reason on every directive that disables \`${RULE_NAME}\`.`,
        },
        messages: {
            directiveWithoutReason: `Give a reason for this exemption: \`// eslint-disable-next-line ${RULE_NAME} -- <reason>\`.`,
            directiveTooWide: `Exempt one site at a time with \`// eslint-disable-next-line ${RULE_NAME} -- <reason>\`, not a block or file-wide disable.`,
        },
        schema: [],
    },

    create(context) {
        const checkDirective = (comment) => {
            const match = DIRECTIVE.exec(comment.value);
            if (match == null) return;
            const [, scope, rest = ''] = match;
            const separator = rest.search(/(^|\s)-{2,}(\s|$)/);
            const ruleList = separator < 0 ? rest : rest.slice(0, separator);
            const description = separator < 0 ? '' : rest.slice(separator).replace(/^\s*-{2,}/, '');
            const rules = ruleList
                .split(',')
                .map((rule) => rule.trim())
                .filter((rule) => rule !== '');
            // A directive naming no rules silences every rule, this one included.
            if (rules.length > 0 && !rules.includes(RULE_NAME)) return;
            if (scope == null) {
                context.report({ loc: comment.loc, messageId: 'directiveTooWide' });
            } else if (description.trim() === '') {
                context.report({ loc: comment.loc, messageId: 'directiveWithoutReason' });
            }
        };

        return {
            Program() {
                for (const comment of context.sourceCode.getAllComments()) {
                    checkDirective(comment);
                }
            },
        };
    },
};
