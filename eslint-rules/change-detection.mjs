/**
 * @fileoverview Enforce safe use of @SceneChangeDetection decorators
 */
import { ESLintUtils } from '@typescript-eslint/utils';
import path from 'path';
import ts from 'typescript';

const SCENE_DECORATORS = new Set(['SceneChangeDetection', 'SceneArrayChangeDetection', 'SceneObjectChangeDetection']);

/** @type {import('eslint').Rule.RuleModule} */
export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Checks for incorrect usage of SceneChangeDetection decorators.',
            recommended: 'error',
        },
        messages: {
            invalidDecoratorUsage:
                "Decorator @{{decorator}} cannot assign property '{{property}}' to type '{{type}}'.\n{{suggestions}}",
        },
        schema: [],
    },

    defaultOptions: [],

    create(context) {
        const parserServices = ESLintUtils.getParserServices(context);
        const checker = parserServices.program.getTypeChecker();

        function isUndefinedType(type) {
            return type.flags & ts.TypeFlags.Undefined;
        }

        function isAllowedPrimitive(type) {
            const flags = ts.TypeFlags;
            const allowed =
                flags.Number |
                flags.NumberLiteral |
                flags.String |
                flags.StringLiteral |
                flags.Boolean |
                flags.BooleanLiteral |
                flags.Undefined;
            return (type.flags & allowed) !== 0;
        }

        function isArrayType(type) {
            if (type.isUnion()) {
                return type.types.some(isArrayType);
            }
            if (type.flags & ts.TypeFlags.Object) {
                const symbol = type.getSymbol();
                return symbol && ['Array', 'ReadonlyArray'].includes(symbol.getName());
            }
            return false;
        }

        function isReadonlyArray(type) {
            if (type.isUnion()) {
                return type.types.every((t) => isReadonlyArray(t) || !isArrayType(t));
            }
            const symbol = type.getSymbol();
            return symbol?.getName() === 'ReadonlyArray';
        }

        function isTupleType(type) {
            if (type.isUnion()) {
                return type.types.some(isTupleType);
            }
            return (
                (type.objectFlags & ts.ObjectFlags.Tuple) !== 0 ||
                (type.target?.objectFlags & ts.ObjectFlags.Tuple) !== 0
            );
        }

        function isMutableArray(type) {
            return isArrayType(type) && !isReadonlyArray(type);
        }

        function isMutableTuple(type) {
            if (type.isUnion()) {
                return type.types.some(isMutableTuple);
            }
            return isTupleType(type) && !type.target?.readonly;
        }

        function isObjectType(type) {
            if (type.isUnion()) {
                return type.types.some(isObjectType);
            }
            return (type.flags & ts.TypeFlags.Object) !== 0 || type.flags === ts.TypeFlags.NonPrimitive;
        }

        function checkAllowedType(type) {
            return type.isUnion() ? type.types.every(checkAllowedType) : isAllowedPrimitive(type);
        }

        function isAllowedPrimitiveArray(type, fallback) {
            if (type.isUnion()) {
                return type.types.every((t) => isAllowedPrimitiveArray(t, fallback));
            }
            if (isTupleType(type)) {
                return type.resolvedTypeArguments?.every(isAllowedPrimitive) ?? fallback;
            }
            if (isArrayType(type)) {
                const typeArgs = type.typeArguments || [];
                return typeArgs.length === 1 && isAllowedPrimitive(typeArgs[0]);
            }
            return fallback;
        }

        function isObjectLikeUnionType(type) {
            if (!type.isUnion()) return false;
            let hasObjectType = false;
            let hasAllowedPrimitive = false;
            for (const t of type.types) {
                hasObjectType = hasObjectType || isObjectType(t) || isArrayType(t) || isTupleType(t);
                hasAllowedPrimitive = hasAllowedPrimitive || (!isUndefinedType(t) && isAllowedPrimitive(t));
                if (hasObjectType && hasAllowedPrimitive) {
                    return true;
                }
            }
            return false;
        }

        function check(node) {
            const decorators = node.decorators;
            if (!decorators || decorators.length === 0) return;

            for (const decorator of decorators) {
                const expression = decorator.expression;
                let decoratorName = '';
                if (expression.type === 'CallExpression' && expression.callee.type === 'Identifier') {
                    decoratorName = expression.callee.name;
                } else if (expression.type === 'Identifier') {
                    decoratorName = expression.name;
                }

                if (!SCENE_DECORATORS.has(decoratorName)) continue;

                const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node.key);
                const symbol = checker.getSymbolAtLocation(tsNode);
                if (!symbol) return;

                const type = checker.getTypeOfSymbolAtLocation(symbol, tsNode);
                const typeString = checker.typeToString(type);
                const suggestions = [];

                if (isMutableArray(type)) {
                    suggestions.push('Mutable arrays are not allowed. Use readonly arrays instead.');
                } else if (isMutableTuple(type)) {
                    suggestions.push('Mutable tuples are not allowed. Use readonly tuples instead.');
                }

                if (decoratorName === 'SceneChangeDetection') {
                    if (!checkAllowedType(type)) {
                        if (isObjectLikeUnionType(type)) {
                            suggestions.push(
                                'Switch to @SceneObjectChangeDetection for (primitive | object | array) union properties.'
                            );
                        } else if (isArrayType(type) || isTupleType(type)) {
                            suggestions.push('Switch to @SceneArrayChangeDetection for array or tuple properties.');
                        } else if (isObjectType(type)) {
                            suggestions.push('Switch to @SceneObjectChangeDetection for object properties.');
                        } else {
                            suggestions.push('Property type is not allowed for change detection.');
                        }
                    }
                } else if (decoratorName === 'SceneArrayChangeDetection') {
                    if (isObjectLikeUnionType(type)) {
                        suggestions.push(
                            'Switch to @SceneObjectChangeDetection for (primitive | object | array) union properties.'
                        );
                    } else if (!isAllowedPrimitiveArray(type, false)) {
                        if (checkAllowedType(type)) {
                            suggestions.push('Switch to @SceneChangeDetection for primitive properties.');
                        } else if (!isArrayType(type) && !isTupleType(type) && isObjectType(type)) {
                            suggestions.push('Switch to @SceneObjectChangeDetection for object properties.');
                        }
                    }
                } else if (decoratorName === 'SceneObjectChangeDetection') {
                    if (checkAllowedType(type)) {
                        suggestions.push('Switch to @SceneChangeDetection for primitive properties.');
                    } else if (isObjectLikeUnionType(type)) {
                        // correct
                    } else if (isArrayType(type) || isTupleType(type)) {
                        suggestions.push('Switch to @SceneArrayChangeDetection for array or tuple properties.');
                    } else if (!isObjectType(type)) {
                        suggestions.push(
                            'SceneObjectChangeDetection should only be applied to non-array object types.'
                        );
                    }
                }

                if ((isArrayType(type) || isTupleType(type)) && !isAllowedPrimitiveArray(type, true)) {
                    suggestions.push(
                        'SceneArrayChangeDetection should only be applied to readonly (string | number | boolean)[] types.'
                    );
                }

                if (suggestions.length > 0) {
                    context.report({
                        node,
                        messageId: 'invalidDecoratorUsage',
                        data: {
                            decorator: decoratorName,
                            property: node.key.name || '<unknown>',
                            type: typeString,
                            suggestions: suggestions.map((s) => `* ${s}`).join('\n'),
                        },
                    });
                }
            }
        }

        return {
            PropertyDefinition(node) {
                check(node);
            },
            TSPropertySignature(node) {
                check(node);
            },
        };
    },
};
