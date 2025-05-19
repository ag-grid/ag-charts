// -*- Mode: js2 -*-

/**
 * @fileoverview Enforce explicit generic arguments for specified types
 */

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Require explicit generic type arguments for specific types',
        },
        messages: {
            requireGeneric: "'{{name}}' requires explicit generic type arguments.",
        },
        schema: [], // No options for now
    },

    create(context) {
        const TARGET_NAMES = ['AgContextMenuItemSeriesNode', 'AgNodeContextMenuActionEvent']; // ✅ Modify this list

        return {
            TSTypeReference(node) {
                if (
                    node.typeName.type === 'Identifier' &&
                    TARGET_NAMES.includes(node.typeName.name) &&
                    (!node.typeParameters || node.typeParameters.params.length === 0)
                ) {
                    context.report({
                        node,
                        messageId: 'requireGeneric',
                        data: {
                            name: node.typeName.name,
                        },
                    });
                }
            },
        };
    },
};
