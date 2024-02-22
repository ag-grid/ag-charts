"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    NodeType: function() {
        return NodeType;
    },
    addBindingImports: function() {
        return addBindingImports;
    },
    addGenericInterfaceImport: function() {
        return addGenericInterfaceImport;
    },
    convertFunctionToConstProperty: function() {
        return convertFunctionToConstProperty;
    },
    convertFunctionToConstPropertyTs: function() {
        return convertFunctionToConstPropertyTs;
    },
    convertFunctionToProperty: function() {
        return convertFunctionToProperty;
    },
    convertImportPath: function() {
        return convertImportPath;
    },
    extractClassDeclarations: function() {
        return extractClassDeclarations;
    },
    extractEventHandlers: function() {
        return extractEventHandlers;
    },
    extractImportStatements: function() {
        return extractImportStatements;
    },
    extractInterfaces: function() {
        return extractInterfaces;
    },
    extractTypeDeclarations: function() {
        return extractTypeDeclarations;
    },
    extractTypeInfoForVariable: function() {
        return extractTypeInfoForVariable;
    },
    extractUnboundInstanceMethods: function() {
        return extractUnboundInstanceMethods;
    },
    findAllAccessedProperties: function() {
        return findAllAccessedProperties;
    },
    findAllVariables: function() {
        return findAllVariables;
    },
    getFunctionName: function() {
        return getFunctionName;
    },
    getImport: function() {
        return getImport;
    },
    getModuleRegistration: function() {
        return getModuleRegistration;
    },
    getPropertyInterfaces: function() {
        return getPropertyInterfaces;
    },
    getTypes: function() {
        return getTypes;
    },
    handleRowGenericInterface: function() {
        return handleRowGenericInterface;
    },
    isInstanceMethod: function() {
        return isInstanceMethod;
    },
    modulesProcessor: function() {
        return modulesProcessor;
    },
    parseFile: function() {
        return parseFile;
    },
    readAsJsFile: function() {
        return readAsJsFile;
    },
    recognizedDomEvents: function() {
        return recognizedDomEvents;
    },
    removeFunctionKeyword: function() {
        return removeFunctionKeyword;
    },
    removeInScopeJsDoc: function() {
        return removeInScopeJsDoc;
    },
    tsCollect: function() {
        return tsCollect;
    },
    tsGenerate: function() {
        return tsGenerate;
    },
    tsNodeIsFunctionCall: function() {
        return tsNodeIsFunctionCall;
    },
    tsNodeIsFunctionWithName: function() {
        return tsNodeIsFunctionWithName;
    },
    tsNodeIsGlobalFunctionCall: function() {
        return tsNodeIsGlobalFunctionCall;
    },
    tsNodeIsGlobalVar: function() {
        return tsNodeIsGlobalVar;
    },
    tsNodeIsGlobalVarWithName: function() {
        return tsNodeIsGlobalVarWithName;
    },
    tsNodeIsInScope: function() {
        return tsNodeIsInScope;
    },
    tsNodeIsPropertyAccessExpressionOf: function() {
        return tsNodeIsPropertyAccessExpressionOf;
    },
    tsNodeIsPropertyWithName: function() {
        return tsNodeIsPropertyWithName;
    },
    tsNodeIsTopLevelFunction: function() {
        return tsNodeIsTopLevelFunction;
    },
    tsNodeIsTopLevelVariable: function() {
        return tsNodeIsTopLevelVariable;
    },
    tsNodeIsTypeDeclaration: function() {
        return tsNodeIsTypeDeclaration;
    },
    tsNodeIsUnusedFunction: function() {
        return tsNodeIsUnusedFunction;
    },
    usesChartApi: function() {
        return usesChartApi;
    }
});
const _extends = require("@swc/helpers/_/_extends");
const _interop_require_default = require("@swc/helpers/_/_interop_require_default");
const _sucrase = require("sucrase");
const _typescript = /*#__PURE__*/ _interop_require_default._(require("typescript"));
function readAsJsFile(srcFile, options = undefined) {
    const tsFile = srcFile// Remove imports that are not required in javascript
    .replace((options == null ? void 0 : options.includeImports) ? '' : /import ((.|\r?\n)*?)from.*\r?\n/g, '')// Remove export statement
    .replace(/export /g, '');
    const jsFile = (0, _sucrase.transform)(tsFile, {
        transforms: [
            'typescript'
        ],
        disableESTransforms: true
    }).code;
    return jsFile;
}
function parseFile(src) {
    return _typescript.default.createSourceFile('tempFile.ts', src, _typescript.default.ScriptTarget.Latest, true);
}
// export interface PrinterOptions {
//     removeComments?: boolean;
//     newLine?: NewLineKind;
//     omitTrailingSemicolon?: boolean;
//     noEmitHelpers?: boolean;
// }
const printer = _typescript.default.createPrinter({
    removeComments: false,
    omitTrailingSemicolon: false
});
function tsGenerate(node, srcFile) {
    try {
        if (!node) {
            return '';
        }
        return printer.printNode(_typescript.default.EmitHint.Unspecified, node, srcFile);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
    }
    return 'ERROR - Printing';
}
function modulesProcessor(modules) {
    const moduleImports = [];
    const suppliedModules = [];
    const requiredModules = [];
    modules.forEach((module)=>{
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
    requiredModules.forEach((requiredModule)=>{
        moduleImports.push(`import { ${requiredModule.exported} } from '${requiredModule.module}';`);
        suppliedModules.push(requiredModule.exported);
    });
    return {
        moduleImports,
        suppliedModules
    };
}
function removeFunctionKeyword(code) {
    return code.replace(/^function /, '').replace(/\n\s?function /, '\n ');
}
function getFunctionName(code) {
    const matches = /function\s+([^(\s]+)\(/.exec(code);
    return matches && matches.length === 2 ? matches[1].trim() : null;
}
const convertFunctionToProperty = (code)=>code.replace(/function\s+([^(\s]+)\s*\(([^)]*)\)/, '$1 = ($2) =>');
const convertFunctionToConstProperty = (code)=>code.replace(/function\s+([^(\s]+)\s*\(([^)]*)\)/, 'const $1 = ($2) =>');
const convertFunctionToConstPropertyTs = (code)=>{
    return code.replace(/function\s+([^(\s]+)\s*\(([^)]*)\):(\s+[^{]*)/, 'const $1: ($2) => $3 = ($2) =>');
};
function isInstanceMethod(methods, property) {
    return methods.map(getFunctionName).filter((name)=>name === property.name).length > 0;
}
var NodeType;
(function(NodeType) {
    NodeType["Variable"] = "VariableDeclaration";
    NodeType["Function"] = "FunctionDeclaration";
    NodeType["Expression"] = "ExpressionStatement";
})(NodeType || (NodeType = {}));
function tsCollect(tsTree, tsBindings, collectors, recurse = true) {
    _typescript.default.forEachChild(tsTree, (node)=>{
        collectors.filter((c)=>{
            let res = false;
            try {
                res = c.matches(node);
            } catch (error) {
                return false;
            }
            return res;
        }).forEach((c)=>{
            try {
                c.apply(tsBindings, node);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
            }
        });
        if (recurse) {
            tsCollect(node, tsBindings, collectors, recurse);
        }
    });
    return tsBindings;
}
function tsNodeIsGlobalVar(node) {
    // eg: var currentRowHeight = 10;
    if (_typescript.default.isVariableDeclaration(node) && _typescript.default.isSourceFile(node.parent.parent.parent)) {
        return true;
    }
    return false;
}
function tsNodeIsGlobalVarWithName(node, name) {
    // eg: var currentRowHeight = 10;
    if (_typescript.default.isVariableDeclaration(node) && _typescript.default.isSourceFile(node.parent.parent.parent)) {
        return node.name.getText() === name;
    }
    return false;
}
function tsNodeIsPropertyWithName(node, name) {
    if (_typescript.default.isPropertyAssignment(node)) {
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
function tsNodeIsTopLevelVariable(node, registered = []) {
    if (_typescript.default.isVariableDeclarationList(node)) {
        // Not registered already
        // are a top level variable declaration so that we do not match variables within function scopes
        // Is not just a type declaration i.e declare function getData: () => any[];
        if (node.declarations.length > 0) {
            const declaration = node.declarations[0];
            return !isDeclareStatement(node.parent) && registered.indexOf(declaration.name.getText()) < 0 && _typescript.default.isSourceFile(node.parent.parent);
        }
    }
}
function tsNodeIsFunctionWithName(node, name) {
    // eg: function someFunction() { }
    if (_typescript.default.isFunctionDeclaration(node)) {
        var _node_name;
        const isMatch = (node == null ? void 0 : (_node_name = node.name) == null ? void 0 : _node_name.getText()) === name;
        return isMatch;
    }
    return false;
}
function tsNodeIsInScope(node, unboundInstanceMethods) {
    return unboundInstanceMethods && _typescript.default.isFunctionDeclaration(node) && node.name && unboundInstanceMethods.indexOf(node.name.getText()) >= 0;
}
function tsNodeIsUnusedFunction(node, used, unboundInstanceMethods) {
    if (!tsNodeIsInScope(node, unboundInstanceMethods)) {
        if (_typescript.default.isFunctionLike(node) && used.indexOf(node.name.getText()) < 0) {
            const isTopLevel = _typescript.default.isSourceFile(node.parent);
            return isTopLevel && !isDeclareStatement(node);
        }
    }
    return false;
}
function isDeclareStatement(node) {
    return node && node.modifiers && node.modifiers.some((m)=>m.getText() === 'declare');
}
function tsNodeIsTypeDeclaration(node) {
    if (_typescript.default.isFunctionDeclaration(node) || _typescript.default.isVariableStatement(node)) {
        return isDeclareStatement(node);
    }
    return false;
}
function tsNodeIsPropertyAccessExpressionOf(node, properties) {
    if (properties.length !== 2) {
        throw new Error('Implement this');
    }
    return _typescript.default.isPropertyAccessExpression(node) && _typescript.default.isIdentifier(node.expression) && node.expression.escapedText === properties[0] && _typescript.default.isIdentifier(node.name) && node.name.escapedText === properties[1];
}
function tsNodeIsFunctionCall(node) {
    return _typescript.default.isCallExpression(node);
}
function tsNodeIsGlobalFunctionCall(node) {
    // Get top level function calls like
    // setInterval(callback, 500)
    // but don't match things like
    // AgCharts.create(options)
    if (_typescript.default.isExpressionStatement(node)) {
        return _typescript.default.isSourceFile(node.parent) && _typescript.default.isCallExpression(node.expression) && _typescript.default.isIdentifier(node.expression.expression);
    }
}
const recognizedDomEvents = [
    'click',
    'change',
    'input',
    'dragover',
    'dragstart',
    'drop'
];
function flatMap(array, callback) {
    return Array.prototype.concat.apply([], array.map(callback));
}
const extractEventHandlerBody = (code)=>code.match(/^(\w+)\((.*)\)/);
function extractEventHandlers(domTree, eventNames) {
    const getHandlerAttributes = (event)=>{
        const handlerName = `on${event}`;
        return domTree(`[${handlerName}]`).map((index, el)=>{
            return domTree(el).attr(handlerName);
        });
    };
    return flatMap(eventNames, (event)=>{
        const result = getHandlerAttributes(event).map((index, el)=>{
            return [
                extractEventHandlerBody(el)
            ];
        }).toArray();
        return result;
    });
}
function removeInScopeJsDoc(method) {
    return method.replace(/\/\*\*\s*inScope.*\*\/\n/g, '');
}
function extractUnboundInstanceMethods(srcFile) {
    let inScopeMethods = [];
    srcFile.statements.forEach((node)=>{
        if (_typescript.default.isFunctionDeclaration(node)) {
            const docs = node.jsDoc;
            if (docs && docs.length > 0) {
                docs.forEach((doc)=>{
                    const trimmed = doc.comment.trim() || '';
                    if (trimmed.includes('inScope')) {
                        var _node_name;
                        inScopeMethods = [
                            ...inScopeMethods,
                            (_node_name = node.name) == null ? void 0 : _node_name.getText()
                        ];
                    }
                });
            }
        }
    });
    return inScopeMethods;
}
function extractTypeInfoForVariable(srcFile, varName) {
    let typeStr = undefined;
    let typeParts = [];
    srcFile.statements.forEach((node)=>{
        if (_typescript.default.isVariableStatement(node)) {
            node.declarationList.declarations.forEach((dec)=>{
                if (_typescript.default.isVariableDeclaration(dec) && dec.name.getText() == varName && dec.type) {
                    typeStr = dec.type.getText();
                    typeParts = getTypes(dec.type);
                }
            });
        }
    });
    return {
        typeStr,
        typeParts
    };
}
function getTypes(node) {
    let typesToInclude = [];
    if (_typescript.default.isIdentifier(node)) {
        const typeName = node.getText();
        if (![
            'HTMLElement',
            'Function',
            'Partial',
            'TData',
            'TContext',
            'TValue'
        ].includes(typeName)) {
            typesToInclude.push(typeName);
        }
    }
    node.forEachChild((ct)=>{
        // Only recurse down the type branches of the tree so we do not include argument names
        if (ct.type) {
            typesToInclude = [
                ...typesToInclude,
                ...getTypes(ct.type)
            ];
        } else {
            typesToInclude = [
                ...typesToInclude,
                ...getTypes(ct)
            ];
        }
    });
    return typesToInclude;
}
function usesChartApi(node) {
    var _node_getText;
    if (_typescript.default.isCallExpression(node) && ((_node_getText = node.getText()) == null ? void 0 : _node_getText.match(/AgCharts.(?!create)/))) {
        return true;
    }
    let usesApi = false;
    node.forEachChild((ct)=>{
        usesApi || (usesApi = usesChartApi(ct));
    });
    return usesApi;
}
function extractImportStatements(srcFile) {
    const allImports = [];
    srcFile.statements.forEach((node)=>{
        if (_typescript.default.isImportDeclaration(node)) {
            const module = node.moduleSpecifier.getText();
            const moduleImports = node.importClause;
            const imports = [];
            let namedImport = undefined;
            let isNamespaced = true;
            if (moduleImports == null ? void 0 : moduleImports.namedBindings) {
                if (!_typescript.default.isNamespaceImport(moduleImports.namedBindings)) {
                    isNamespaced = false;
                }
                moduleImports.namedBindings.forEachChild((o)=>{
                    imports.push(o.getText());
                });
            }
            if (moduleImports == null ? void 0 : moduleImports.name) {
                namedImport = moduleImports.name.getText();
                isNamespaced = false;
            }
            allImports.push({
                module,
                isNamespaced,
                namedImport,
                imports
            });
        }
    });
    return allImports;
}
function extractTypeDeclarations(srcFile) {
    const allDeclareStatements = [];
    srcFile.statements.forEach((node)=>{
        var _node_modifiers;
        if ((_typescript.default.isVariableStatement(node) || _typescript.default.isFunctionDeclaration(node)) && ((_node_modifiers = node.modifiers) == null ? void 0 : _node_modifiers.length) > 0) {
            if (node.modifiers.some((s)=>s.kind === _typescript.default.SyntaxKind.DeclareKeyword)) {
                allDeclareStatements.push(node.getText());
            }
        }
    });
    return allDeclareStatements;
}
function extractClassDeclarations(srcFile) {
    const allClasses = [];
    srcFile.statements.forEach((node)=>{
        if (_typescript.default.isClassDeclaration(node)) {
            allClasses.push(node.getText());
        }
    });
    return allClasses;
}
function extractInterfaces(srcFile) {
    const allInterfaces = [];
    srcFile.statements.forEach((node)=>{
        if (_typescript.default.isInterfaceDeclaration(node)) {
            allInterfaces.push(node.getText());
        }
    });
    return allInterfaces;
}
function tsNodeIsTopLevelFunction(node) {
    if (_typescript.default.isFunctionLike(node)) {
        const isTopLevel = _typescript.default.isSourceFile(node.parent);
        return isTopLevel;
    }
    return false;
}
function findAllVariables(node) {
    let allVariables = [];
    if (_typescript.default.isClassDeclaration(node)) {
        allVariables.push(node.name.getText());
    }
    if (_typescript.default.isVariableDeclaration(node)) {
        if (_typescript.default.isObjectBindingPattern(node.name)) {
            // Code like this:  const { pageSetup, margins } = getSheetConfig();
            node.name.elements.forEach((n)=>allVariables.push(n.getText()));
        } else {
            allVariables.push(node.name.getText());
        }
    }
    if (_typescript.default.isFunctionDeclaration(node)) {
        // catch locally defined functions within the main function body
        // function setMessage(msg: string) { ... }
        allVariables.push(node.name.getText());
    }
    if (_typescript.default.isParameter(node)) {
        // catch locally defined arrow functions with their params
        //  const colToNameFunc = (col: Column, index: number) => index + ' = ' + col.getId()
        //  const colNames = cols.map(colToNameFunc).join(', ')
        allVariables.push(node.name.getText());
    }
    _typescript.default.forEachChild(node, (n)=>{
        const variables = findAllVariables(n);
        if (variables.length > 0) {
            allVariables = [
                ...allVariables,
                ...variables
            ];
        }
    });
    return allVariables;
}
function getLowestExpression(exp) {
    let hasExpression = true;
    while(hasExpression){
        hasExpression = exp.expression;
        if (hasExpression) {
            exp = exp.expression;
        }
    }
    return exp;
}
function findAllAccessedProperties(node) {
    let properties = [];
    if (_typescript.default.isIdentifier(node)) {
        const property = node.getText();
        if (property !== 'undefined' && property !== 'null') {
            properties.push(node.getText());
        }
    } else if (_typescript.default.isCallExpression(node) || _typescript.default.isPropertyAccessExpression(node)) {
        // When there are chained accesses we need to recurse to the lowest identifier as this is the first in the statement,
        // and will be the true accessed variable.
        // i.e gridOptions.api!.getModel().getRowCount() we need to recurse down the tree to extract gridOptions
        const exp = getLowestExpression(node.expression);
        if (_typescript.default.isArrayLiteralExpression(exp)) {
            // Check if the array has any properties in it that are dependencies
            properties = [
                ...properties,
                ...findAllAccessedProperties(exp)
            ];
        } else {
            properties.push(exp.getText());
        }
        if (_typescript.default.isCallExpression(node) && node.arguments) {
            // Check arguments
            properties = [
                ...properties,
                ...findAllAccessedProperties(node.arguments)
            ];
        }
    } else if (_typescript.default.isBinaryExpression(node)) {
        // In this function we set swimmingHeight but are not dependent on it,
        // so for binary expressions we only check the right hand branch
        // function setSwimmingHeight(height: number) {
        //      swimmingHeight = height
        //      gridOptions.api!.resetRowHeights()
        // }
        const rightProps = findAllAccessedProperties(node.right);
        if (rightProps.length > 0) {
            properties = [
                ...properties,
                ...rightProps
            ];
        }
    } else if (_typescript.default.isVariableDeclaration(node)) {
        // get lowest identifier as this is the first in the statement
        // i.e var nextHeader = params.nextHeaderPosition
        // we need to recurse down the initializer tree to extract params and not nextHeaderPosition
        const init = node.initializer;
        if (init) {
            const exp = getLowestExpression(init);
            properties = [
                ...properties,
                ...findAllAccessedProperties(exp)
            ];
        }
    } else if (_typescript.default.isPropertyAssignment(node)) {
        // Ignore the name of rowIndex just check what is being assigned
        //  {
        //      rowIndex: nextRowIndex,
        //  }
        if (node.initializer) {
            properties = [
                ...properties,
                ...findAllAccessedProperties(node.initializer)
            ];
        }
    } else if (_typescript.default.isExpressionStatement(node)) {
        if (node.expression) {
            properties = [
                ...properties,
                ...findAllAccessedProperties(node.expression)
            ];
        }
    } else if (_typescript.default.isClassDeclaration(node)) {
    // Do nothing for Class declarations as this is likely a cell renderer setup
    } else if (_typescript.default.isTypeReferenceNode(node)) {
    // Do nothing for Type references
    } else if (node instanceof Array) {
        node.forEach((element)=>{
            properties = [
                ...properties,
                ...findAllAccessedProperties(element)
            ];
        });
    } else {
        // Recurse down the tree looking for more accessed properties
        _typescript.default.forEachChild(node, (n)=>{
            const props = findAllAccessedProperties(n);
            if (props.length > 0) {
                properties = [
                    ...properties,
                    ...props
                ];
            }
        });
    }
    return properties;
}
function convertImportPath(modulePackage, convertToPackage) {
    if (convertToPackage) {
        const conversions = {
            "'@ag-grid-community/angular'": "'ag-grid-angular'",
            '"@ag-grid-community/angular"': "'ag-grid-angular'",
            "'@ag-grid-community/vue3'": "'ag-grid-vue3'",
            '"@ag-grid-community/vue3"': "'ag-grid-vue3'",
            "'@ag-grid-community/vue'": "'ag-grid-vue'",
            '"@ag-grid-community/vue"': "'ag-grid-vue'",
            "'@ag-grid-community/react'": "'ag-grid-react'",
            '"@ag-grid-community/react"': "'ag-grid-react'"
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
function getImport(filename) {
    const componentFileName = filename.split('.')[0];
    const componentName = componentFileName[0].toUpperCase() + componentFileName.slice(1);
    return `import { ${componentName} } from './${componentFileName}';`;
}
function getPropertyInterfaces(properties) {
    let propTypesUsed = [];
    properties.forEach((prop)=>{
        var _prop_typings_typesToInclude, _prop_typings;
        if (((_prop_typings = prop.typings) == null ? void 0 : (_prop_typings_typesToInclude = _prop_typings.typesToInclude) == null ? void 0 : _prop_typings_typesToInclude.length) > 0) {
            propTypesUsed = [
                ...propTypesUsed,
                ...prop.typings.typesToInclude
            ];
        }
    });
    return [
        ...new Set(propTypesUsed)
    ];
}
function addBindingImports(bindingImports, imports, convertToPackage, ignoreTsImports) {
    const workingImports = {};
    const namespacedImports = [];
    const chartsEnterprise = bindingImports.some((i)=>i.module.includes('ag-charts-enterprise'));
    bindingImports.forEach((i)=>{
        const path = convertImportPath(i.module, convertToPackage);
        if (!i.module.includes('_typescript') || !ignoreTsImports) {
            workingImports[path] = workingImports[path] || {
                namedImport: undefined,
                imports: []
            };
            if (i.isNamespaced) {
                if (i.imports.length > 0) {
                    namespacedImports.push(`import * as ${i.imports[0]} from ${path};`);
                } else {
                    namespacedImports.push(`import ${path};`);
                }
            } else {
                if (i.namedImport) {
                    workingImports[path] = _extends._({}, workingImports[path], {
                        namedImport: i.namedImport
                    });
                }
                if (i.imports) {
                    workingImports[path] = _extends._({}, workingImports[path], {
                        imports: [
                            ...workingImports[path].imports,
                            ...i.imports
                        ]
                    });
                }
            }
        }
    });
    [
        ...new Set(namespacedImports)
    ].forEach((ni)=>imports.push(ni));
    let hasEnterpriseModules = false;
    Object.entries(workingImports).forEach(([k, v])=>{
        let unique = [
            ...new Set(v.imports)
        ].sort();
        if (convertToPackage && k.includes('ag-grid')) {
            // Remove module related imports
            unique = unique.filter((i)=>!i.includes('Module') || i == 'AgGridModule');
            hasEnterpriseModules = hasEnterpriseModules || k.includes('enterprise');
        }
        if (unique.length > 0 || v.namedImport) {
            const namedImport = v.namedImport ? v.namedImport : '';
            const importStr = unique.length > 0 ? `{ ${unique.join(', ')} }` : '';
            const joiningComma = namedImport && importStr ? ', ' : '';
            imports.push(`import ${namedImport}${joiningComma}${importStr} from ${k};`);
        }
    });
    if (hasEnterpriseModules && convertToPackage) {
        imports.push(`import 'ag-grid-enterprise';`);
    }
    if (chartsEnterprise) {
        imports.push(`import 'ag-charts-enterprise';`);
    }
}
function getModuleRegistration({ gridSettings, enterprise, exampleName }) {
    const moduleRegistration = [
        "import { ModuleRegistry } from '@ag-grid-community/core';"
    ];
    const modules = gridSettings.modules;
    if (enterprise && !Array.isArray(modules)) {
        throw new Error(`The example ${exampleName} has "enterprise" : true but no modules have been provided "modules":[...]. Either remove the enterprise flag or provide the required modules.`);
    }
    const exampleModules = Array.isArray(modules) ? modules : [
        'clientside'
    ];
    const { moduleImports, suppliedModules } = modulesProcessor(exampleModules);
    moduleRegistration.push(...moduleImports);
    const gridSuppliedModules = `[${suppliedModules.join(', ')}]`;
    moduleRegistration.push(`\n// Register the required feature modules with the Grid`);
    moduleRegistration.push(`ModuleRegistry.registerModules(${gridSuppliedModules})`);
    return moduleRegistration;
}
function handleRowGenericInterface(fileTxt, tData) {
    if (tData) {
        fileTxt = fileTxt.replace(/<(TData|TValue|TContext|any)?(, )?(TData|TValue|TContext|any)?(, )?(TData|TValue|TContext|any)?>/g, '').replace(/TData\[\]/g, `${tData}[]`);
    } else {
        fileTxt = fileTxt.replace(/<TData>/g, '').replace(/TData\[\]/g, 'any[]');
    }
    return fileTxt;
}
function addGenericInterfaceImport(imports, tData, bindings) {
    if (tData && !bindings.interfaces.some((i)=>i.includes(tData)) && !imports.some((i)=>i.includes(tData))) {
        imports.push(`import { ${tData} } from './interfaces'`);
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL3RyYW5zZm9ybWF0aW9uLXNjcmlwdHMvcGFyc2VyLXV0aWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHRyYW5zZm9ybSB9IGZyb20gJ3N1Y3Jhc2UnO1xuaW1wb3J0IHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5leHBvcnQgdHlwZSBJbXBvcnRUeXBlID0gJ3BhY2thZ2VzJyB8ICdtb2R1bGVzJztcblxuZXhwb3J0IGludGVyZmFjZSBCaW5kaW5nSW1wb3J0IHtcbiAgICBpc05hbWVzcGFjZWQ6IGJvb2xlYW47XG4gICAgbW9kdWxlOiBzdHJpbmc7XG4gICAgbmFtZWRJbXBvcnQ6IHN0cmluZztcbiAgICBpbXBvcnRzOiBzdHJpbmdbXTtcbn1cblxuLy8gY29uc3QgbW9kdWxlTWFwcGluZyA9IHJlcXVpcmUoXCIuLi8uLi9kb2N1bWVudGF0aW9uL2RvYy1wYWdlcy9tb2R1bGVzL21vZHVsZXMuanNvblwiKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRBc0pzRmlsZShzcmNGaWxlLCBvcHRpb25zOiB7IGluY2x1ZGVJbXBvcnRzOiBib29sZWFuIH0gPSB1bmRlZmluZWQpIHtcbiAgICBjb25zdCB0c0ZpbGUgPSBzcmNGaWxlXG4gICAgICAgIC8vIFJlbW92ZSBpbXBvcnRzIHRoYXQgYXJlIG5vdCByZXF1aXJlZCBpbiBqYXZhc2NyaXB0XG4gICAgICAgIC5yZXBsYWNlKG9wdGlvbnM/LmluY2x1ZGVJbXBvcnRzID8gJycgOiAvaW1wb3J0ICgoLnxcXHI/XFxuKSo/KWZyb20uKlxccj9cXG4vZywgJycpXG4gICAgICAgIC8vIFJlbW92ZSBleHBvcnQgc3RhdGVtZW50XG4gICAgICAgIC5yZXBsYWNlKC9leHBvcnQgL2csICcnKTtcblxuICAgIGNvbnN0IGpzRmlsZSA9IHRyYW5zZm9ybSh0c0ZpbGUsIHsgdHJhbnNmb3JtczogWyd0eXBlc2NyaXB0J10sIGRpc2FibGVFU1RyYW5zZm9ybXM6IHRydWUgfSkuY29kZTtcblxuICAgIHJldHVybiBqc0ZpbGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUZpbGUoc3JjKSB7XG4gICAgcmV0dXJuIHRzLmNyZWF0ZVNvdXJjZUZpbGUoJ3RlbXBGaWxlLnRzJywgc3JjLCB0cy5TY3JpcHRUYXJnZXQuTGF0ZXN0LCB0cnVlKTtcbn1cblxuLy8gZXhwb3J0IGludGVyZmFjZSBQcmludGVyT3B0aW9ucyB7XG4vLyAgICAgcmVtb3ZlQ29tbWVudHM/OiBib29sZWFuO1xuLy8gICAgIG5ld0xpbmU/OiBOZXdMaW5lS2luZDtcbi8vICAgICBvbWl0VHJhaWxpbmdTZW1pY29sb24/OiBib29sZWFuO1xuLy8gICAgIG5vRW1pdEhlbHBlcnM/OiBib29sZWFuO1xuLy8gfVxuY29uc3QgcHJpbnRlciA9IHRzLmNyZWF0ZVByaW50ZXIoe1xuICAgIHJlbW92ZUNvbW1lbnRzOiBmYWxzZSxcbiAgICBvbWl0VHJhaWxpbmdTZW1pY29sb246IGZhbHNlLFxufSk7XG5cbmV4cG9ydCBmdW5jdGlvbiB0c0dlbmVyYXRlKG5vZGUsIHNyY0ZpbGUpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJpbnRlci5wcmludE5vZGUodHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIG5vZGUsIHNyY0ZpbGUpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIH1cbiAgICByZXR1cm4gJ0VSUk9SIC0gUHJpbnRpbmcnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbW9kdWxlc1Byb2Nlc3Nvcihtb2R1bGVzOiBzdHJpbmdbXSkge1xuICAgIGNvbnN0IG1vZHVsZUltcG9ydHMgPSBbXTtcbiAgICBjb25zdCBzdXBwbGllZE1vZHVsZXMgPSBbXTtcblxuICAgIGNvbnN0IHJlcXVpcmVkTW9kdWxlcyA9IFtdO1xuICAgIG1vZHVsZXMuZm9yRWFjaCgobW9kdWxlKSA9PiB7XG4gICAgICAgIC8vIGxldCBmb3VuZCA9IGZhbHNlO1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgICBjb25zb2xlLndhcm4oYFRPRE86IG1vZHVsZSBtYXBwaW5nIGZvciAke21vZHVsZX1gKTtcbiAgICAgICAgLy8gbW9kdWxlTWFwcGluZy5mb3JFYWNoKChtb2R1bGVDb25maWcpID0+IHtcbiAgICAgICAgLy8gICBpZiAobW9kdWxlQ29uZmlnLnNob3J0bmFtZSAmJiBtb2R1bGVDb25maWcuc2hvcnRuYW1lID09IG1vZHVsZSkge1xuICAgICAgICAvLyAgICAgcmVxdWlyZWRNb2R1bGVzLnB1c2gobW9kdWxlQ29uZmlnKTtcbiAgICAgICAgLy8gICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgLy8gICB9XG4gICAgICAgIC8vIH0pO1xuICAgICAgICAvLyBpZiAoIWZvdW5kKSB7XG4gICAgICAgIC8vICAgY29uc29sZS5lcnJvcihgQ291bGQgbm90IGZpbmQgbW9kdWxlICR7bW9kdWxlfSBpbiBtb2R1bGVzLmpzb25gKTtcbiAgICAgICAgLy8gfVxuICAgIH0pO1xuXG4gICAgcmVxdWlyZWRNb2R1bGVzLmZvckVhY2goKHJlcXVpcmVkTW9kdWxlKSA9PiB7XG4gICAgICAgIG1vZHVsZUltcG9ydHMucHVzaChgaW1wb3J0IHsgJHtyZXF1aXJlZE1vZHVsZS5leHBvcnRlZH0gfSBmcm9tICcke3JlcXVpcmVkTW9kdWxlLm1vZHVsZX0nO2ApO1xuICAgICAgICBzdXBwbGllZE1vZHVsZXMucHVzaChyZXF1aXJlZE1vZHVsZS5leHBvcnRlZCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4geyBtb2R1bGVJbXBvcnRzLCBzdXBwbGllZE1vZHVsZXMgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZUZ1bmN0aW9uS2V5d29yZChjb2RlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBjb2RlLnJlcGxhY2UoL15mdW5jdGlvbiAvLCAnJykucmVwbGFjZSgvXFxuXFxzP2Z1bmN0aW9uIC8sICdcXG4gJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRGdW5jdGlvbk5hbWUoY29kZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBtYXRjaGVzID0gL2Z1bmN0aW9uXFxzKyhbXihcXHNdKylcXCgvLmV4ZWMoY29kZSk7XG4gICAgcmV0dXJuIG1hdGNoZXMgJiYgbWF0Y2hlcy5sZW5ndGggPT09IDIgPyBtYXRjaGVzWzFdLnRyaW0oKSA6IG51bGw7XG59XG5cbmV4cG9ydCBjb25zdCBjb252ZXJ0RnVuY3Rpb25Ub1Byb3BlcnR5ID0gKGNvZGU6IHN0cmluZykgPT5cbiAgICBjb2RlLnJlcGxhY2UoL2Z1bmN0aW9uXFxzKyhbXihcXHNdKylcXHMqXFwoKFteKV0qKVxcKS8sICckMSA9ICgkMikgPT4nKTtcblxuZXhwb3J0IGNvbnN0IGNvbnZlcnRGdW5jdGlvblRvQ29uc3RQcm9wZXJ0eSA9IChjb2RlOiBzdHJpbmcpID0+XG4gICAgY29kZS5yZXBsYWNlKC9mdW5jdGlvblxccysoW14oXFxzXSspXFxzKlxcKChbXildKilcXCkvLCAnY29uc3QgJDEgPSAoJDIpID0+Jyk7XG5leHBvcnQgY29uc3QgY29udmVydEZ1bmN0aW9uVG9Db25zdFByb3BlcnR5VHMgPSAoY29kZTogc3RyaW5nKSA9PiB7XG4gICAgcmV0dXJuIGNvZGUucmVwbGFjZSgvZnVuY3Rpb25cXHMrKFteKFxcc10rKVxccypcXCgoW14pXSopXFwpOihcXHMrW157XSopLywgJ2NvbnN0ICQxOiAoJDIpID0+ICQzID0gKCQyKSA9PicpO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzSW5zdGFuY2VNZXRob2QobWV0aG9kczogc3RyaW5nW10sIHByb3BlcnR5OiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gbWV0aG9kcy5tYXAoZ2V0RnVuY3Rpb25OYW1lKS5maWx0ZXIoKG5hbWUpID0+IG5hbWUgPT09IHByb3BlcnR5Lm5hbWUpLmxlbmd0aCA+IDA7XG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIE5vZGVUeXBlIHtcbiAgICBWYXJpYWJsZSA9ICdWYXJpYWJsZURlY2xhcmF0aW9uJyxcbiAgICBGdW5jdGlvbiA9ICdGdW5jdGlvbkRlY2xhcmF0aW9uJyxcbiAgICBFeHByZXNzaW9uID0gJ0V4cHJlc3Npb25TdGF0ZW1lbnQnLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gdHNDb2xsZWN0KHRzVHJlZSwgdHNCaW5kaW5ncywgY29sbGVjdG9ycywgcmVjdXJzZSA9IHRydWUpIHtcbiAgICB0cy5mb3JFYWNoQ2hpbGQodHNUcmVlLCAobm9kZTogdHMuTm9kZSkgPT4ge1xuICAgICAgICBjb2xsZWN0b3JzXG4gICAgICAgICAgICAuZmlsdGVyKChjKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHJlcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcyA9IGMubWF0Y2hlcyhub2RlKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmZvckVhY2goKGMpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjLmFwcGx5KHRzQmluZGluZ3MsIG5vZGUpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICBpZiAocmVjdXJzZSkge1xuICAgICAgICAgICAgdHNDb2xsZWN0KG5vZGUsIHRzQmluZGluZ3MsIGNvbGxlY3RvcnMsIHJlY3Vyc2UpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHRzQmluZGluZ3M7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0c05vZGVJc0dsb2JhbFZhcihub2RlOiBhbnkpOiBib29sZWFuIHtcbiAgICAvLyBlZzogdmFyIGN1cnJlbnRSb3dIZWlnaHQgPSAxMDtcbiAgICBpZiAodHMuaXNWYXJpYWJsZURlY2xhcmF0aW9uKG5vZGUpICYmIHRzLmlzU291cmNlRmlsZShub2RlLnBhcmVudC5wYXJlbnQucGFyZW50KSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdHNOb2RlSXNHbG9iYWxWYXJXaXRoTmFtZShub2RlOiBhbnksIG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIC8vIGVnOiB2YXIgY3VycmVudFJvd0hlaWdodCA9IDEwO1xuICAgIGlmICh0cy5pc1ZhcmlhYmxlRGVjbGFyYXRpb24obm9kZSkgJiYgdHMuaXNTb3VyY2VGaWxlKG5vZGUucGFyZW50LnBhcmVudC5wYXJlbnQpKSB7XG4gICAgICAgIHJldHVybiBub2RlLm5hbWUuZ2V0VGV4dCgpID09PSBuYW1lO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0c05vZGVJc1Byb3BlcnR5V2l0aE5hbWUobm9kZTogdHMuTm9kZSwgbmFtZTogc3RyaW5nKSB7XG4gICAgaWYgKHRzLmlzUHJvcGVydHlBc3NpZ25tZW50KG5vZGUpKSB7XG4gICAgICAgIGlmIChub2RlLm5hbWUuZ2V0VGV4dCgpID09PSBuYW1lKSB7XG4gICAgICAgICAgICAvLyBJZiB0aGUgbmFtZSBtYXRjaGVzIHRoZSBpbml0aWFsaXplciB0aGVuIHRoZSBwcm9wZXJ0eSB3aWxsIGdldCBhZGRlZCB2aWFcbiAgICAgICAgICAgIC8vIHRoZSB0b3AgbGV2ZWwgdmFyaWFibGUgbWF0Y2hpbmcgYSBncmlkUHJvcGVydHkgbmFtZVxuICAgICAgICAgICAgLy8gVGhpcyBtZWFucyB0aGF0IHdlIGluY2x1ZGUgY2VsbFJlbmRlcmVyIHByb3BlcnRpZXMgbGlrZVxuICAgICAgICAgICAgLy8gZGV0YWlsQ2VsbFJlbmRlcmVyOiBEZXRhaWxDZWxsUmVuZGVyZXIsXG4gICAgICAgICAgICBpZiAobm9kZS5uYW1lLmdldFRleHQoKSA9PT0gbm9kZS5pbml0aWFsaXplci5nZXRUZXh0KCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRzTm9kZUlzVG9wTGV2ZWxWYXJpYWJsZShub2RlOiB0cy5Ob2RlLCByZWdpc3RlcmVkOiBzdHJpbmdbXSA9IFtdKSB7XG4gICAgaWYgKHRzLmlzVmFyaWFibGVEZWNsYXJhdGlvbkxpc3Qobm9kZSkpIHtcbiAgICAgICAgLy8gTm90IHJlZ2lzdGVyZWQgYWxyZWFkeVxuICAgICAgICAvLyBhcmUgYSB0b3AgbGV2ZWwgdmFyaWFibGUgZGVjbGFyYXRpb24gc28gdGhhdCB3ZSBkbyBub3QgbWF0Y2ggdmFyaWFibGVzIHdpdGhpbiBmdW5jdGlvbiBzY29wZXNcbiAgICAgICAgLy8gSXMgbm90IGp1c3QgYSB0eXBlIGRlY2xhcmF0aW9uIGkuZSBkZWNsYXJlIGZ1bmN0aW9uIGdldERhdGE6ICgpID0+IGFueVtdO1xuICAgICAgICBpZiAobm9kZS5kZWNsYXJhdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgZGVjbGFyYXRpb24gPSBub2RlLmRlY2xhcmF0aW9uc1swXTtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgIWlzRGVjbGFyZVN0YXRlbWVudChub2RlLnBhcmVudCkgJiZcbiAgICAgICAgICAgICAgICByZWdpc3RlcmVkLmluZGV4T2YoZGVjbGFyYXRpb24ubmFtZS5nZXRUZXh0KCkpIDwgMCAmJlxuICAgICAgICAgICAgICAgIHRzLmlzU291cmNlRmlsZShub2RlLnBhcmVudC5wYXJlbnQpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdHNOb2RlSXNGdW5jdGlvbldpdGhOYW1lKG5vZGU6IHRzLk5vZGUsIG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIC8vIGVnOiBmdW5jdGlvbiBzb21lRnVuY3Rpb24oKSB7IH1cbiAgICBpZiAodHMuaXNGdW5jdGlvbkRlY2xhcmF0aW9uKG5vZGUpKSB7XG4gICAgICAgIGNvbnN0IGlzTWF0Y2ggPSBub2RlPy5uYW1lPy5nZXRUZXh0KCkgPT09IG5hbWU7XG4gICAgICAgIHJldHVybiBpc01hdGNoO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0c05vZGVJc0luU2NvcGUobm9kZTogYW55LCB1bmJvdW5kSW5zdGFuY2VNZXRob2RzOiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoXG4gICAgICAgIHVuYm91bmRJbnN0YW5jZU1ldGhvZHMgJiZcbiAgICAgICAgdHMuaXNGdW5jdGlvbkRlY2xhcmF0aW9uKG5vZGUpICYmXG4gICAgICAgIG5vZGUubmFtZSAmJlxuICAgICAgICB1bmJvdW5kSW5zdGFuY2VNZXRob2RzLmluZGV4T2Yobm9kZS5uYW1lLmdldFRleHQoKSkgPj0gMFxuICAgICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0c05vZGVJc1VudXNlZEZ1bmN0aW9uKG5vZGU6IGFueSwgdXNlZDogc3RyaW5nW10sIHVuYm91bmRJbnN0YW5jZU1ldGhvZHM6IHN0cmluZ1tdKTogYm9vbGVhbiB7XG4gICAgaWYgKCF0c05vZGVJc0luU2NvcGUobm9kZSwgdW5ib3VuZEluc3RhbmNlTWV0aG9kcykpIHtcbiAgICAgICAgaWYgKHRzLmlzRnVuY3Rpb25MaWtlKG5vZGUpICYmIHVzZWQuaW5kZXhPZihub2RlLm5hbWUuZ2V0VGV4dCgpKSA8IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGlzVG9wTGV2ZWwgPSB0cy5pc1NvdXJjZUZpbGUobm9kZS5wYXJlbnQpO1xuICAgICAgICAgICAgcmV0dXJuIGlzVG9wTGV2ZWwgJiYgIWlzRGVjbGFyZVN0YXRlbWVudChub2RlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGlzRGVjbGFyZVN0YXRlbWVudChub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUgJiYgbm9kZS5tb2RpZmllcnMgJiYgbm9kZS5tb2RpZmllcnMuc29tZSgobSkgPT4gbS5nZXRUZXh0KCkgPT09ICdkZWNsYXJlJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0c05vZGVJc1R5cGVEZWNsYXJhdGlvbihub2RlOiBhbnkpOiBib29sZWFuIHtcbiAgICBpZiAodHMuaXNGdW5jdGlvbkRlY2xhcmF0aW9uKG5vZGUpIHx8IHRzLmlzVmFyaWFibGVTdGF0ZW1lbnQobm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIGlzRGVjbGFyZVN0YXRlbWVudChub2RlKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdHNOb2RlSXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb25PZihub2RlOiBhbnksIHByb3BlcnRpZXM6IHN0cmluZ1tdKTogYm9vbGVhbiB7XG4gICAgaWYgKHByb3BlcnRpZXMubGVuZ3RoICE9PSAyKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW1wbGVtZW50IHRoaXMnKTtcbiAgICB9XG4gICAgcmV0dXJuIChcbiAgICAgICAgdHMuaXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24obm9kZSkgJiZcbiAgICAgICAgdHMuaXNJZGVudGlmaWVyKG5vZGUuZXhwcmVzc2lvbikgJiZcbiAgICAgICAgbm9kZS5leHByZXNzaW9uLmVzY2FwZWRUZXh0ID09PSBwcm9wZXJ0aWVzWzBdICYmXG4gICAgICAgIHRzLmlzSWRlbnRpZmllcihub2RlLm5hbWUpICYmXG4gICAgICAgIG5vZGUubmFtZS5lc2NhcGVkVGV4dCA9PT0gcHJvcGVydGllc1sxXVxuICAgICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0c05vZGVJc0Z1bmN0aW9uQ2FsbChub2RlOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHMuaXNDYWxsRXhwcmVzc2lvbihub2RlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRzTm9kZUlzR2xvYmFsRnVuY3Rpb25DYWxsKG5vZGU6IHRzLk5vZGUpIHtcbiAgICAvLyBHZXQgdG9wIGxldmVsIGZ1bmN0aW9uIGNhbGxzIGxpa2VcbiAgICAvLyBzZXRJbnRlcnZhbChjYWxsYmFjaywgNTAwKVxuICAgIC8vIGJ1dCBkb24ndCBtYXRjaCB0aGluZ3MgbGlrZVxuICAgIC8vIEFnQ2hhcnRzLmNyZWF0ZShvcHRpb25zKVxuICAgIGlmICh0cy5pc0V4cHJlc3Npb25TdGF0ZW1lbnQobm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIHRzLmlzU291cmNlRmlsZShub2RlLnBhcmVudCkgJiZcbiAgICAgICAgICAgIHRzLmlzQ2FsbEV4cHJlc3Npb24obm9kZS5leHByZXNzaW9uKSAmJlxuICAgICAgICAgICAgdHMuaXNJZGVudGlmaWVyKG5vZGUuZXhwcmVzc2lvbi5leHByZXNzaW9uKVxuICAgICAgICApO1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IHJlY29nbml6ZWREb21FdmVudHMgPSBbJ2NsaWNrJywgJ2NoYW5nZScsICdpbnB1dCcsICdkcmFnb3ZlcicsICdkcmFnc3RhcnQnLCAnZHJvcCddO1xuXG5mdW5jdGlvbiBmbGF0TWFwPFQ+KGFycmF5OiBUW10sIGNhbGxiYWNrOiAodmFsdWU6IFQpID0+IFQpOiBUW10ge1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KFtdLCBhcnJheS5tYXAoY2FsbGJhY2spKTtcbn1cblxuY29uc3QgZXh0cmFjdEV2ZW50SGFuZGxlckJvZHkgPSAoY29kZTogc3RyaW5nKSA9PiBjb2RlLm1hdGNoKC9eKFxcdyspXFwoKC4qKVxcKS8pO1xuXG4vKlxuICogZm9yIGVhY2ggb2YgdGhlIHJlY29nbmlzZWQgZXZlbnRzIChjbGljaywgY2hhbmdlIGV0YykgZXh0cmFjdCB0aGUgY29ycmVzcG9uZGluZyBldmVudCBoYW5kbGVyLCB3aXRoIChvcHRpb25hbCkgcGFyYW1zXG4gKiBlZzogb25jbGljaz1cInJlZnJlc2hFdmVuUm93c0N1cnJlbmN5RGF0YSgpXCJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RFdmVudEhhbmRsZXJzKGRvbVRyZWU6IGFueSwgZXZlbnROYW1lczogc3RyaW5nW10pIHtcbiAgICBjb25zdCBnZXRIYW5kbGVyQXR0cmlidXRlcyA9IChldmVudDogc3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IGhhbmRsZXJOYW1lID0gYG9uJHtldmVudH1gO1xuXG4gICAgICAgIHJldHVybiBkb21UcmVlKGBbJHtoYW5kbGVyTmFtZX1dYCkubWFwKChpbmRleCwgZWwpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBkb21UcmVlKGVsKS5hdHRyKGhhbmRsZXJOYW1lKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiBmbGF0TWFwKGV2ZW50TmFtZXMsIChldmVudDogc3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGdldEhhbmRsZXJBdHRyaWJ1dGVzKGV2ZW50KVxuICAgICAgICAgICAgLm1hcCgoaW5kZXgsIGVsKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtleHRyYWN0RXZlbnRIYW5kbGVyQm9keShlbCldO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50b0FycmF5KCk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZUluU2NvcGVKc0RvYyhtZXRob2Q6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIG1ldGhvZC5yZXBsYWNlKC9cXC9cXCpcXCpcXHMqaW5TY29wZS4qXFwqXFwvXFxuL2csICcnKTtcbn1cblxuLy8gZnVuY3Rpb25zIG1hcmtlZCB3aXRoIGFuIFwiaW5TY29wZVwiIGNvbW1lbnQgd2lsbCBiZSBoYW5kbGVkIGFzIFwiaW5zdGFuY2VcIiBtZXRob2RzLCBhcyBvcHBvc2VkIHRvIChnbG9iYWwvdW51c2VkKVxuLy8gXCJ1dGlsXCIgb25lc1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RVbmJvdW5kSW5zdGFuY2VNZXRob2RzKHNyY0ZpbGU6IHRzLlNvdXJjZUZpbGUpIHtcbiAgICBsZXQgaW5TY29wZU1ldGhvZHMgPSBbXTtcbiAgICBzcmNGaWxlLnN0YXRlbWVudHMuZm9yRWFjaCgobm9kZSkgPT4ge1xuICAgICAgICBpZiAodHMuaXNGdW5jdGlvbkRlY2xhcmF0aW9uKG5vZGUpKSB7XG4gICAgICAgICAgICBjb25zdCBkb2NzID0gKG5vZGUgYXMgYW55KS5qc0RvYztcbiAgICAgICAgICAgIGlmIChkb2NzICYmIGRvY3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGRvY3MuZm9yRWFjaCgoZG9jKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRyaW1tZWQgPSBkb2MuY29tbWVudC50cmltKCkgfHwgJyc7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0cmltbWVkLmluY2x1ZGVzKCdpblNjb3BlJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluU2NvcGVNZXRob2RzID0gWy4uLmluU2NvcGVNZXRob2RzLCBub2RlLm5hbWU/LmdldFRleHQoKV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBpblNjb3BlTWV0aG9kcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RUeXBlSW5mb0ZvclZhcmlhYmxlKHNyY0ZpbGU6IHRzLlNvdXJjZUZpbGUsIHZhck5hbWU6IHN0cmluZykge1xuICAgIGxldCB0eXBlU3RyID0gdW5kZWZpbmVkO1xuICAgIGxldCB0eXBlUGFydHMgPSBbXTtcbiAgICBzcmNGaWxlLnN0YXRlbWVudHMuZm9yRWFjaCgobm9kZSkgPT4ge1xuICAgICAgICBpZiAodHMuaXNWYXJpYWJsZVN0YXRlbWVudChub2RlKSkge1xuICAgICAgICAgICAgbm9kZS5kZWNsYXJhdGlvbkxpc3QuZGVjbGFyYXRpb25zLmZvckVhY2goKGRlYykgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0cy5pc1ZhcmlhYmxlRGVjbGFyYXRpb24oZGVjKSAmJiBkZWMubmFtZS5nZXRUZXh0KCkgPT0gdmFyTmFtZSAmJiBkZWMudHlwZSkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlU3RyID0gZGVjLnR5cGUuZ2V0VGV4dCgpO1xuICAgICAgICAgICAgICAgICAgICB0eXBlUGFydHMgPSBnZXRUeXBlcyhkZWMudHlwZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4geyB0eXBlU3RyLCB0eXBlUGFydHMgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFR5cGVzKG5vZGU6IHRzLk5vZGUpIHtcbiAgICBsZXQgdHlwZXNUb0luY2x1ZGUgPSBbXTtcbiAgICBpZiAodHMuaXNJZGVudGlmaWVyKG5vZGUpKSB7XG4gICAgICAgIGNvbnN0IHR5cGVOYW1lID0gbm9kZS5nZXRUZXh0KCk7XG4gICAgICAgIGlmICghWydIVE1MRWxlbWVudCcsICdGdW5jdGlvbicsICdQYXJ0aWFsJywgJ1REYXRhJywgJ1RDb250ZXh0JywgJ1RWYWx1ZSddLmluY2x1ZGVzKHR5cGVOYW1lKSkge1xuICAgICAgICAgICAgdHlwZXNUb0luY2x1ZGUucHVzaCh0eXBlTmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbm9kZS5mb3JFYWNoQ2hpbGQoKGN0KSA9PiB7XG4gICAgICAgIC8vIE9ubHkgcmVjdXJzZSBkb3duIHRoZSB0eXBlIGJyYW5jaGVzIG9mIHRoZSB0cmVlIHNvIHdlIGRvIG5vdCBpbmNsdWRlIGFyZ3VtZW50IG5hbWVzXG4gICAgICAgIGlmICgoY3QgYXMgYW55KS50eXBlKSB7XG4gICAgICAgICAgICB0eXBlc1RvSW5jbHVkZSA9IFsuLi50eXBlc1RvSW5jbHVkZSwgLi4uZ2V0VHlwZXMoKGN0IGFzIGFueSkudHlwZSldO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdHlwZXNUb0luY2x1ZGUgPSBbLi4udHlwZXNUb0luY2x1ZGUsIC4uLmdldFR5cGVzKGN0KV07XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gdHlwZXNUb0luY2x1ZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VzQ2hhcnRBcGkobm9kZTogdHMuTm9kZSkge1xuICAgIGlmICh0cy5pc0NhbGxFeHByZXNzaW9uKG5vZGUpICYmIG5vZGUuZ2V0VGV4dCgpPy5tYXRjaCgvQWdDaGFydHMuKD8hY3JlYXRlKS8pKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGxldCB1c2VzQXBpID0gZmFsc2U7XG4gICAgbm9kZS5mb3JFYWNoQ2hpbGQoKGN0KSA9PiB7XG4gICAgICAgIHVzZXNBcGkgfHw9IHVzZXNDaGFydEFwaShjdCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHVzZXNBcGk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0SW1wb3J0U3RhdGVtZW50cyhzcmNGaWxlOiB0cy5Tb3VyY2VGaWxlKTogQmluZGluZ0ltcG9ydFtdIHtcbiAgICBjb25zdCBhbGxJbXBvcnRzID0gW107XG4gICAgc3JjRmlsZS5zdGF0ZW1lbnRzLmZvckVhY2goKG5vZGUpID0+IHtcbiAgICAgICAgaWYgKHRzLmlzSW1wb3J0RGVjbGFyYXRpb24obm9kZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IG1vZHVsZSA9IG5vZGUubW9kdWxlU3BlY2lmaWVyLmdldFRleHQoKTtcbiAgICAgICAgICAgIGNvbnN0IG1vZHVsZUltcG9ydHMgPSBub2RlLmltcG9ydENsYXVzZTtcbiAgICAgICAgICAgIGNvbnN0IGltcG9ydHMgPSBbXTtcbiAgICAgICAgICAgIGxldCBuYW1lZEltcG9ydCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGxldCBpc05hbWVzcGFjZWQgPSB0cnVlO1xuXG4gICAgICAgICAgICBpZiAobW9kdWxlSW1wb3J0cz8ubmFtZWRCaW5kaW5ncykge1xuICAgICAgICAgICAgICAgIGlmICghdHMuaXNOYW1lc3BhY2VJbXBvcnQobW9kdWxlSW1wb3J0cy5uYW1lZEJpbmRpbmdzKSkge1xuICAgICAgICAgICAgICAgICAgICBpc05hbWVzcGFjZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbW9kdWxlSW1wb3J0cy5uYW1lZEJpbmRpbmdzLmZvckVhY2hDaGlsZCgobykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpbXBvcnRzLnB1c2goby5nZXRUZXh0KCkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG1vZHVsZUltcG9ydHM/Lm5hbWUpIHtcbiAgICAgICAgICAgICAgICBuYW1lZEltcG9ydCA9IG1vZHVsZUltcG9ydHMubmFtZS5nZXRUZXh0KCk7XG4gICAgICAgICAgICAgICAgaXNOYW1lc3BhY2VkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhbGxJbXBvcnRzLnB1c2goe1xuICAgICAgICAgICAgICAgIG1vZHVsZSxcbiAgICAgICAgICAgICAgICBpc05hbWVzcGFjZWQsXG4gICAgICAgICAgICAgICAgbmFtZWRJbXBvcnQsXG4gICAgICAgICAgICAgICAgaW1wb3J0cyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGFsbEltcG9ydHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0VHlwZURlY2xhcmF0aW9ucyhzcmNGaWxlOiB0cy5Tb3VyY2VGaWxlKSB7XG4gICAgY29uc3QgYWxsRGVjbGFyZVN0YXRlbWVudHMgPSBbXTtcbiAgICBzcmNGaWxlLnN0YXRlbWVudHMuZm9yRWFjaCgobm9kZSkgPT4ge1xuICAgICAgICBpZiAoKHRzLmlzVmFyaWFibGVTdGF0ZW1lbnQobm9kZSkgfHwgdHMuaXNGdW5jdGlvbkRlY2xhcmF0aW9uKG5vZGUpKSAmJiBub2RlLm1vZGlmaWVycz8ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgaWYgKG5vZGUubW9kaWZpZXJzLnNvbWUoKHMpID0+IHMua2luZCA9PT0gdHMuU3ludGF4S2luZC5EZWNsYXJlS2V5d29yZCkpIHtcbiAgICAgICAgICAgICAgICBhbGxEZWNsYXJlU3RhdGVtZW50cy5wdXNoKG5vZGUuZ2V0VGV4dCgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBhbGxEZWNsYXJlU3RhdGVtZW50cztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RDbGFzc0RlY2xhcmF0aW9ucyhzcmNGaWxlOiB0cy5Tb3VyY2VGaWxlKSB7XG4gICAgY29uc3QgYWxsQ2xhc3NlcyA9IFtdO1xuICAgIHNyY0ZpbGUuc3RhdGVtZW50cy5mb3JFYWNoKChub2RlKSA9PiB7XG4gICAgICAgIGlmICh0cy5pc0NsYXNzRGVjbGFyYXRpb24obm9kZSkpIHtcbiAgICAgICAgICAgIGFsbENsYXNzZXMucHVzaChub2RlLmdldFRleHQoKSk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gYWxsQ2xhc3Nlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RJbnRlcmZhY2VzKHNyY0ZpbGU6IHRzLlNvdXJjZUZpbGUpIHtcbiAgICBjb25zdCBhbGxJbnRlcmZhY2VzID0gW107XG4gICAgc3JjRmlsZS5zdGF0ZW1lbnRzLmZvckVhY2goKG5vZGUpID0+IHtcbiAgICAgICAgaWYgKHRzLmlzSW50ZXJmYWNlRGVjbGFyYXRpb24obm9kZSkpIHtcbiAgICAgICAgICAgIGFsbEludGVyZmFjZXMucHVzaChub2RlLmdldFRleHQoKSk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gYWxsSW50ZXJmYWNlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRzTm9kZUlzVG9wTGV2ZWxGdW5jdGlvbihub2RlOiBhbnkpOiBib29sZWFuIHtcbiAgICBpZiAodHMuaXNGdW5jdGlvbkxpa2Uobm9kZSkpIHtcbiAgICAgICAgY29uc3QgaXNUb3BMZXZlbCA9IHRzLmlzU291cmNlRmlsZShub2RlLnBhcmVudCk7XG4gICAgICAgIHJldHVybiBpc1RvcExldmVsO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogRmluZCBhbGwgdGhlIHZhcmlhYmxlcyBkZWZpbmVkIGluIHRoaXMgbm9kZSB0cmVlIHJlY3Vyc2l2ZWx5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kQWxsVmFyaWFibGVzKG5vZGUpIHtcbiAgICBsZXQgYWxsVmFyaWFibGVzID0gW107XG4gICAgaWYgKHRzLmlzQ2xhc3NEZWNsYXJhdGlvbihub2RlKSkge1xuICAgICAgICBhbGxWYXJpYWJsZXMucHVzaChub2RlLm5hbWUuZ2V0VGV4dCgpKTtcbiAgICB9XG4gICAgaWYgKHRzLmlzVmFyaWFibGVEZWNsYXJhdGlvbihub2RlKSkge1xuICAgICAgICBpZiAodHMuaXNPYmplY3RCaW5kaW5nUGF0dGVybihub2RlLm5hbWUpKSB7XG4gICAgICAgICAgICAvLyBDb2RlIGxpa2UgdGhpczogIGNvbnN0IHsgcGFnZVNldHVwLCBtYXJnaW5zIH0gPSBnZXRTaGVldENvbmZpZygpO1xuICAgICAgICAgICAgbm9kZS5uYW1lLmVsZW1lbnRzLmZvckVhY2goKG4pID0+IGFsbFZhcmlhYmxlcy5wdXNoKG4uZ2V0VGV4dCgpKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhbGxWYXJpYWJsZXMucHVzaChub2RlLm5hbWUuZ2V0VGV4dCgpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAodHMuaXNGdW5jdGlvbkRlY2xhcmF0aW9uKG5vZGUpKSB7XG4gICAgICAgIC8vIGNhdGNoIGxvY2FsbHkgZGVmaW5lZCBmdW5jdGlvbnMgd2l0aGluIHRoZSBtYWluIGZ1bmN0aW9uIGJvZHlcbiAgICAgICAgLy8gZnVuY3Rpb24gc2V0TWVzc2FnZShtc2c6IHN0cmluZykgeyAuLi4gfVxuICAgICAgICBhbGxWYXJpYWJsZXMucHVzaChub2RlLm5hbWUuZ2V0VGV4dCgpKTtcbiAgICB9XG4gICAgaWYgKHRzLmlzUGFyYW1ldGVyKG5vZGUpKSB7XG4gICAgICAgIC8vIGNhdGNoIGxvY2FsbHkgZGVmaW5lZCBhcnJvdyBmdW5jdGlvbnMgd2l0aCB0aGVpciBwYXJhbXNcbiAgICAgICAgLy8gIGNvbnN0IGNvbFRvTmFtZUZ1bmMgPSAoY29sOiBDb2x1bW4sIGluZGV4OiBudW1iZXIpID0+IGluZGV4ICsgJyA9ICcgKyBjb2wuZ2V0SWQoKVxuICAgICAgICAvLyAgY29uc3QgY29sTmFtZXMgPSBjb2xzLm1hcChjb2xUb05hbWVGdW5jKS5qb2luKCcsICcpXG5cbiAgICAgICAgYWxsVmFyaWFibGVzLnB1c2gobm9kZS5uYW1lLmdldFRleHQoKSk7XG4gICAgfVxuICAgIHRzLmZvckVhY2hDaGlsZChub2RlLCAobikgPT4ge1xuICAgICAgICBjb25zdCB2YXJpYWJsZXMgPSBmaW5kQWxsVmFyaWFibGVzKG4pO1xuICAgICAgICBpZiAodmFyaWFibGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGFsbFZhcmlhYmxlcyA9IFsuLi5hbGxWYXJpYWJsZXMsIC4uLnZhcmlhYmxlc107XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gYWxsVmFyaWFibGVzO1xufVxuXG5mdW5jdGlvbiBnZXRMb3dlc3RFeHByZXNzaW9uKGV4cDogYW55KSB7XG4gICAgbGV0IGhhc0V4cHJlc3Npb24gPSB0cnVlO1xuICAgIHdoaWxlIChoYXNFeHByZXNzaW9uKSB7XG4gICAgICAgIGhhc0V4cHJlc3Npb24gPSBleHAuZXhwcmVzc2lvbjtcbiAgICAgICAgaWYgKGhhc0V4cHJlc3Npb24pIHtcbiAgICAgICAgICAgIGV4cCA9IGV4cC5leHByZXNzaW9uIGFzIGFueTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZXhwO1xufVxuXG4vKipcbiAqIEZpbmQgYWxsIHRoZSBwcm9wZXJ0aWVzIGFjY2Vzc2VkIGluIHRoaXMgbm9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRBbGxBY2Nlc3NlZFByb3BlcnRpZXMobm9kZSkge1xuICAgIGxldCBwcm9wZXJ0aWVzID0gW107XG4gICAgaWYgKHRzLmlzSWRlbnRpZmllcihub2RlKSkge1xuICAgICAgICBjb25zdCBwcm9wZXJ0eSA9IG5vZGUuZ2V0VGV4dCgpO1xuICAgICAgICBpZiAocHJvcGVydHkgIT09ICd1bmRlZmluZWQnICYmIHByb3BlcnR5ICE9PSAnbnVsbCcpIHtcbiAgICAgICAgICAgIHByb3BlcnRpZXMucHVzaChub2RlLmdldFRleHQoKSk7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRzLmlzQ2FsbEV4cHJlc3Npb24obm9kZSkgfHwgdHMuaXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24obm9kZSkpIHtcbiAgICAgICAgLy8gV2hlbiB0aGVyZSBhcmUgY2hhaW5lZCBhY2Nlc3NlcyB3ZSBuZWVkIHRvIHJlY3Vyc2UgdG8gdGhlIGxvd2VzdCBpZGVudGlmaWVyIGFzIHRoaXMgaXMgdGhlIGZpcnN0IGluIHRoZSBzdGF0ZW1lbnQsXG4gICAgICAgIC8vIGFuZCB3aWxsIGJlIHRoZSB0cnVlIGFjY2Vzc2VkIHZhcmlhYmxlLlxuICAgICAgICAvLyBpLmUgZ3JpZE9wdGlvbnMuYXBpIS5nZXRNb2RlbCgpLmdldFJvd0NvdW50KCkgd2UgbmVlZCB0byByZWN1cnNlIGRvd24gdGhlIHRyZWUgdG8gZXh0cmFjdCBncmlkT3B0aW9uc1xuICAgICAgICBjb25zdCBleHAgPSBnZXRMb3dlc3RFeHByZXNzaW9uKG5vZGUuZXhwcmVzc2lvbik7XG5cbiAgICAgICAgaWYgKHRzLmlzQXJyYXlMaXRlcmFsRXhwcmVzc2lvbihleHApKSB7XG4gICAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgYXJyYXkgaGFzIGFueSBwcm9wZXJ0aWVzIGluIGl0IHRoYXQgYXJlIGRlcGVuZGVuY2llc1xuICAgICAgICAgICAgcHJvcGVydGllcyA9IFsuLi5wcm9wZXJ0aWVzLCAuLi5maW5kQWxsQWNjZXNzZWRQcm9wZXJ0aWVzKGV4cCldO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHJvcGVydGllcy5wdXNoKGV4cC5nZXRUZXh0KCkpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0cy5pc0NhbGxFeHByZXNzaW9uKG5vZGUpICYmIG5vZGUuYXJndW1lbnRzKSB7XG4gICAgICAgICAgICAvLyBDaGVjayBhcmd1bWVudHNcbiAgICAgICAgICAgIHByb3BlcnRpZXMgPSBbLi4ucHJvcGVydGllcywgLi4uZmluZEFsbEFjY2Vzc2VkUHJvcGVydGllcyhub2RlLmFyZ3VtZW50cyldO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmICh0cy5pc0JpbmFyeUV4cHJlc3Npb24obm9kZSkpIHtcbiAgICAgICAgLy8gSW4gdGhpcyBmdW5jdGlvbiB3ZSBzZXQgc3dpbW1pbmdIZWlnaHQgYnV0IGFyZSBub3QgZGVwZW5kZW50IG9uIGl0LFxuICAgICAgICAvLyBzbyBmb3IgYmluYXJ5IGV4cHJlc3Npb25zIHdlIG9ubHkgY2hlY2sgdGhlIHJpZ2h0IGhhbmQgYnJhbmNoXG4gICAgICAgIC8vIGZ1bmN0aW9uIHNldFN3aW1taW5nSGVpZ2h0KGhlaWdodDogbnVtYmVyKSB7XG4gICAgICAgIC8vICAgICAgc3dpbW1pbmdIZWlnaHQgPSBoZWlnaHRcbiAgICAgICAgLy8gICAgICBncmlkT3B0aW9ucy5hcGkhLnJlc2V0Um93SGVpZ2h0cygpXG4gICAgICAgIC8vIH1cbiAgICAgICAgY29uc3QgcmlnaHRQcm9wcyA9IGZpbmRBbGxBY2Nlc3NlZFByb3BlcnRpZXMobm9kZS5yaWdodCk7XG4gICAgICAgIGlmIChyaWdodFByb3BzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHByb3BlcnRpZXMgPSBbLi4ucHJvcGVydGllcywgLi4ucmlnaHRQcm9wc107XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRzLmlzVmFyaWFibGVEZWNsYXJhdGlvbihub2RlKSkge1xuICAgICAgICAvLyBnZXQgbG93ZXN0IGlkZW50aWZpZXIgYXMgdGhpcyBpcyB0aGUgZmlyc3QgaW4gdGhlIHN0YXRlbWVudFxuICAgICAgICAvLyBpLmUgdmFyIG5leHRIZWFkZXIgPSBwYXJhbXMubmV4dEhlYWRlclBvc2l0aW9uXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gcmVjdXJzZSBkb3duIHRoZSBpbml0aWFsaXplciB0cmVlIHRvIGV4dHJhY3QgcGFyYW1zIGFuZCBub3QgbmV4dEhlYWRlclBvc2l0aW9uXG4gICAgICAgIGNvbnN0IGluaXQgPSBub2RlLmluaXRpYWxpemVyIGFzIGFueTtcbiAgICAgICAgaWYgKGluaXQpIHtcbiAgICAgICAgICAgIGNvbnN0IGV4cCA9IGdldExvd2VzdEV4cHJlc3Npb24oaW5pdCk7XG4gICAgICAgICAgICBwcm9wZXJ0aWVzID0gWy4uLnByb3BlcnRpZXMsIC4uLmZpbmRBbGxBY2Nlc3NlZFByb3BlcnRpZXMoZXhwKV07XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRzLmlzUHJvcGVydHlBc3NpZ25tZW50KG5vZGUpKSB7XG4gICAgICAgIC8vIElnbm9yZSB0aGUgbmFtZSBvZiByb3dJbmRleCBqdXN0IGNoZWNrIHdoYXQgaXMgYmVpbmcgYXNzaWduZWRcbiAgICAgICAgLy8gIHtcbiAgICAgICAgLy8gICAgICByb3dJbmRleDogbmV4dFJvd0luZGV4LFxuICAgICAgICAvLyAgfVxuICAgICAgICBpZiAobm9kZS5pbml0aWFsaXplcikge1xuICAgICAgICAgICAgcHJvcGVydGllcyA9IFsuLi5wcm9wZXJ0aWVzLCAuLi5maW5kQWxsQWNjZXNzZWRQcm9wZXJ0aWVzKG5vZGUuaW5pdGlhbGl6ZXIpXTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHMuaXNFeHByZXNzaW9uU3RhdGVtZW50KG5vZGUpKSB7XG4gICAgICAgIGlmIChub2RlLmV4cHJlc3Npb24pIHtcbiAgICAgICAgICAgIHByb3BlcnRpZXMgPSBbLi4ucHJvcGVydGllcywgLi4uZmluZEFsbEFjY2Vzc2VkUHJvcGVydGllcyhub2RlLmV4cHJlc3Npb24pXTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHMuaXNDbGFzc0RlY2xhcmF0aW9uKG5vZGUpKSB7XG4gICAgICAgIC8vIERvIG5vdGhpbmcgZm9yIENsYXNzIGRlY2xhcmF0aW9ucyBhcyB0aGlzIGlzIGxpa2VseSBhIGNlbGwgcmVuZGVyZXIgc2V0dXBcbiAgICB9IGVsc2UgaWYgKHRzLmlzVHlwZVJlZmVyZW5jZU5vZGUobm9kZSkpIHtcbiAgICAgICAgLy8gRG8gbm90aGluZyBmb3IgVHlwZSByZWZlcmVuY2VzXG4gICAgfSBlbHNlIGlmIChub2RlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgbm9kZS5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICAgICAgICBwcm9wZXJ0aWVzID0gWy4uLnByb3BlcnRpZXMsIC4uLmZpbmRBbGxBY2Nlc3NlZFByb3BlcnRpZXMoZWxlbWVudCldO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBSZWN1cnNlIGRvd24gdGhlIHRyZWUgbG9va2luZyBmb3IgbW9yZSBhY2Nlc3NlZCBwcm9wZXJ0aWVzXG4gICAgICAgIHRzLmZvckVhY2hDaGlsZChub2RlLCAobikgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvcHMgPSBmaW5kQWxsQWNjZXNzZWRQcm9wZXJ0aWVzKG4pO1xuICAgICAgICAgICAgaWYgKHByb3BzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzID0gWy4uLnByb3BlcnRpZXMsIC4uLnByb3BzXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb3BlcnRpZXM7XG59XG5cbi8qKiBDb252ZXJ0IGltcG9ydCBwYXRocyB0byB0aGVpciBwYWNrYWdlIGVxdWl2YWxlbnQgd2hlbiB0aGUgZG9jcyBhcmUgaW4gUGFja2FnZXMgbW9kZVxuICogaS5lIGltcG9ydCB7IEdyaWRPcHRpb25zIH0gZnJvbSAnQGFnLWdyaWQtY29tbXVuaXR5L2NvcmUnO1xuICogdG9cbiAqIGltcG9ydCB7IEdyaWRPcHRpb25zIH0gZnJvbSAnQGFnLWdyaWQtY29tbXVuaXR5JztcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnRJbXBvcnRQYXRoKG1vZHVsZVBhY2thZ2U6IHN0cmluZywgY29udmVydFRvUGFja2FnZTogYm9vbGVhbikge1xuICAgIGlmIChjb252ZXJ0VG9QYWNrYWdlKSB7XG4gICAgICAgIGNvbnN0IGNvbnZlcnNpb25zID0ge1xuICAgICAgICAgICAgXCInQGFnLWdyaWQtY29tbXVuaXR5L2FuZ3VsYXInXCI6IFwiJ2FnLWdyaWQtYW5ndWxhcidcIixcbiAgICAgICAgICAgICdcIkBhZy1ncmlkLWNvbW11bml0eS9hbmd1bGFyXCInOiBcIidhZy1ncmlkLWFuZ3VsYXInXCIsXG4gICAgICAgICAgICBcIidAYWctZ3JpZC1jb21tdW5pdHkvdnVlMydcIjogXCInYWctZ3JpZC12dWUzJ1wiLFxuICAgICAgICAgICAgJ1wiQGFnLWdyaWQtY29tbXVuaXR5L3Z1ZTNcIic6IFwiJ2FnLWdyaWQtdnVlMydcIixcbiAgICAgICAgICAgIFwiJ0BhZy1ncmlkLWNvbW11bml0eS92dWUnXCI6IFwiJ2FnLWdyaWQtdnVlJ1wiLFxuICAgICAgICAgICAgJ1wiQGFnLWdyaWQtY29tbXVuaXR5L3Z1ZVwiJzogXCInYWctZ3JpZC12dWUnXCIsXG4gICAgICAgICAgICBcIidAYWctZ3JpZC1jb21tdW5pdHkvcmVhY3QnXCI6IFwiJ2FnLWdyaWQtcmVhY3QnXCIsXG4gICAgICAgICAgICAnXCJAYWctZ3JpZC1jb21tdW5pdHkvcmVhY3RcIic6IFwiJ2FnLWdyaWQtcmVhY3QnXCIsXG4gICAgICAgIH07XG4gICAgICAgIGlmIChjb252ZXJzaW9uc1ttb2R1bGVQYWNrYWdlXSkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbnZlcnNpb25zW21vZHVsZVBhY2thZ2VdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1vZHVsZVBhY2thZ2UuaW5jbHVkZXMoJ0BhZy1ncmlkLWNvbW11bml0eS9jb3JlL2Rpc3QnKSkge1xuICAgICAgICAgICAgcmV0dXJuIG1vZHVsZVBhY2thZ2UucmVwbGFjZSgnQGFnLWdyaWQtY29tbXVuaXR5L2NvcmUvZGlzdCcsICdhZy1ncmlkLWNvbW11bml0eS9kaXN0Jyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1vZHVsZVBhY2thZ2UuaW5jbHVkZXMoJ0BhZy1ncmlkLWNvbW11bml0eS9zdHlsZXMnKSkge1xuICAgICAgICAgICAgcmV0dXJuIG1vZHVsZVBhY2thZ2UucmVwbGFjZSgnQGFnLWdyaWQtY29tbXVuaXR5L3N0eWxlcycsICdhZy1ncmlkLWNvbW11bml0eS9zdHlsZXMnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtb2R1bGVQYWNrYWdlLmluY2x1ZGVzKCdAYWctZ3JpZC1jb21tdW5pdHknKSkge1xuICAgICAgICAgICAgcmV0dXJuIGAnYWctZ3JpZC1jb21tdW5pdHknYDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobW9kdWxlUGFja2FnZS5pbmNsdWRlcygnQGFnLWdyaWQtZW50ZXJwcmlzZScpKSB7XG4gICAgICAgICAgICByZXR1cm4gYCdhZy1ncmlkLWVudGVycHJpc2UnYDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbW9kdWxlUGFja2FnZS5yZXBsYWNlKCdfdHlwZXNjcmlwdCcsICcnKS5yZXBsYWNlKC9cIi9nLCBgJ2ApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW1wb3J0KGZpbGVuYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBjb21wb25lbnRGaWxlTmFtZSA9IGZpbGVuYW1lLnNwbGl0KCcuJylbMF07XG4gICAgY29uc3QgY29tcG9uZW50TmFtZSA9IGNvbXBvbmVudEZpbGVOYW1lWzBdLnRvVXBwZXJDYXNlKCkgKyBjb21wb25lbnRGaWxlTmFtZS5zbGljZSgxKTtcbiAgICByZXR1cm4gYGltcG9ydCB7ICR7Y29tcG9uZW50TmFtZX0gfSBmcm9tICcuLyR7Y29tcG9uZW50RmlsZU5hbWV9JztgO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvcGVydHlJbnRlcmZhY2VzKHByb3BlcnRpZXMpIHtcbiAgICBsZXQgcHJvcFR5cGVzVXNlZCA9IFtdO1xuICAgIHByb3BlcnRpZXMuZm9yRWFjaCgocHJvcCkgPT4ge1xuICAgICAgICBpZiAocHJvcC50eXBpbmdzPy50eXBlc1RvSW5jbHVkZT8ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcHJvcFR5cGVzVXNlZCA9IFsuLi5wcm9wVHlwZXNVc2VkLCAuLi5wcm9wLnR5cGluZ3MudHlwZXNUb0luY2x1ZGVdO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIFsuLi5uZXcgU2V0KHByb3BUeXBlc1VzZWQpXTtcbn1cblxuLyoqXG4gKiAgQWRkIHRoZSBpbXBvcnRzIGZyb20gdGhlIHBhcnNlZCBmaWxlXG4gKiBXZSBpZ25vcmUgYW55IGNvbXBvbmVudCBmaWxlcyBhcyB0aG9zZSBpbXBvcnRzIGFyZSBnZW5lcmF0ZWQgZm9yIGVhY2ggZnJhbWV3b3JrLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkQmluZGluZ0ltcG9ydHMoXG4gICAgYmluZGluZ0ltcG9ydHM6IGFueSxcbiAgICBpbXBvcnRzOiBzdHJpbmdbXSxcbiAgICBjb252ZXJ0VG9QYWNrYWdlOiBib29sZWFuLFxuICAgIGlnbm9yZVRzSW1wb3J0czogYm9vbGVhblxuKSB7XG4gICAgY29uc3Qgd29ya2luZ0ltcG9ydHMgPSB7fTtcbiAgICBjb25zdCBuYW1lc3BhY2VkSW1wb3J0cyA9IFtdO1xuXG4gICAgY29uc3QgY2hhcnRzRW50ZXJwcmlzZSA9IGJpbmRpbmdJbXBvcnRzLnNvbWUoKGkpID0+IGkubW9kdWxlLmluY2x1ZGVzKCdhZy1jaGFydHMtZW50ZXJwcmlzZScpKTtcblxuICAgIGJpbmRpbmdJbXBvcnRzLmZvckVhY2goKGk6IEJpbmRpbmdJbXBvcnQpID0+IHtcbiAgICAgICAgY29uc3QgcGF0aCA9IGNvbnZlcnRJbXBvcnRQYXRoKGkubW9kdWxlLCBjb252ZXJ0VG9QYWNrYWdlKTtcbiAgICAgICAgaWYgKCFpLm1vZHVsZS5pbmNsdWRlcygnX3R5cGVzY3JpcHQnKSB8fCAhaWdub3JlVHNJbXBvcnRzKSB7XG4gICAgICAgICAgICB3b3JraW5nSW1wb3J0c1twYXRoXSA9IHdvcmtpbmdJbXBvcnRzW3BhdGhdIHx8IHtcbiAgICAgICAgICAgICAgICBuYW1lZEltcG9ydDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIGltcG9ydHM6IFtdLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChpLmlzTmFtZXNwYWNlZCkge1xuICAgICAgICAgICAgICAgIGlmIChpLmltcG9ydHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBuYW1lc3BhY2VkSW1wb3J0cy5wdXNoKGBpbXBvcnQgKiBhcyAke2kuaW1wb3J0c1swXX0gZnJvbSAke3BhdGh9O2ApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZWRJbXBvcnRzLnB1c2goYGltcG9ydCAke3BhdGh9O2ApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGkubmFtZWRJbXBvcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgd29ya2luZ0ltcG9ydHNbcGF0aF0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAuLi53b3JraW5nSW1wb3J0c1twYXRoXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWVkSW1wb3J0OiBpLm5hbWVkSW1wb3J0LFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaS5pbXBvcnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIHdvcmtpbmdJbXBvcnRzW3BhdGhdID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLi4ud29ya2luZ0ltcG9ydHNbcGF0aF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnRzOiBbLi4ud29ya2luZ0ltcG9ydHNbcGF0aF0uaW1wb3J0cywgLi4uaS5pbXBvcnRzXSxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIFsuLi5uZXcgU2V0KG5hbWVzcGFjZWRJbXBvcnRzKV0uZm9yRWFjaCgobmkpID0+IGltcG9ydHMucHVzaChuaSkpO1xuXG4gICAgbGV0IGhhc0VudGVycHJpc2VNb2R1bGVzID0gZmFsc2U7XG4gICAgT2JqZWN0LmVudHJpZXMod29ya2luZ0ltcG9ydHMpLmZvckVhY2goKFtrLCB2XTogW3N0cmluZywgeyBuYW1lZEltcG9ydDogc3RyaW5nOyBpbXBvcnRzOiBzdHJpbmdbXSB9XSkgPT4ge1xuICAgICAgICBsZXQgdW5pcXVlID0gWy4uLm5ldyBTZXQodi5pbXBvcnRzKV0uc29ydCgpO1xuXG4gICAgICAgIGlmIChjb252ZXJ0VG9QYWNrYWdlICYmIGsuaW5jbHVkZXMoJ2FnLWdyaWQnKSkge1xuICAgICAgICAgICAgLy8gUmVtb3ZlIG1vZHVsZSByZWxhdGVkIGltcG9ydHNcbiAgICAgICAgICAgIHVuaXF1ZSA9IHVuaXF1ZS5maWx0ZXIoKGkpID0+ICFpLmluY2x1ZGVzKCdNb2R1bGUnKSB8fCBpID09ICdBZ0dyaWRNb2R1bGUnKTtcbiAgICAgICAgICAgIGhhc0VudGVycHJpc2VNb2R1bGVzID0gaGFzRW50ZXJwcmlzZU1vZHVsZXMgfHwgay5pbmNsdWRlcygnZW50ZXJwcmlzZScpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1bmlxdWUubGVuZ3RoID4gMCB8fCB2Lm5hbWVkSW1wb3J0KSB7XG4gICAgICAgICAgICBjb25zdCBuYW1lZEltcG9ydCA9IHYubmFtZWRJbXBvcnQgPyB2Lm5hbWVkSW1wb3J0IDogJyc7XG4gICAgICAgICAgICBjb25zdCBpbXBvcnRTdHIgPSB1bmlxdWUubGVuZ3RoID4gMCA/IGB7ICR7dW5pcXVlLmpvaW4oJywgJyl9IH1gIDogJyc7XG4gICAgICAgICAgICBjb25zdCBqb2luaW5nQ29tbWEgPSBuYW1lZEltcG9ydCAmJiBpbXBvcnRTdHIgPyAnLCAnIDogJyc7XG4gICAgICAgICAgICBpbXBvcnRzLnB1c2goYGltcG9ydCAke25hbWVkSW1wb3J0fSR7am9pbmluZ0NvbW1hfSR7aW1wb3J0U3RyfSBmcm9tICR7a307YCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoaGFzRW50ZXJwcmlzZU1vZHVsZXMgJiYgY29udmVydFRvUGFja2FnZSkge1xuICAgICAgICBpbXBvcnRzLnB1c2goYGltcG9ydCAnYWctZ3JpZC1lbnRlcnByaXNlJztgKTtcbiAgICB9XG5cbiAgICBpZiAoY2hhcnRzRW50ZXJwcmlzZSkge1xuICAgICAgICBpbXBvcnRzLnB1c2goYGltcG9ydCAnYWctY2hhcnRzLWVudGVycHJpc2UnO2ApO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1vZHVsZVJlZ2lzdHJhdGlvbih7IGdyaWRTZXR0aW5ncywgZW50ZXJwcmlzZSwgZXhhbXBsZU5hbWUgfSkge1xuICAgIGNvbnN0IG1vZHVsZVJlZ2lzdHJhdGlvbiA9IFtcImltcG9ydCB7IE1vZHVsZVJlZ2lzdHJ5IH0gZnJvbSAnQGFnLWdyaWQtY29tbXVuaXR5L2NvcmUnO1wiXTtcbiAgICBjb25zdCBtb2R1bGVzID0gZ3JpZFNldHRpbmdzLm1vZHVsZXM7XG5cbiAgICBpZiAoZW50ZXJwcmlzZSAmJiAhQXJyYXkuaXNBcnJheShtb2R1bGVzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICBgVGhlIGV4YW1wbGUgJHtleGFtcGxlTmFtZX0gaGFzIFwiZW50ZXJwcmlzZVwiIDogdHJ1ZSBidXQgbm8gbW9kdWxlcyBoYXZlIGJlZW4gcHJvdmlkZWQgXCJtb2R1bGVzXCI6Wy4uLl0uIEVpdGhlciByZW1vdmUgdGhlIGVudGVycHJpc2UgZmxhZyBvciBwcm92aWRlIHRoZSByZXF1aXJlZCBtb2R1bGVzLmBcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBleGFtcGxlTW9kdWxlcyA9IEFycmF5LmlzQXJyYXkobW9kdWxlcykgPyBtb2R1bGVzIDogWydjbGllbnRzaWRlJ107XG4gICAgY29uc3QgeyBtb2R1bGVJbXBvcnRzLCBzdXBwbGllZE1vZHVsZXMgfSA9IG1vZHVsZXNQcm9jZXNzb3IoZXhhbXBsZU1vZHVsZXMpO1xuICAgIG1vZHVsZVJlZ2lzdHJhdGlvbi5wdXNoKC4uLm1vZHVsZUltcG9ydHMpO1xuICAgIGNvbnN0IGdyaWRTdXBwbGllZE1vZHVsZXMgPSBgWyR7c3VwcGxpZWRNb2R1bGVzLmpvaW4oJywgJyl9XWA7XG5cbiAgICBtb2R1bGVSZWdpc3RyYXRpb24ucHVzaChgXFxuLy8gUmVnaXN0ZXIgdGhlIHJlcXVpcmVkIGZlYXR1cmUgbW9kdWxlcyB3aXRoIHRoZSBHcmlkYCk7XG4gICAgbW9kdWxlUmVnaXN0cmF0aW9uLnB1c2goYE1vZHVsZVJlZ2lzdHJ5LnJlZ2lzdGVyTW9kdWxlcygke2dyaWRTdXBwbGllZE1vZHVsZXN9KWApO1xuICAgIHJldHVybiBtb2R1bGVSZWdpc3RyYXRpb247XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVSb3dHZW5lcmljSW50ZXJmYWNlKGZpbGVUeHQ6IHN0cmluZywgdERhdGE6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKHREYXRhKSB7XG4gICAgICAgIGZpbGVUeHQgPSBmaWxlVHh0XG4gICAgICAgICAgICAucmVwbGFjZShcbiAgICAgICAgICAgICAgICAvPChURGF0YXxUVmFsdWV8VENvbnRleHR8YW55KT8oLCApPyhURGF0YXxUVmFsdWV8VENvbnRleHR8YW55KT8oLCApPyhURGF0YXxUVmFsdWV8VENvbnRleHR8YW55KT8+L2csXG4gICAgICAgICAgICAgICAgJydcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIC5yZXBsYWNlKC9URGF0YVxcW1xcXS9nLCBgJHt0RGF0YX1bXWApO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZpbGVUeHQgPSBmaWxlVHh0LnJlcGxhY2UoLzxURGF0YT4vZywgJycpLnJlcGxhY2UoL1REYXRhXFxbXFxdL2csICdhbnlbXScpO1xuICAgIH1cbiAgICByZXR1cm4gZmlsZVR4dDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFkZEdlbmVyaWNJbnRlcmZhY2VJbXBvcnQoaW1wb3J0czogc3RyaW5nW10sIHREYXRhOiBzdHJpbmcsIGJpbmRpbmdzKSB7XG4gICAgaWYgKHREYXRhICYmICFiaW5kaW5ncy5pbnRlcmZhY2VzLnNvbWUoKGkpID0+IGkuaW5jbHVkZXModERhdGEpKSAmJiAhaW1wb3J0cy5zb21lKChpKSA9PiBpLmluY2x1ZGVzKHREYXRhKSkpIHtcbiAgICAgICAgaW1wb3J0cy5wdXNoKGBpbXBvcnQgeyAke3REYXRhfSB9IGZyb20gJy4vaW50ZXJmYWNlcydgKTtcbiAgICB9XG59XG4iXSwibmFtZXMiOlsiYWRkQmluZGluZ0ltcG9ydHMiLCJhZGRHZW5lcmljSW50ZXJmYWNlSW1wb3J0IiwiY29udmVydEZ1bmN0aW9uVG9Db25zdFByb3BlcnR5IiwiY29udmVydEZ1bmN0aW9uVG9Db25zdFByb3BlcnR5VHMiLCJjb252ZXJ0RnVuY3Rpb25Ub1Byb3BlcnR5IiwiY29udmVydEltcG9ydFBhdGgiLCJleHRyYWN0Q2xhc3NEZWNsYXJhdGlvbnMiLCJleHRyYWN0RXZlbnRIYW5kbGVycyIsImV4dHJhY3RJbXBvcnRTdGF0ZW1lbnRzIiwiZXh0cmFjdEludGVyZmFjZXMiLCJleHRyYWN0VHlwZURlY2xhcmF0aW9ucyIsImV4dHJhY3RUeXBlSW5mb0ZvclZhcmlhYmxlIiwiZXh0cmFjdFVuYm91bmRJbnN0YW5jZU1ldGhvZHMiLCJmaW5kQWxsQWNjZXNzZWRQcm9wZXJ0aWVzIiwiZmluZEFsbFZhcmlhYmxlcyIsImdldEZ1bmN0aW9uTmFtZSIsImdldEltcG9ydCIsImdldE1vZHVsZVJlZ2lzdHJhdGlvbiIsImdldFByb3BlcnR5SW50ZXJmYWNlcyIsImdldFR5cGVzIiwiaGFuZGxlUm93R2VuZXJpY0ludGVyZmFjZSIsImlzSW5zdGFuY2VNZXRob2QiLCJtb2R1bGVzUHJvY2Vzc29yIiwicGFyc2VGaWxlIiwicmVhZEFzSnNGaWxlIiwicmVjb2duaXplZERvbUV2ZW50cyIsInJlbW92ZUZ1bmN0aW9uS2V5d29yZCIsInJlbW92ZUluU2NvcGVKc0RvYyIsInRzQ29sbGVjdCIsInRzR2VuZXJhdGUiLCJ0c05vZGVJc0Z1bmN0aW9uQ2FsbCIsInRzTm9kZUlzRnVuY3Rpb25XaXRoTmFtZSIsInRzTm9kZUlzR2xvYmFsRnVuY3Rpb25DYWxsIiwidHNOb2RlSXNHbG9iYWxWYXIiLCJ0c05vZGVJc0dsb2JhbFZhcldpdGhOYW1lIiwidHNOb2RlSXNJblNjb3BlIiwidHNOb2RlSXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb25PZiIsInRzTm9kZUlzUHJvcGVydHlXaXRoTmFtZSIsInRzTm9kZUlzVG9wTGV2ZWxGdW5jdGlvbiIsInRzTm9kZUlzVG9wTGV2ZWxWYXJpYWJsZSIsInRzTm9kZUlzVHlwZURlY2xhcmF0aW9uIiwidHNOb2RlSXNVbnVzZWRGdW5jdGlvbiIsInVzZXNDaGFydEFwaSIsInNyY0ZpbGUiLCJvcHRpb25zIiwidW5kZWZpbmVkIiwidHNGaWxlIiwicmVwbGFjZSIsImluY2x1ZGVJbXBvcnRzIiwianNGaWxlIiwidHJhbnNmb3JtIiwidHJhbnNmb3JtcyIsImRpc2FibGVFU1RyYW5zZm9ybXMiLCJjb2RlIiwic3JjIiwidHMiLCJjcmVhdGVTb3VyY2VGaWxlIiwiU2NyaXB0VGFyZ2V0IiwiTGF0ZXN0IiwicHJpbnRlciIsImNyZWF0ZVByaW50ZXIiLCJyZW1vdmVDb21tZW50cyIsIm9taXRUcmFpbGluZ1NlbWljb2xvbiIsIm5vZGUiLCJwcmludE5vZGUiLCJFbWl0SGludCIsIlVuc3BlY2lmaWVkIiwiZXJyb3IiLCJjb25zb2xlIiwibW9kdWxlcyIsIm1vZHVsZUltcG9ydHMiLCJzdXBwbGllZE1vZHVsZXMiLCJyZXF1aXJlZE1vZHVsZXMiLCJmb3JFYWNoIiwibW9kdWxlIiwid2FybiIsInJlcXVpcmVkTW9kdWxlIiwicHVzaCIsImV4cG9ydGVkIiwibWF0Y2hlcyIsImV4ZWMiLCJsZW5ndGgiLCJ0cmltIiwibWV0aG9kcyIsInByb3BlcnR5IiwibWFwIiwiZmlsdGVyIiwibmFtZSIsIk5vZGVUeXBlIiwidHNUcmVlIiwidHNCaW5kaW5ncyIsImNvbGxlY3RvcnMiLCJyZWN1cnNlIiwiZm9yRWFjaENoaWxkIiwiYyIsInJlcyIsImFwcGx5IiwiaXNWYXJpYWJsZURlY2xhcmF0aW9uIiwiaXNTb3VyY2VGaWxlIiwicGFyZW50IiwiZ2V0VGV4dCIsImlzUHJvcGVydHlBc3NpZ25tZW50IiwiaW5pdGlhbGl6ZXIiLCJyZWdpc3RlcmVkIiwiaXNWYXJpYWJsZURlY2xhcmF0aW9uTGlzdCIsImRlY2xhcmF0aW9ucyIsImRlY2xhcmF0aW9uIiwiaXNEZWNsYXJlU3RhdGVtZW50IiwiaW5kZXhPZiIsImlzRnVuY3Rpb25EZWNsYXJhdGlvbiIsImlzTWF0Y2giLCJ1bmJvdW5kSW5zdGFuY2VNZXRob2RzIiwidXNlZCIsImlzRnVuY3Rpb25MaWtlIiwiaXNUb3BMZXZlbCIsIm1vZGlmaWVycyIsInNvbWUiLCJtIiwiaXNWYXJpYWJsZVN0YXRlbWVudCIsInByb3BlcnRpZXMiLCJFcnJvciIsImlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uIiwiaXNJZGVudGlmaWVyIiwiZXhwcmVzc2lvbiIsImVzY2FwZWRUZXh0IiwiaXNDYWxsRXhwcmVzc2lvbiIsImlzRXhwcmVzc2lvblN0YXRlbWVudCIsImZsYXRNYXAiLCJhcnJheSIsImNhbGxiYWNrIiwiQXJyYXkiLCJwcm90b3R5cGUiLCJjb25jYXQiLCJleHRyYWN0RXZlbnRIYW5kbGVyQm9keSIsIm1hdGNoIiwiZG9tVHJlZSIsImV2ZW50TmFtZXMiLCJnZXRIYW5kbGVyQXR0cmlidXRlcyIsImV2ZW50IiwiaGFuZGxlck5hbWUiLCJpbmRleCIsImVsIiwiYXR0ciIsInJlc3VsdCIsInRvQXJyYXkiLCJtZXRob2QiLCJpblNjb3BlTWV0aG9kcyIsInN0YXRlbWVudHMiLCJkb2NzIiwianNEb2MiLCJkb2MiLCJ0cmltbWVkIiwiY29tbWVudCIsImluY2x1ZGVzIiwidmFyTmFtZSIsInR5cGVTdHIiLCJ0eXBlUGFydHMiLCJkZWNsYXJhdGlvbkxpc3QiLCJkZWMiLCJ0eXBlIiwidHlwZXNUb0luY2x1ZGUiLCJ0eXBlTmFtZSIsImN0IiwidXNlc0FwaSIsImFsbEltcG9ydHMiLCJpc0ltcG9ydERlY2xhcmF0aW9uIiwibW9kdWxlU3BlY2lmaWVyIiwiaW1wb3J0Q2xhdXNlIiwiaW1wb3J0cyIsIm5hbWVkSW1wb3J0IiwiaXNOYW1lc3BhY2VkIiwibmFtZWRCaW5kaW5ncyIsImlzTmFtZXNwYWNlSW1wb3J0IiwibyIsImFsbERlY2xhcmVTdGF0ZW1lbnRzIiwicyIsImtpbmQiLCJTeW50YXhLaW5kIiwiRGVjbGFyZUtleXdvcmQiLCJhbGxDbGFzc2VzIiwiaXNDbGFzc0RlY2xhcmF0aW9uIiwiYWxsSW50ZXJmYWNlcyIsImlzSW50ZXJmYWNlRGVjbGFyYXRpb24iLCJhbGxWYXJpYWJsZXMiLCJpc09iamVjdEJpbmRpbmdQYXR0ZXJuIiwiZWxlbWVudHMiLCJuIiwiaXNQYXJhbWV0ZXIiLCJ2YXJpYWJsZXMiLCJnZXRMb3dlc3RFeHByZXNzaW9uIiwiZXhwIiwiaGFzRXhwcmVzc2lvbiIsImlzQXJyYXlMaXRlcmFsRXhwcmVzc2lvbiIsImFyZ3VtZW50cyIsImlzQmluYXJ5RXhwcmVzc2lvbiIsInJpZ2h0UHJvcHMiLCJyaWdodCIsImluaXQiLCJpc1R5cGVSZWZlcmVuY2VOb2RlIiwiZWxlbWVudCIsInByb3BzIiwibW9kdWxlUGFja2FnZSIsImNvbnZlcnRUb1BhY2thZ2UiLCJjb252ZXJzaW9ucyIsImZpbGVuYW1lIiwiY29tcG9uZW50RmlsZU5hbWUiLCJzcGxpdCIsImNvbXBvbmVudE5hbWUiLCJ0b1VwcGVyQ2FzZSIsInNsaWNlIiwicHJvcFR5cGVzVXNlZCIsInByb3AiLCJ0eXBpbmdzIiwiU2V0IiwiYmluZGluZ0ltcG9ydHMiLCJpZ25vcmVUc0ltcG9ydHMiLCJ3b3JraW5nSW1wb3J0cyIsIm5hbWVzcGFjZWRJbXBvcnRzIiwiY2hhcnRzRW50ZXJwcmlzZSIsImkiLCJwYXRoIiwibmkiLCJoYXNFbnRlcnByaXNlTW9kdWxlcyIsIk9iamVjdCIsImVudHJpZXMiLCJrIiwidiIsInVuaXF1ZSIsInNvcnQiLCJpbXBvcnRTdHIiLCJqb2luIiwiam9pbmluZ0NvbW1hIiwiZ3JpZFNldHRpbmdzIiwiZW50ZXJwcmlzZSIsImV4YW1wbGVOYW1lIiwibW9kdWxlUmVnaXN0cmF0aW9uIiwiaXNBcnJheSIsImV4YW1wbGVNb2R1bGVzIiwiZ3JpZFN1cHBsaWVkTW9kdWxlcyIsImZpbGVUeHQiLCJ0RGF0YSIsImJpbmRpbmdzIiwiaW50ZXJmYWNlcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7SUF1bUJnQkEsaUJBQWlCO2VBQWpCQTs7SUFzR0FDLHlCQUF5QjtlQUF6QkE7O0lBL21CSEMsOEJBQThCO2VBQTlCQTs7SUFFQUMsZ0NBQWdDO2VBQWhDQTs7SUFMQUMseUJBQXlCO2VBQXpCQTs7SUF1ZEdDLGlCQUFpQjtlQUFqQkE7O0lBaEtBQyx3QkFBd0I7ZUFBeEJBOztJQXhJQUMsb0JBQW9CO2VBQXBCQTs7SUEyRkFDLHVCQUF1Qjtl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