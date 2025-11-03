// -*- Mode: js2; -*-

/**
 * @fileoverview Disallow assigning objects/arrays/tuples with readonly properties to mutable variables.
 */
import { ESLintUtils } from '@typescript-eslint/utils';
import ts from 'typescript';

/** @type {import('eslint').Rule.RuleModule} */
export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Disallow assigning objects, arrays, or tuples with readonly properties to mutable variables.',
            recommended: 'error',
        },
        messages: {
            readonlyToMutable:
                "Cannot assign a value with readonly properties to a mutable variable '{{target}}'.",
        },
        schema: [],
    },

    create(context) {
        const parserServices = ESLintUtils.getParserServices(context);
        if (!parserServices || !parserServices.program) {
            console.error(
                'parserServices not available — make sure you are using @typescript-eslint/parser with project config!'
            );
            return {};
        }

        const checker = parserServices.program.getTypeChecker();

        /**
         * Recursively checks if a type has any readonly properties.
         */
        function hasReadonlyProperties(type) {
            if (type.isUnion()) {
                return type.types.some(hasReadonlyProperties);
            }

            if (type.flags & ts.TypeFlags.Object) {
                const props = type.getProperties();
                for (const prop of props) {
                    const decls = prop.getDeclarations() || [];
                    for (const decl of decls) {
                        if (
                            ts.isPropertySignature(decl) ||
                            ts.isPropertyDeclaration(decl) ||
                            ts.isParameter(decl)
                        ) {
                            if ((ts.getCombinedModifierFlags(decl) & ts.ModifierFlags.Readonly) !== 0) {
                                return true;
                            }
                        }
                    }
                }

                // Check for tuple readonly flag
                if ((type.objectFlags & ts.ObjectFlags.Tuple) !== 0) {
                    if (type.target?.readonly) return true;
                }

                // Check for readonly array
                const symbol = type.getSymbol();
                if (symbol?.getName() === 'ReadonlyArray') return true;

                // Check nested properties recursively
                for (const prop of props) {
                    const propType = checker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration);
                    if (hasReadonlyProperties(propType)) return true;
                }
            }

            return false;
        }

        function checkAssignment(leftNode, rightNode) {
            if (!leftNode || !rightNode) return;

            const leftType = checker.getTypeAtLocation(parserServices.esTreeNodeToTSNodeMap.get(leftNode));
            const rightType = checker.getTypeAtLocation(parserServices.esTreeNodeToTSNodeMap.get(rightNode));

            if (hasReadonlyProperties(rightType)) {
                const leftHasReadonly = hasReadonlyProperties(leftType);
                if (!leftHasReadonly) {
                    context.report({
                        node: rightNode,
                        messageId: 'readonlyToMutable',
                        data: { target: checker.typeToString(leftType) },
                    });
                }
            }
        }

        return {
            AssignmentExpression(node) {
                checkAssignment(node.left, node.right);
            },
            VariableDeclarator(node) {
                if (node.init) {
                    checkAssignment(node.id, node.init);
                }
            },
        };
    },
};
