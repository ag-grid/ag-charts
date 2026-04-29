// -*- Mode: js2; -*-
/**
 * @fileoverview Enforce that all `renderer?:` declarations in ag-charts-types use the shared
 * `Renderer<P, R>` type from `chart/callbackOptions`. This keeps the renderer return-value
 * contract (TextValue | R | undefined; empty-string suppresses, undefined falls through to the
 * default) uniform across the public API surface.
 */

/** @type {import('eslint').Rule.RuleModule} */
export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Require that `renderer` properties in ag-charts-types use the shared `Renderer<P, R>` type from callbackOptions.',
        },
        messages: {
            useSharedRenderer:
                '`renderer` must use the shared `Renderer<P, R>` type from `chart/callbackOptions` (directly, or as part of a union/intersection) so the return-value contract stays uniform across the public API. Replace this bespoke signature with `Renderer<…, R>`. If you have a genuinely exceptional case, you can disable this rule with `// eslint-disable-next-line aglint/require-shared-renderer` and document why.',
        },
        schema: [],
    },

    create(context) {
        function getTypeName(typeAnnotation) {
            if (!typeAnnotation || typeAnnotation.type !== 'TSTypeReference') return undefined;
            const { typeName } = typeAnnotation;
            if (typeName.type === 'Identifier') return typeName.name;
            if (typeName.type === 'TSQualifiedName') return typeName.right?.name;
            return undefined;
        }

        // Walk the annotation tree so unions/intersections containing `Renderer<…>` still pass.
        // Examples allowed: `Renderer<…>`, `Renderer<…> | undefined`, `Renderer<…> & Branded`.
        // Examples flagged: `(params) => string`, bespoke aliases like `MyRenderer<P>`.
        function containsRendererReference(annotation) {
            if (!annotation) return false;
            if (getTypeName(annotation) === 'Renderer') return true;
            if (annotation.type === 'TSUnionType' || annotation.type === 'TSIntersectionType') {
                return annotation.types.some(containsRendererReference);
            }
            if (annotation.type === 'TSParenthesizedType') {
                return containsRendererReference(annotation.typeAnnotation);
            }
            return false;
        }

        return {
            TSPropertySignature(node) {
                const key = node.key;
                if (!key || key.type !== 'Identifier' || key.name !== 'renderer') return;

                const annotation = node.typeAnnotation?.typeAnnotation;
                if (!annotation) return;

                if (containsRendererReference(annotation)) return;

                context.report({
                    node: annotation,
                    messageId: 'useSharedRenderer',
                });
            },
        };
    },
};
