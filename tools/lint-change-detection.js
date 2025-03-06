#!/usr/bin/env node
'use strict';

const ts = require('typescript');
const glob = require('glob');
const path = require('path');

/**
 * Returns true if the type is one of the allowed primitive types.
 * Allowed: number, boolean, string, or undefined.
 */
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

/**
 * Checks a type (or union of types) to ensure all constituents are allowed.
 */
function checkAllowedType(type) {
    if (type.isUnion()) {
        return type.types.every((t) => checkAllowedType(t));
    }
    return isAllowedPrimitive(type);
}

/**
 * Returns true if the type (or union) is (or includes) an array type.
 */
function isArrayType(type) {
    if (type.isUnion()) {
        return type.types.some((t) => isArrayType(t));
    }
    if (type.flags & ts.TypeFlags.Object) {
        if (type.objectFlags & ts.ObjectFlags.Reference && type.symbol) {
            const name = type.symbol.name;
            return name === 'Array' || name === 'ReadonlyArray';
        }
    }
    return false;
}

/**
 * Returns true if the type (or union) is (or includes) an object type.
 */
function isObjectType(type) {
    if (type.isUnion()) {
        return type.types.some((t) => isObjectType(t));
    }
    return (type.flags & ts.TypeFlags.Object) !== 0;
}

/**
 * Processes a source file AST and pushes any linting errors to the errors array.
 */
function processSourceFile(sourceFile, checker, errors) {
    function visit(node) {
        const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) : node.decorators;

        if (ts.isPropertyDeclaration(node) || ts.isPropertySignature(node)) {
            if (decorators && decorators.length > 0) {
                decorators.forEach((decorator) => {
                    let decoratorName = '';
                    if (ts.isCallExpression(decorator.expression)) {
                        if (ts.isIdentifier(decorator.expression.expression)) {
                            decoratorName = decorator.expression.expression.escapedText;
                        }
                    } else if (ts.isIdentifier(decorator.expression)) {
                        decoratorName = decorator.expression.escapedText;
                    }

                    if (decoratorName === 'ScenePathChangeDetection' || decoratorName === 'SceneChangeDetection') {
                        const propertyName = node.name.getText(sourceFile);
                        const symbol = checker.getSymbolAtLocation(node.name);
                        if (symbol) {
                            const type = checker.getTypeOfSymbolAtLocation(symbol, node);
                            const typeString = checker.typeToString(type);
                            if (!checkAllowedType(type)) {
                                let suggestion = '';
                                if (isArrayType(type)) {
                                    suggestion = 'Switch to @SceneArrayChangeDetection for array properties.';
                                } else if (isObjectType(type)) {
                                    suggestion = 'Switch to @SceneObjectChangeDetection for object properties.';
                                } else {
                                    suggestion = 'Property type is not allowed for change detection.';
                                }
                                const { line, character } = sourceFile.getLineAndCharacterOfPosition(
                                    node.name.getStart()
                                );
                                errors.push(
                                    `${sourceFile.fileName}:${line + 1}:${character + 1} - Decorator @${decoratorName} applied to property '${propertyName}' with type '${typeString}'. ${suggestion}`
                                );
                            }
                        }
                    }
                });
            }
        }
        ts.forEachChild(node, visit);
    }
    visit(sourceFile);
}

/**
 * Main function that gathers all TypeScript files and runs lint checks in one TypeScript program.
 */
function main() {
    const pattern = process.argv[2] || '**/*.ts';
    const filePaths = glob
        .sync(pattern, {
            ignore: ['**/node_modules/**', '**/dist/**', '**/test/**', '**/*.test.ts'],
        })
        .map((file) => path.resolve(process.cwd(), file));

    if (filePaths.length === 0) {
        console.log('No TypeScript files found.');
        process.exit(0);
    }

    // Create a single program for all files to reduce overhead.
    const program = ts.createProgram(filePaths, {
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.CommonJS,
        allowJs: true,
        checkJs: false,
    });

    const checker = program.getTypeChecker();
    const errors = [];

    filePaths.forEach((filePath) => {
        const sourceFile = program.getSourceFile(filePath);
        if (sourceFile) {
            processSourceFile(sourceFile, checker, errors);
        }
    });

    if (errors.length > 0) {
        console.error('Change detection lint errors found:');
        errors.forEach((err) => console.error(err));
        process.exit(1);
    } else {
        console.log('No change detection issues found.');
    }
}

main();
