// -*- Mode: js2; -*-
/**
 * @fileoverview Enforce explicit generic arguments for all generic types in the project
 */
import { ESLintUtils } from '@typescript-eslint/utils';
import ts from 'typescript';

/** @type {import('eslint').Rule.RuleModule} */
export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Require explicit generic type arguments for all exported generic types/interfaces.',
        },
        messages: {
            requireGeneric: "'{{name}}' is a generic type and requires explicit type arguments.",
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

        const program = parserServices.program;
        const typeChecker = program.getTypeChecker();

        // Collect all generic type declarations (interfaces/types with type parameters)
        const genericTypeNames = new Map();

        for (const sourceFile of program.getSourceFiles()) {
            if (sourceFile.isDeclarationFile || sourceFile.fileName.includes('node_modules')) continue;

            ts.forEachChild(sourceFile, (node) => {
                if (
                    (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) &&
                    node.typeParameters &&
                    node.typeParameters.length > 0 &&
                    node.name
                ) {
                    const symbol = typeChecker.getSymbolAtLocation(node.name);
                    if (symbol) {
                        genericTypeNames.set(symbol.getName(), node.typeParameters.length);
                    }
                }
            });
        }

        // Helper to check and report if type ref is missing generics
        function checkTypeReference(node, typeName, typeArguments) {
            const name = typeName?.name ?? typeName?.right?.name;
            const argCount = genericTypeNames.get(name);
            if (argCount === undefined) return;

            if (typeArguments?.length !== argCount) {
                context.report({
                    node,
                    messageId: 'requireGeneric',
                    data: { name: typeName.name || typeName.right?.name },
                });
            }
        }

        return {
            TSInterfaceDeclaration(node) {
                for (const baseNode of node.extends) {
                    checkTypeReference(baseNode, baseNode.expression, baseNode.typeArguments?.params);
                }
            },
            TSTypeReference(node) {
                checkTypeReference(node, node.typeName, node.typeArguments?.params);
            },
        };
    },
};
