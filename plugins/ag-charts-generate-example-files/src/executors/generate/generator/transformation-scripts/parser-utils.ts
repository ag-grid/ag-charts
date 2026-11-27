import { transform } from 'sucrase';
import ts from 'typescript';

export type ImportType = 'packages' | 'modules';

export interface BindingImport {
    isNamespaced: boolean;
    module: string;
    namedImport: string;
    imports: string[];
    // Set when the import must be emitted as `import type { ... }`: the example wrote it that way.
    isTypeOnly?: boolean;
}

// const moduleMapping = require("../../documentation/doc-pages/modules/modules.json");

export function readAsJsFile(srcFile, options: { includeImports: boolean } = undefined) {
    const tsFile = srcFile
        // Remove imports that are not required in javascript
        .replace(options?.includeImports ? '' : /import ((.|\r?\n)*?)from.*\r?\n/g, '')
        .replace(options?.includeImports ? '' : /import '.*';\r?\n/g, '')
        // Remove export statement
        .replace(/export /g, '');

    const jsFile = transform(tsFile, { transforms: ['typescript'], disableESTransforms: true }).code;

    return jsFile;
}

export function parseFile(src) {
    return ts.createSourceFile('tempFile.ts', src, ts.ScriptTarget.Latest, true);
}

// export interface PrinterOptions {
//     removeComments?: boolean;
//     newLine?: NewLineKind;
//     omitTrailingSemicolon?: boolean;
//     noEmitHelpers?: boolean;
// }
const printer = ts.createPrinter({
    removeComments: false,
    omitTrailingSemicolon: false,
});

export function tsGenerate(node, srcFile) {
    try {
        if (!node) {
            return '';
        }
        return printer.printNode(ts.EmitHint.Unspecified, node, srcFile);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
    }
    return 'ERROR - Printing';
}

export function modulesProcessor(modules: string[]) {
    const moduleImports = [];
    const suppliedModules = [];

    const requiredModules = [];
    modules.forEach((module) => {
        // let found = false;
        // eslint-disable-next-line no-console
        console.warn(`TODO: module mapping for ${module}`);
        // moduleMapping.forEach((moduleConfig) => {
        //   if (moduleConfig.shortname && moduleConfig.shortname == module) {
        //     requiredModules.push(moduleConfig);
        //     found = true;
        //   }
        // });
        // if (!found) {
        //   console.error(`Could not find module ${module} in modules.json`);
        // }
    });

    requiredModules.forEach((requiredModule) => {
        moduleImports.push(`import { ${requiredModule.exported} } from '${requiredModule.module}';`);
        suppliedModules.push(requiredModule.exported);
    });

    return { moduleImports, suppliedModules };
}

export function removeFunctionKeyword(code: string): string {
    return code.replace(/^(async )?function /, '$1').replace(/\n\s?function /, '\n ');
}

export function getFunctionName(code: string): string {
    const matches = /function\s+([^(\s]+)\(/.exec(code);
    return matches && matches.length === 2 ? matches[1].trim() : null;
}

export const convertFunctionToProperty = (code: string) =>
    code.replace(/(async )?function\s+([^(\s]+)\s*\(([^)]*)\)\s*((?::[^{]*?)?)\s*{/, '$2 = $1($3)$4 => {');

export const convertFunctionToConstProperty = (code: string) =>
    code.replace(/(async ){0,1}function\s+([^(\s]+)\s*\(([^)]*)\)\s*((?::[^{]*?)?)\s*{/, 'const $2 = $1($3)$4 => {');
export const convertFunctionToConstPropertyTs = (code: string) => {
    return code.replace(/(async ){0,1}function\s+([^(\s]+)\s*\(([^)]*)\)(:?\s+[^{]*)/, 'const $2 = $1($3) $4 =>');
};

export function isInstanceMethod(methods: string[], property: any): boolean {
    return methods.map(getFunctionName).filter((name) => name === property.name).length > 0;
}

export const enum NodeType {
    Variable = 'VariableDeclaration',
    Function = 'FunctionDeclaration',
    Expression = 'ExpressionStatement',
}

export function tsCollect(tsTree, tsBindings, collectors, recurse = true) {
    ts.forEachChild(tsTree, (node: ts.Node) => {
        collectors
            .filter((c) => {
                let res = false;
                try {
                    res = c.matches(node);
                } catch {
                    return false;
                }
                return res;
            })
            .forEach((c) => {
                c.apply(tsBindings, node);
            });
        if (recurse) {
            tsCollect(node, tsBindings, collectors, recurse);
        }
    });
    return tsBindings;
}

export function tsNodeIsGlobalVar(node: any): boolean {
    // eg: var currentRowHeight = 10;
    if (ts.isVariableDeclaration(node) && ts.isSourceFile(node.parent.parent.parent)) {
        return true;
    }
    return false;
}

export function tsNodeIsGlobalVarWithName(node: any, name: string): boolean {
    // eg: var currentRowHeight = 10;
    if (ts.isVariableDeclaration(node) && ts.isSourceFile(node.parent.parent.parent)) {
        return node.name.getText() === name;
    }
    return false;
}

export function tsNodeIsPropertyWithName(node: ts.Node, name: string) {
    if (ts.isPropertyAssignment(node)) {
        if (node.name.getText() === name) {
            // If the name matches the initializer then the property will get added via
            // the top level variable matching a gridProperty name
            // This means that we include cellRenderer properties like
            // detailCellRenderer: DetailCellRenderer,
            if (node.name.getText() === node.initializer.getText()) {
                return false;
            }
            return true;
        }
    }
}

export function tsNodeIsTopLevelVariable(node: ts.Node, registered: string[] = []) {
    if (ts.isVariableDeclarationList(node)) {
        // Not registered already
        // are a top level variable declaration so that we do not match variables within function scopes
        // Is not just a type declaration i.e declare function getData: () => any[];
        if (node.declarations.length > 0) {
            const declaration = node.declarations[0];
            return (
                !isDeclareStatement(node.parent) &&
                registered.indexOf(declaration.name.getText()) < 0 &&
                ts.isSourceFile(node.parent.parent)
            );
        }
    }
}

export function tsNodeIsFunctionWithName(node: ts.Node, name: string): boolean {
    // eg: function someFunction() { }
    if (ts.isFunctionDeclaration(node)) {
        const isMatch = node?.name?.getText() === name;
        return isMatch;
    }
    return false;
}

export function tsNodeIsInScope(node: any, unboundInstanceMethods: string[]): boolean {
    return (
        unboundInstanceMethods &&
        ts.isFunctionDeclaration(node) &&
        node.name &&
        unboundInstanceMethods.indexOf(node.name.getText()) >= 0
    );
}

export function tsNodeIsUnusedFunction(node: any, used: string[], unboundInstanceMethods: string[]): boolean {
    if (!tsNodeIsInScope(node, unboundInstanceMethods)) {
        if (ts.isFunctionLike(node) && used.indexOf(node.name.getText()) < 0) {
            const isTopLevel = ts.isSourceFile(node.parent);
            return isTopLevel && !isDeclareStatement(node);
        }
    }
    return false;
}

function isDeclareStatement(node) {
    return node && node.modifiers && node.modifiers.some((m) => m.getText() === 'declare');
}

export function tsNodeIsTypeDeclaration(node: any): boolean {
    if (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) {
        return true;
    }
    if (ts.isFunctionDeclaration(node) || ts.isVariableStatement(node)) {
        return isDeclareStatement(node);
    }
    return false;
}

export function tsNodeIsPropertyAccessExpressionOf(node: any, properties: string[]): boolean {
    if (properties.length !== 2) {
        throw new Error('Implement this');
    }
    return (
        ts.isPropertyAccessExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.escapedText === properties[0] &&
        ts.isIdentifier(node.name) &&
        node.name.escapedText === properties[1]
    );
}

export function tsNodeIsFunctionCall(node: any): boolean {
    return ts.isCallExpression(node);
}

export function tsNodeIsGlobalFunctionCall(node: ts.Node) {
    // Get top level function calls like
    // setInterval(callback, 500)
    // but don't match things like
    // AgCharts.create(options)
    if (ts.isExpressionStatement(node)) {
        return (
            ts.isSourceFile(node.parent) &&
            ts.isCallExpression(node.expression) &&
            ts.isIdentifier(node.expression.expression)
        );
    }
}

export const recognizedDomEvents = ['click', 'change', 'input', 'dragover', 'dragstart', 'drop'];

function flatMap<T>(array: T[], callback: (value: T) => T): T[] {
    return Array.prototype.concat.apply([], array.map(callback));
}

const extractEventHandlerBody = (code: string) => code.match(/^(\w+)\((.*)\)/);

/*
 * for each of the recognised events (click, change etc) extract the corresponding event handler, with (optional) params
 * eg: onclick="refreshEvenRowsCurrencyData()"
 */
export function extractEventHandlers(domTree: any, eventNames: string[]) {
    const getHandlerAttributes = (event: string) => {
        const handlerName = `on${event}`;

        return domTree(`[${handlerName}]`).map((index, el) => {
            return domTree(el).attr(handlerName);
        });
    };

    return flatMap(eventNames, (event: string) => {
        const result = getHandlerAttributes(event)
            .map((index, el) => {
                return [extractEventHandlerBody(el)];
            })
            .toArray();

        return result;
    });
}

export function removeInScopeJsDoc(method: string): string {
    return method.replace(/\/\*\*\s*inScope.*\*\/\n/g, '');
}

// functions marked with an "inScope" comment will be handled as "instance" methods, as opposed to (global/unused)
// "util" ones
export function extractUnboundInstanceMethods(srcFile: ts.SourceFile) {
    let inScopeMethods = [];
    srcFile.statements.forEach((node) => {
        if (ts.isFunctionDeclaration(node)) {
            const docs = (node as any).jsDoc;
            if (docs && docs.length > 0) {
                docs.forEach((doc) => {
                    const trimmed = doc.comment.trim() || '';
                    if (trimmed.includes('inScope')) {
                        inScopeMethods = [...inScopeMethods, node.name?.getText()];
                    }
                });
            }
        }
    });
    return inScopeMethods;
}

export function extractTypeInfoForVariable(srcFile: ts.SourceFile, varName: string) {
    let typeStr = undefined;
    let typeParts = [];
    srcFile.statements.forEach((node) => {
        if (ts.isVariableStatement(node)) {
            node.declarationList.declarations.forEach((dec) => {
                if (ts.isVariableDeclaration(dec) && dec.name.getText() == varName && dec.type) {
                    typeStr = dec.type.getText();
                    typeParts = getTypes(dec.type);
                }
            });
        }
    });
    return { typeStr, typeParts };
}

export const DEFAULT_OPTIONS_TYPE = 'AgChartOptions';

/** The declared type of a chart's options variable, or `AgChartOptions` where the example declares none. */
export function getPropertyOptionsType(property: { typeInfo?: { typeStr?: string } }): string {
    return property.typeInfo?.typeStr ?? DEFAULT_OPTIONS_TYPE;
}

/** Whether any chart's options variable is typed with the `AgChartOptions` fallback. */
export function usesDefaultOptionsType(bindings: {
    chartProperties?: Record<string, string>;
    properties: { name: string; typeInfo?: { typeStr?: string } }[];
}): boolean {
    const chartVariables = Object.values(bindings.chartProperties ?? {});
    return bindings.properties.some((p) => chartVariables.includes(p.name) && !p.typeInfo?.typeStr);
}

/** The names a binding declares, looking through destructuring patterns. */
function bindingNames(name: ts.BindingName): string[] {
    if (ts.isIdentifier(name)) {
        return [name.text];
    }
    return name.elements.flatMap((element) => (ts.isOmittedExpression(element) ? [] : bindingNames(element.name)));
}

/** Whether `scope` declares `name` itself, as a parameter or as a `const`/`let`/`var`/function directly in its body. */
function declaresName(scope: ts.Node, name: string): boolean {
    if (ts.isFunctionLike(scope) && scope.parameters.some((p) => bindingNames(p.name).includes(name))) {
        return true;
    }
    const statements = ts.isSourceFile(scope) || ts.isBlock(scope) ? scope.statements : [];
    return statements.some((statement) =>
        ts.isVariableStatement(statement)
            ? statement.declarationList.declarations.some((d) => bindingNames(d.name).includes(name))
            : ts.isFunctionDeclaration(statement) && statement.name?.text === name
    );
}

/** Whether `node`, an identifier, names something rather than reading a variable: `a.node`, `{ node: 1 }`, `const node`. */
function isNameNotRead(node: ts.Identifier): boolean {
    const parent = node.parent;
    if (ts.isPropertyAccessExpression(parent) || ts.isQualifiedName(parent)) {
        return (ts.isPropertyAccessExpression(parent) ? parent.name : parent.right) === node;
    }
    if (ts.isBindingElement(parent)) {
        // `const { node } = x` and `const { node: y } = x` declare, or name a property of, the pattern; a default value reads.
        return parent.name === node || parent.propertyName === node;
    }
    return (
        (ts.isPropertyAssignment(parent) ||
            ts.isMethodDeclaration(parent) ||
            ts.isPropertyDeclaration(parent) ||
            ts.isGetAccessorDeclaration(parent) ||
            ts.isSetAccessorDeclaration(parent) ||
            ts.isVariableDeclaration(parent) ||
            ts.isParameter(parent) ||
            ts.isFunctionLike(parent) ||
            ts.isClassLike(parent) ||
            ts.isLabeledStatement(parent) ||
            ts.isBreakOrContinueStatement(parent)) &&
        (parent as { name?: ts.Node; label?: ts.Node }).name === node
    );
}

function isShadowed(node: ts.Identifier, root: ts.Node): boolean {
    for (let scope = node.parent; scope && scope !== root.parent; scope = scope.parent) {
        if (declaresName(scope, node.text)) {
            return true;
        }
    }
    return false;
}

/**
 * Rewrites reads of the chart options variables named in `names` (e.g. `options.series` in a callback, or
 * `...options1` in a second chart's options) to the framework's own reference to them, such as `this.options`.
 * It works on the syntax tree, so a read inside a template literal's `${}` counts, and `{ options }` becomes
 * `{ options: this.options }`. Member accesses (`other.options`), property keys, declarations, names that a
 * function or block declares itself, types, and the contents of strings and comments are left alone.
 */
export function replaceOptionsReferences(code: string, names: string[], toReference: (name: string) => string): string {
    if (names.length === 0) {
        return code;
    }

    // The code is an expression (`{ ...options }`, a callback) or statements (`const { series } = options;`).
    const parse = (text: string) => {
        const source = ts.createSourceFile('x.ts', text, ts.ScriptTarget.Latest, true);
        return { source, valid: (source as any).parseDiagnostics.length === 0 };
    };
    const prefix = 'const x = (';
    const asExpression = parse(`${prefix}${code}\n)`);
    const asStatements = asExpression.valid ? undefined : parse(code);
    const { source } = asStatements ?? asExpression;
    const offset = asStatements ? 0 : prefix.length;
    const root: ts.Node = asStatements ? source : (source.statements[0] as ts.VariableStatement).declarationList;

    const edits: { start: number; end: number; text: string }[] = [];
    const visit = (node: ts.Node) => {
        if (ts.isTypeNode(node)) {
            return;
        }
        if (ts.isIdentifier(node) && names.includes(node.text) && !isNameNotRead(node) && !isShadowed(node, root)) {
            const reference = toReference(node.text);
            const shorthand = ts.isShorthandPropertyAssignment(node.parent) && node.parent.name === node;
            if (reference !== node.text) {
                const text = shorthand ? `${node.text}: ${reference}` : reference;
                edits.push({ start: node.getStart(source) - offset, end: node.getEnd() - offset, text });
            }
        }
        ts.forEachChild(node, visit);
    };
    visit(root);

    return edits.reduceRight((result, { start, end, text }) => result.slice(0, start) + text + result.slice(end), code);
}

/**
 * The other charts' options variables that a chart's options read (`{ ...options1 }`), dependencies first.
 * Each chart becomes its own component in the Angular and Vue variants, so a component has to declare these
 * itself.
 */
export function getReferencedOptions(bindings: any, property: { name: string; value: string }): any[] {
    const all: any[] = bindings.properties.filter((p: any) =>
        Object.values(bindings.chartProperties ?? {}).includes(p.name)
    );
    const ordered: any[] = [];
    // Charts may read each other (`options1`'s callback reads `options2`, which spreads `options1`), so a chart is
    // visited once, and `property` itself is never a dependency of its own.
    const visited = new Set<string>([property.name]);
    const visit = (current: { name: string; value: string }) => {
        const others = all.filter((p) => p.name !== current.name);
        const referenced = new Set<string>();
        replaceOptionsReferences(
            current.value,
            others.map((p) => p.name),
            (name) => {
                referenced.add(name);
                return name;
            }
        );
        for (const dependency of others.filter((p) => referenced.has(p.name))) {
            if (!visited.has(dependency.name)) {
                visited.add(dependency.name);
                visit(dependency);
                ordered.push(dependency);
            }
        }
    };
    visit(property);
    return ordered;
}

/** `value` with the bodies of its functions emptied, leaving only what is evaluated when `value` itself is. */
function withoutFunctionBodies(value: string): string {
    const prefix = 'const x = ';
    const source = ts.createSourceFile('x.ts', `${prefix}${value}`, ts.ScriptTarget.Latest, true);
    const ranges: [number, number, boolean][] = [];
    const visit = (node: ts.Node) => {
        if (ts.isFunctionLike(node) && 'body' in node && node.body) {
            ranges.push([
                node.body.getStart(source) - prefix.length,
                node.body.getEnd() - prefix.length,
                ts.isBlock(node.body),
            ]);
        } else {
            ts.forEachChild(node, visit);
        }
    };
    visit(source);

    // Keep the body syntactically valid, and its length, so the result still parses with the same offsets.
    let result = value;
    for (const [start, end, isBlock] of ranges) {
        const blank = isBlock ? `{${' '.repeat(end - start - 2)}}` : `0${' '.repeat(end - start - 1)}`;
        result = result.slice(0, start) + blank + result.slice(end);
    }
    return result;
}

/**
 * `getReferencedOptions`, split into those declared before `property`'s own options and those that follow them.
 * A chart has to be declared before any chart whose options evaluate it (`options2 = { ...options1 }`), whereas a
 * read inside a callback (`() => options2.series`) only needs it declared by the time the callback runs. So when
 * charts read each other, which one comes first depends on which of the reads are in callbacks.
 */
export function splitReferencedOptions(
    bindings: any,
    property: { name: string; value: string }
): { before: any[]; after: any[] } {
    const charts = [...getReferencedOptions(bindings, property), property];
    const ordered: any[] = [];
    const visited = new Set<string>();
    const visit = (chart: { name: string; value: string }) => {
        visited.add(chart.name);
        const evaluated = withoutFunctionBodies(chart.value);
        for (const other of charts) {
            if (visited.has(other.name)) {
                continue;
            }
            let readsOther = false;
            replaceOptionsReferences(evaluated, [other.name], (name) => {
                readsOther = true;
                return name;
            });
            if (readsOther) {
                visit(other);
            }
        }
        ordered.push(chart);
    };
    charts.forEach((chart) => !visited.has(chart.name) && visit(chart));

    const index = ordered.indexOf(property);
    return { before: ordered.slice(0, index), after: ordered.slice(index + 1) };
}

// Types that need no import: the DOM and TypeScript's own globals, and the generic parameters charts use.
const NON_IMPORTED_TYPES = new Set([
    'HTMLElement',
    'Function',
    'TData',
    'TContext',
    'TValue',
    // TypeScript utility and built-in types
    'Array',
    'ReadonlyArray',
    'Partial',
    'Required',
    'Readonly',
    'Record',
    'Pick',
    'Omit',
    'Exclude',
    'Extract',
    'NonNullable',
    'Parameters',
    'ConstructorParameters',
    'ReturnType',
    'InstanceType',
    'Awaited',
    'Promise',
    'Map',
    'Set',
]);

export function getTypes(node: ts.Node) {
    let typesToInclude = [];
    if (ts.isIdentifier(node)) {
        const typeName = node.getText();
        if (!NON_IMPORTED_TYPES.has(typeName)) {
            typesToInclude.push(typeName);
        }
    }
    node.forEachChild((ct) => {
        // Only recurse down the type branches of the tree so we do not include argument names
        if ((ct as any).type) {
            typesToInclude = [...typesToInclude, ...getTypes((ct as any).type)];
        } else {
            typesToInclude = [...typesToInclude, ...getTypes(ct)];
        }
    });
    return typesToInclude;
}

// `chart.update(...)` is handled via declarative state binding in the framework variants, so it is
// excluded here. The `\b` ensures only `chart.update` itself is excluded — `chart.updateDelta(...)`
// and other instance methods are still detected as chart-API usage and wired to a component ref.
const CHART_API_EXPRESSIONS = [/AgCharts\.(?!create|createFinancialChart|createGauge)/, /chart\.(?!update\b)/];
export function usesChartApi(node: ts.Node) {
    if (ts.isCallExpression(node)) {
        const nodeText = node.getText();
        if (CHART_API_EXPRESSIONS.some((e) => e.test(nodeText))) {
            return true;
        }
    }

    let usesApi = false;
    node.forEachChild((ct) => {
        usesApi ||= usesChartApi(ct);
    });
    return usesApi;
}

export function extractImportStatements(srcFile: ts.SourceFile): BindingImport[] {
    const allImports = [];
    srcFile.statements.forEach((node) => {
        if (ts.isImportDeclaration(node)) {
            const module = node.moduleSpecifier.getText();
            const moduleImports = node.importClause;
            const imports = [];
            let namedImport = undefined;
            let isNamespaced = true;

            if (moduleImports?.namedBindings) {
                if (!ts.isNamespaceImport(moduleImports.namedBindings)) {
                    isNamespaced = false;
                }
                moduleImports.namedBindings.forEachChild((o) => {
                    imports.push(o.getText());
                });
            }
            if (moduleImports?.name) {
                namedImport = moduleImports.name.getText();
                isNamespaced = false;
            }
            allImports.push({
                module,
                isNamespaced,
                namedImport,
                imports,
                isTypeOnly: moduleImports?.isTypeOnly === true,
            });
        }
    });
    return allImports;
}

export function extractTypeDeclarations(srcFile: ts.SourceFile) {
    const allDeclareStatements = [];
    srcFile.statements.forEach((node) => {
        if ((ts.isVariableStatement(node) || ts.isFunctionDeclaration(node)) && node.modifiers?.length > 0) {
            if (node.modifiers.some((s) => s.kind === ts.SyntaxKind.DeclareKeyword)) {
                allDeclareStatements.push(node.getText());
            }
        }
    });
    return allDeclareStatements;
}

export function extractClassDeclarations(srcFile: ts.SourceFile) {
    const allClasses = [];
    srcFile.statements.forEach((node) => {
        if (ts.isClassDeclaration(node)) {
            allClasses.push(node.getText());
        }
    });
    return allClasses;
}

export function extractInterfaces(srcFile: ts.SourceFile) {
    const allInterfaces = [];
    srcFile.statements.forEach((node) => {
        if (ts.isInterfaceDeclaration(node)) {
            allInterfaces.push(node.getText());
        }
    });
    return allInterfaces;
}

export function tsNodeIsTopLevelFunction(node: any): boolean {
    if (ts.isFunctionLike(node)) {
        const isTopLevel = ts.isSourceFile(node.parent);
        return isTopLevel;
    }
    return false;
}

/**
 * Find all the variables defined in this node tree recursively
 */
export function findAllVariables(node) {
    let allVariables = [];
    if (ts.isClassDeclaration(node)) {
        allVariables.push(node.name.getText());
    }
    if (ts.isVariableDeclaration(node)) {
        if (ts.isObjectBindingPattern(node.name)) {
            // Code like this:  const { pageSetup, margins } = getSheetConfig();
            node.name.elements.forEach((n) => allVariables.push(n.getText()));
        } else {
            allVariables.push(node.name.getText());
        }
    }
    if (ts.isFunctionDeclaration(node)) {
        // catch locally defined functions within the main function body
        // function setMessage(msg: string) { ... }
        allVariables.push(node.name.getText());
    }
    if (ts.isParameter(node)) {
        // catch locally defined arrow functions with their params
        //  const colToNameFunc = (col: Column, index: number) => index + ' = ' + col.getId()
        //  const colNames = cols.map(colToNameFunc).join(', ')

        allVariables.push(node.name.getText());
    }
    ts.forEachChild(node, (n) => {
        const variables = findAllVariables(n);
        if (variables.length > 0) {
            allVariables = [...allVariables, ...variables];
        }
    });
    return allVariables;
}

function getLowestExpression(exp: any) {
    let hasExpression = true;
    while (hasExpression) {
        hasExpression = exp.expression;
        if (hasExpression) {
            exp = exp.expression as any;
        }
    }
    return exp;
}

/**
 * Find all the properties accessed in this node.
 */
export function findAllAccessedProperties(node) {
    let properties = [];
    if (ts.isIdentifier(node)) {
        const property = node.getText();
        if (property !== 'undefined' && property !== 'null') {
            properties.push(node.getText());
        }
    } else if (ts.isCallExpression(node) || ts.isPropertyAccessExpression(node)) {
        // When there are chained accesses we need to recurse to the lowest identifier as this is the first in the statement,
        // and will be the true accessed variable.
        // i.e gridOptions.api!.getModel().getRowCount() we need to recurse down the tree to extract gridOptions
        const exp = getLowestExpression(node.expression);

        if (ts.isArrayLiteralExpression(exp)) {
            // Check if the array has any properties in it that are dependencies
            properties = [...properties, ...findAllAccessedProperties(exp)];
        } else {
            properties.push(exp.getText());
        }
        if (ts.isCallExpression(node) && node.arguments) {
            // Check arguments
            properties = [...properties, ...findAllAccessedProperties(node.arguments)];
        }
    } else if (ts.isBinaryExpression(node)) {
        // In this function we set swimmingHeight but are not dependent on it,
        // so for binary expressions we only check the right hand branch
        // function setSwimmingHeight(height: number) {
        //      swimmingHeight = height
        //      gridOptions.api!.resetRowHeights()
        // }
        const rightProps = findAllAccessedProperties(node.right);
        if (rightProps.length > 0) {
            properties = [...properties, ...rightProps];
        }
    } else if (ts.isVariableDeclaration(node)) {
        // get lowest identifier as this is the first in the statement
        // i.e var nextHeader = params.nextHeaderPosition
        // we need to recurse down the initializer tree to extract params and not nextHeaderPosition
        const init = node.initializer as any;
        if (init) {
            const exp = getLowestExpression(init);
            properties = [...properties, ...findAllAccessedProperties(exp)];
        }
    } else if (ts.isPropertyAssignment(node)) {
        // Ignore the name of rowIndex just check what is being assigned
        //  {
        //      rowIndex: nextRowIndex,
        //  }
        if (node.initializer) {
            properties = [...properties, ...findAllAccessedProperties(node.initializer)];
        }
    } else if (ts.isExpressionStatement(node)) {
        if (node.expression) {
            properties = [...properties, ...findAllAccessedProperties(node.expression)];
        }
    } else if (ts.isClassDeclaration(node)) {
        // Do nothing for Class declarations as this is likely a cell renderer setup
    } else if (ts.isTypeReferenceNode(node)) {
        // Do nothing for Type references
    } else if (node instanceof Array) {
        node.forEach((element) => {
            properties = [...properties, ...findAllAccessedProperties(element)];
        });
    } else {
        // Recurse down the tree looking for more accessed properties
        ts.forEachChild(node, (n) => {
            const props = findAllAccessedProperties(n);
            if (props.length > 0) {
                properties = [...properties, ...props];
            }
        });
    }

    return properties;
}

/** Convert import paths to their package equivalent when the docs are in Packages mode
 * i.e import { GridOptions } from '@ag-grid-community/core';
 * to
 * import { GridOptions } from '@ag-grid-community';
 */
export function convertImportPath(modulePackage: string, convertToPackage: boolean) {
    if (convertToPackage) {
        const conversions = {
            "'@ag-grid-community/angular'": "'ag-grid-angular'",
            '"@ag-grid-community/angular"': "'ag-grid-angular'",
            "'@ag-grid-community/vue3'": "'ag-grid-vue3'",
            '"@ag-grid-community/vue3"': "'ag-grid-vue3'",
            "'@ag-grid-community/vue'": "'ag-grid-vue'",
            '"@ag-grid-community/vue"': "'ag-grid-vue'",
            "'@ag-grid-community/react'": "'ag-grid-react'",
            '"@ag-grid-community/react"': "'ag-grid-react'",
        };
        if (conversions[modulePackage]) {
            return conversions[modulePackage];
        }

        if (modulePackage.includes('@ag-grid-community/core/dist')) {
            return modulePackage.replace('@ag-grid-community/core/dist', 'ag-grid-community/dist');
        }
        if (modulePackage.includes('@ag-grid-community/styles')) {
            return modulePackage.replace('@ag-grid-community/styles', 'ag-grid-community/styles');
        }

        if (modulePackage.includes('@ag-grid-community')) {
            return `'ag-grid-community'`;
        }
        if (modulePackage.includes('@ag-grid-enterprise')) {
            return `'ag-grid-enterprise'`;
        }
    }
    return modulePackage.replace('_typescript', '').replace(/"/g, `'`);
}

export function getImport(filename: string) {
    const componentFileName = filename.split('.')[0];
    const componentName = componentFileName[0].toUpperCase() + componentFileName.slice(1);
    return `import { ${componentName} } from './${componentFileName}';`;
}

export function getPropertyInterfaces(properties) {
    let propTypesUsed = [];
    properties.forEach((prop) => {
        if (prop.typings?.typesToInclude?.length > 0) {
            propTypesUsed = [...propTypesUsed, ...prop.typings.typesToInclude];
        }
    });
    return [...new Set(propTypesUsed)];
}

/** The name an import specifier brings into scope: `type Foo` and `Foo` both bind `Foo`. */
export function getImportedName(specifier: string): string {
    return specifier.replace(/^type\s+/, '');
}

/**
 * Make sure `name` is imported from `module` (quoted, as in `bindings.imports`), unless some import
 * of the example already brings it into scope.
 */
export function ensureNamedImport(bindingImports: BindingImport[], module: string, name: string) {
    if (bindingImports.some((i) => i.imports.some((specifier) => getImportedName(specifier) === name))) {
        return;
    }
    const existing = bindingImports.find((i) => i.module === module && !i.isNamespaced);
    if (existing) {
        existing.imports = [...existing.imports, name];
    } else {
        bindingImports.push({ module, isNamespaced: false, namedImport: undefined, imports: [name] });
    }
}

/**
 *  Add the imports from the parsed file
 * We ignore any component files as those imports are generated for each framework.
 */
export function addBindingImports(
    bindingImports: any,
    imports: string[],
    convertToPackage: boolean,
    ignoreTsImports: boolean
) {
    const workingImports: Record<string, { namedImport: string; imports: string[]; isTypeOnly: boolean }> = {};
    const namespacedImports = [];

    bindingImports.forEach((i: BindingImport) => {
        const path = convertImportPath(i.module, convertToPackage);
        if (!i.module.includes('_typescript') || !ignoreTsImports) {
            workingImports[path] = workingImports[path] || {
                namedImport: undefined,
                imports: [],
                // `import type` only when every import contributing to this path is type-only.
                isTypeOnly: true,
            };
            workingImports[path].isTypeOnly &&= i.isTypeOnly === true;
            if (i.isNamespaced) {
                if (i.imports.length > 0) {
                    namespacedImports.push(`import * as ${i.imports[0]} from ${path};`);
                } else {
                    namespacedImports.push(`import ${path};`);
                }
            } else {
                if (i.namedImport) {
                    workingImports[path] = {
                        ...workingImports[path],
                        namedImport: i.namedImport,
                    };
                }
                if (i.imports) {
                    workingImports[path] = {
                        ...workingImports[path],
                        imports: [...workingImports[path].imports, ...i.imports],
                    };
                }
            }
        }
    });

    imports.push(...new Set(namespacedImports));

    let hasEnterpriseModules = false;
    Object.entries(workingImports).forEach(([k, v]) => {
        let unique = [...new Set(v.imports)].sort();

        if (convertToPackage && k.includes('ag-grid')) {
            // Remove module related imports
            unique = unique.filter((i) => !i.includes('Module') || i == 'AgGridModule');
            hasEnterpriseModules ||= k.includes('enterprise');
        }
        if (unique.length > 0 || v.namedImport) {
            const namedImport = v.namedImport ? v.namedImport : '';
            const importStr = unique.length > 0 ? `{ ${unique.join(', ')} }` : '';
            const joiningComma = namedImport && importStr ? ', ' : '';
            const typeKeyword = v.isTypeOnly ? 'type ' : '';
            imports.push(`import ${typeKeyword}${namedImport}${joiningComma}${importStr} from ${k};`);
        }
    });
    if (hasEnterpriseModules && convertToPackage) {
        imports.push(`import 'ag-grid-enterprise';`);
    }
}

export function getModuleRegistration({ gridSettings, enterprise, exampleName }) {
    const moduleRegistration = ["import { ModuleRegistry } from '@ag-grid-community/core';"];
    const modules = gridSettings.modules;

    if (enterprise && !Array.isArray(modules)) {
        throw new Error(
            `The example ${exampleName} has "enterprise" : true but no modules have been provided "modules":[...]. Either remove the enterprise flag or provide the required modules.`
        );
    }

    const exampleModules = Array.isArray(modules) ? modules : ['clientside'];
    const { moduleImports, suppliedModules } = modulesProcessor(exampleModules);
    moduleRegistration.push(...moduleImports);
    const gridSuppliedModules = `[${suppliedModules.join(', ')}]`;

    moduleRegistration.push(`\n// Register the required feature modules with the Grid`);
    moduleRegistration.push(`ModuleRegistry.registerModules(${gridSuppliedModules})`);
    return moduleRegistration;
}

export function handleRowGenericInterface(fileTxt: string, tData: string): string {
    if (tData) {
        fileTxt = fileTxt
            .replace(
                /<(TData|TValue|TContext|any)?(, )?(TData|TValue|TContext|any)?(, )?(TData|TValue|TContext|any)?>/g,
                ''
            )
            .replace(/TData\[\]/g, `${tData}[]`);
    } else {
        fileTxt = fileTxt.replace(/<TData>/g, '').replace(/TData\[\]/g, 'any[]');
    }
    return fileTxt;
}

export function addGenericInterfaceImport(imports: string[], tData: string, bindings) {
    if (tData && !bindings.interfaces.some((i) => i.includes(tData)) && !imports.some((i) => i.includes(tData))) {
        imports.push(`import { ${tData} } from './interfaces'`);
    }
}

export type ChartAPI = 'financial' | 'gauge' | 'quadrant' | 'sparkline' | 'vanilla' | 'volume-profile';

export function chartApi(bindings: any): ChartAPI {
    // An example's charts need not be called `options`, so fall back to its first chart's declared type.
    const firstChart = bindings.properties?.find(
        (p: any) => p.name === Object.values(bindings.chartProperties ?? {})[0]
    );
    const typeStr = bindings.optionsTypeInfo?.typeStr ?? firstChart?.typeInfo?.typeStr;
    if (typeStr === 'AgFinancialChartOptions') {
        return 'financial';
    } else if (
        typeStr === 'AgGaugeOptions' ||
        typeStr === 'AgRadialGaugeOptions' ||
        typeStr === 'AgLinearGaugeOptions'
    ) {
        return 'gauge';
    } else if (typeStr === 'AgQuadrantChartOptions') {
        return 'quadrant';
    } else if (typeStr === 'AgSparklineOptions') {
        return 'sparkline';
    } else if (typeStr === 'AgVolumeProfileChartOptions') {
        return 'volume-profile';
    }
    return 'vanilla';
}
