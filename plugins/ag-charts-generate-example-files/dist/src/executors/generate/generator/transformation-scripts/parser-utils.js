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
    imports.push(...new Set(namespacedImports));
    let hasEnterpriseModules = false;
    Object.entries(workingImports).forEach(([k, v])=>{
        let unique = [
            ...new Set(v.imports)
        ].sort();
        if (convertToPackage && k.includes('ag-grid')) {
            // Remove module related imports
            unique = unique.filter((i)=>!i.includes('Module') || i == 'AgGridModule');
            hasEnterpriseModules || (hasEnterpriseModules = k.includes('enterprise'));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL3RyYW5zZm9ybWF0aW9uLXNjcmlwdHMvcGFyc2VyLXV0aWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHRyYW5zZm9ybSB9IGZyb20gJ3N1Y3Jhc2UnO1xuaW1wb3J0IHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5leHBvcnQgdHlwZSBJbXBvcnRUeXBlID0gJ3BhY2thZ2VzJyB8ICdtb2R1bGVzJztcblxuZXhwb3J0IGludGVyZmFjZSBCaW5kaW5nSW1wb3J0IHtcbiAgICBpc05hbWVzcGFjZWQ6IGJvb2xlYW47XG4gICAgbW9kdWxlOiBzdHJpbmc7XG4gICAgbmFtZWRJbXBvcnQ6IHN0cmluZztcbiAgICBpbXBvcnRzOiBzdHJpbmdbXTtcbn1cblxuLy8gY29uc3QgbW9kdWxlTWFwcGluZyA9IHJlcXVpcmUoXCIuLi8uLi9kb2N1bWVudGF0aW9uL2RvYy1wYWdlcy9tb2R1bGVzL21vZHVsZXMuanNvblwiKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRBc0pzRmlsZShzcmNGaWxlLCBvcHRpb25zOiB7IGluY2x1ZGVJbXBvcnRzOiBib29sZWFuIH0gPSB1bmRlZmluZWQpIHtcbiAgICBjb25zdCB0c0ZpbGUgPSBzcmNGaWxlXG4gICAgICAgIC8vIFJlbW92ZSBpbXBvcnRzIHRoYXQgYXJlIG5vdCByZXF1aXJlZCBpbiBqYXZhc2NyaXB0XG4gICAgICAgIC5yZXBsYWNlKG9wdGlvbnM/LmluY2x1ZGVJbXBvcnRzID8gJycgOiAvaW1wb3J0ICgoLnxcXHI/XFxuKSo/KWZyb20uKlxccj9cXG4vZywgJycpXG4gICAgICAgIC8vIFJlbW92ZSBleHBvcnQgc3RhdGVtZW50XG4gICAgICAgIC5yZXBsYWNlKC9leHBvcnQgL2csICcnKTtcblxuICAgIGNvbnN0IGpzRmlsZSA9IHRyYW5zZm9ybSh0c0ZpbGUsIHsgdHJhbnNmb3JtczogWyd0eXBlc2NyaXB0J10sIGRpc2FibGVFU1RyYW5zZm9ybXM6IHRydWUgfSkuY29kZTtcblxuICAgIHJldHVybiBqc0ZpbGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUZpbGUoc3JjKSB7XG4gICAgcmV0dXJuIHRzLmNyZWF0ZVNvdXJjZUZpbGUoJ3RlbXBGaWxlLnRzJywgc3JjLCB0cy5TY3JpcHRUYXJnZXQuTGF0ZXN0LCB0cnVlKTtcbn1cblxuLy8gZXhwb3J0IGludGVyZmFjZSBQcmludGVyT3B0aW9ucyB7XG4vLyAgICAgcmVtb3ZlQ29tbWVudHM/OiBib29sZWFuO1xuLy8gICAgIG5ld0xpbmU/OiBOZXdMaW5lS2luZDtcbi8vICAgICBvbWl0VHJhaWxpbmdTZW1pY29sb24/OiBib29sZWFuO1xuLy8gICAgIG5vRW1pdEhlbHBlcnM/OiBib29sZWFuO1xuLy8gfVxuY29uc3QgcHJpbnRlciA9IHRzLmNyZWF0ZVByaW50ZXIoe1xuICAgIHJlbW92ZUNvbW1lbnRzOiBmYWxzZSxcbiAgICBvbWl0VHJhaWxpbmdTZW1pY29sb246IGZhbHNlLFxufSk7XG5cbmV4cG9ydCBmdW5jdGlvbiB0c0dlbmVyYXRlKG5vZGUsIHNyY0ZpbGUpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJpbnRlci5wcmludE5vZGUodHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIG5vZGUsIHNyY0ZpbGUpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIH1cbiAgICByZXR1cm4gJ0VSUk9SIC0gUHJpbnRpbmcnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbW9kdWxlc1Byb2Nlc3Nvcihtb2R1bGVzOiBzdHJpbmdbXSkge1xuICAgIGNvbnN0IG1vZHVsZUltcG9ydHMgPSBbXTtcbiAgICBjb25zdCBzdXBwbGllZE1vZHVsZXMgPSBbXTtcblxuICAgIGNvbnN0IHJlcXVpcmVkTW9kdWxlcyA9IFtdO1xuICAgIG1vZHVsZXMuZm9yRWFjaCgobW9kdWxlKSA9PiB7XG4gICAgICAgIC8vIGxldCBmb3VuZCA9IGZhbHNlO1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgICBjb25zb2xlLndhcm4oYFRPRE86IG1vZHVsZSBtYXBwaW5nIGZvciAke21vZHVsZX1gKTtcbiAgICAgICAgLy8gbW9kdWxlTWFwcGluZy5mb3JFYWNoKChtb2R1bGVDb25maWcpID0+IHtcbiAgICAgICAgLy8gICBpZiAobW9kdWxlQ29uZmlnLnNob3J0bmFtZSAmJiBtb2R1bGVDb25maWcuc2hvcnRuYW1lID09IG1vZHVsZSkge1xuICAgICAgICAvLyAgICAgcmVxdWlyZWRNb2R1bGVzLnB1c2gobW9kdWxlQ29uZmlnKTtcbiAgICAgICAgLy8gICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgLy8gICB9XG4gICAgICAgIC8vIH0pO1xuICAgICAgICAvLyBpZiAoIWZvdW5kKSB7XG4gICAgICAgIC8vICAgY29uc29sZS5lcnJvcihgQ291bGQgbm90IGZpbmQgbW9kdWxlICR7bW9kdWxlfSBpbiBtb2R1bGVzLmpzb25gKTtcbiAgICAgICAgLy8gfVxuICAgIH0pO1xuXG4gICAgcmVxdWlyZWRNb2R1bGVzLmZvckVhY2goKHJlcXVpcmVkTW9kdWxlKSA9PiB7XG4gICAgICAgIG1vZHVsZUltcG9ydHMucHVzaChgaW1wb3J0IHsgJHtyZXF1aXJlZE1vZHVsZS5leHBvcnRlZH0gfSBmcm9tICcke3JlcXVpcmVkTW9kdWxlLm1vZHVsZX0nO2ApO1xuICAgICAgICBzdXBwbGllZE1vZHVsZXMucHVzaChyZXF1aXJlZE1vZHVsZS5leHBvcnRlZCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4geyBtb2R1bGVJbXBvcnRzLCBzdXBwbGllZE1vZHVsZXMgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZUZ1bmN0aW9uS2V5d29yZChjb2RlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBjb2RlLnJlcGxhY2UoL15mdW5jdGlvbiAvLCAnJykucmVwbGFjZSgvXFxuXFxzP2Z1bmN0aW9uIC8sICdcXG4gJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRGdW5jdGlvbk5hbWUoY29kZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBtYXRjaGVzID0gL2Z1bmN0aW9uXFxzKyhbXihcXHNdKylcXCgvLmV4ZWMoY29kZSk7XG4gICAgcmV0dXJuIG1hdGNoZXMgJiYgbWF0Y2hlcy5sZW5ndGggPT09IDIgPyBtYXRjaGVzWzFdLnRyaW0oKSA6IG51bGw7XG59XG5cbmV4cG9ydCBjb25zdCBjb252ZXJ0RnVuY3Rpb25Ub1Byb3BlcnR5ID0gKGNvZGU6IHN0cmluZykgPT5cbiAgICBjb2RlLnJlcGxhY2UoL2Z1bmN0aW9uXFxzKyhbXihcXHNdKylcXHMqXFwoKFteKV0qKVxcKS8sICckMSA9ICgkMikgPT4nKTtcblxuZXhwb3J0IGNvbnN0IGNvbnZlcnRGdW5jdGlvblRvQ29uc3RQcm9wZXJ0eSA9IChjb2RlOiBzdHJpbmcpID0+XG4gICAgY29kZS5yZXBsYWNlKC9mdW5jdGlvblxccysoW14oXFxzXSspXFxzKlxcKChbXildKilcXCkvLCAnY29uc3QgJDEgPSAoJDIpID0+Jyk7XG5leHBvcnQgY29uc3QgY29udmVydEZ1bmN0aW9uVG9Db25zdFByb3BlcnR5VHMgPSAoY29kZTogc3RyaW5nKSA9PiB7XG4gICAgcmV0dXJuIGNvZGUucmVwbGFjZSgvZnVuY3Rpb25cXHMrKFteKFxcc10rKVxccypcXCgoW14pXSopXFwpOihcXHMrW157XSopLywgJ2NvbnN0ICQxOiAoJDIpID0+ICQzID0gKCQyKSA9PicpO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzSW5zdGFuY2VNZXRob2QobWV0aG9kczogc3RyaW5nW10sIHByb3BlcnR5OiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gbWV0aG9kcy5tYXAoZ2V0RnVuY3Rpb25OYW1lKS5maWx0ZXIoKG5hbWUpID0+IG5hbWUgPT09IHByb3BlcnR5Lm5hbWUpLmxlbmd0aCA+IDA7XG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIE5vZGVUeXBlIHtcbiAgICBWYXJpYWJsZSA9ICdWYXJpYWJsZURlY2xhcmF0aW9uJyxcbiAgICBGdW5jdGlvbiA9ICdGdW5jdGlvbkRlY2xhcmF0aW9uJyxcbiAgICBFeHByZXNzaW9uID0gJ0V4cHJlc3Npb25TdGF0ZW1lbnQnLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gdHNDb2xsZWN0KHRzVHJlZSwgdHNCaW5kaW5ncywgY29sbGVjdG9ycywgcmVjdXJzZSA9IHRydWUpIHtcbiAgICB0cy5mb3JFYWNoQ2hpbGQodHNUcmVlLCAobm9kZTogdHMuTm9kZSkgPT4ge1xuICAgICAgICBjb2xsZWN0b3JzXG4gICAgICAgICAgICAuZmlsdGVyKChjKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHJlcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcyA9IGMubWF0Y2hlcyhub2RlKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmZvckVhY2goKGMpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjLmFwcGx5KHRzQmluZGluZ3MsIG5vZGUpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICBpZiAocmVjdXJzZSkge1xuICAgICAgICAgICAgdHNDb2xsZWN0KG5vZGUsIHRzQmluZGluZ3MsIGNvbGxlY3RvcnMsIHJlY3Vyc2UpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHRzQmluZGluZ3M7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0c05vZGVJc0dsb2JhbFZhcihub2RlOiBhbnkpOiBib29sZWFuIHtcbiAgICAvLyBlZzogdmFyIGN1cnJlbnRSb3dIZWlnaHQgPSAxMDtcbiAgICBpZiAodHMuaXNWYXJpYWJsZURlY2xhcmF0aW9uKG5vZGUpICYmIHRzLmlzU291cmNlRmlsZShub2RlLnBhcmVudC5wYXJlbnQucGFyZW50KSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdHNOb2RlSXNHbG9iYWxWYXJXaXRoTmFtZShub2RlOiBhbnksIG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIC8vIGVnOiB2YXIgY3VycmVudFJvd0hlaWdodCA9IDEwO1xuICAgIGlmICh0cy5pc1ZhcmlhYmxlRGVjbGFyYXRpb24obm9kZSkgJiYgdHMuaXNTb3VyY2VGaWxlKG5vZGUucGFyZW50LnBhcmVudC5wYXJlbnQpKSB7XG4gICAgICAgIHJldHVybiBub2RlLm5hbWUuZ2V0VGV4dCgpID09PSBuYW1lO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0c05vZGVJc1Byb3BlcnR5V2l0aE5hbWUobm9kZTogdHMuTm9kZSwgbmFtZTogc3RyaW5nKSB7XG4gICAgaWYgKHRzLmlzUHJvcGVydHlBc3NpZ25tZW50KG5vZGUpKSB7XG4gICAgICAgIGlmIChub2RlLm5hbWUuZ2V0VGV4dCgpID09PSBuYW1lKSB7XG4gICAgICAgICAgICAvLyBJZiB0aGUgbmFtZSBtYXRjaGVzIHRoZSBpbml0aWFsaXplciB0aGVuIHRoZSBwcm9wZXJ0eSB3aWxsIGdldCBhZGRlZCB2aWFcbiAgICAgICAgICAgIC8vIHRoZSB0b3AgbGV2ZWwgdmFyaWFibGUgbWF0Y2hpbmcgYSBncmlkUHJvcGVydHkgbmFtZVxuICAgICAgICAgICAgLy8gVGhpcyBtZWFucyB0aGF0IHdlIGluY2x1ZGUgY2VsbFJlbmRlcmVyIHByb3BlcnRpZXMgbGlrZVxuICAgICAgICAgICAgLy8gZGV0YWlsQ2VsbFJlbmRlcmVyOiBEZXRhaWxDZWxsUmVuZGVyZXIsXG4gICAgICAgICAgICBpZiAobm9kZS5uYW1lLmdldFRleHQoKSA9PT0gbm9kZS5pbml0aWFsaXplci5nZXRUZXh0KCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRzTm9kZUlzVG9wTGV2ZWxWYXJpYWJsZShub2RlOiB0cy5Ob2RlLCByZWdpc3RlcmVkOiBzdHJpbmdbXSA9IFtdKSB7XG4gICAgaWYgKHRzLmlzVmFyaWFibGVEZWNsYXJhdGlvbkxpc3Qobm9kZSkpIHtcbiAgICAgICAgLy8gTm90IHJlZ2lzdGVyZWQgYWxyZWFkeVxuICAgICAgICAvLyBhcmUgYSB0b3AgbGV2ZWwgdmFyaWFibGUgZGVjbGFyYXRpb24gc28gdGhhdCB3ZSBkbyBub3QgbWF0Y2ggdmFyaWFibGVzIHdpdGhpbiBmdW5jdGlvbiBzY29wZXNcbiAgICAgICAgLy8gSXMgbm90IGp1c3QgYSB0eXBlIGRlY2xhcmF0aW9uIGkuZSBkZWNsYXJlIGZ1bmN0aW9uIGdldERhdGE6ICgpID0+IGFueVtdO1xuICAgICAgICBpZiAobm9kZS5kZWNsYXJhdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgZGVjbGFyYXRpb24gPSBub2RlLmRlY2xhcmF0aW9uc1swXTtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgIWlzRGVjbGFyZVN0YXRlbWVudChub2RlLnBhcmVudCkgJiZcbiAgICAgICAgICAgICAgICByZWdpc3RlcmVkLmluZGV4T2YoZGVjbGFyYXRpb24ubmFtZS5nZXRUZXh0KCkpIDwgMCAmJlxuICAgICAgICAgICAgICAgIHRzLmlzU291cmNlRmlsZShub2RlLnBhcmVudC5wYXJlbnQpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdHNOb2RlSXNGdW5jdGlvbldpdGhOYW1lKG5vZGU6IHRzLk5vZGUsIG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIC8vIGVnOiBmdW5jdGlvbiBzb21lRnVuY3Rpb24oKSB7IH1cbiAgICBpZiAodHMuaXNGdW5jdGlvbkRlY2xhcmF0aW9uKG5vZGUpKSB7XG4gICAgICAgIGNvbnN0IGlzTWF0Y2ggPSBub2RlPy5uYW1lPy5nZXRUZXh0KCkgPT09IG5hbWU7XG4gICAgICAgIHJldHVybiBpc01hdGNoO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0c05vZGVJc0luU2NvcGUobm9kZTogYW55LCB1bmJvdW5kSW5zdGFuY2VNZXRob2RzOiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoXG4gICAgICAgIHVuYm91bmRJbnN0YW5jZU1ldGhvZHMgJiZcbiAgICAgICAgdHMuaXNGdW5jdGlvbkRlY2xhcmF0aW9uKG5vZGUpICYmXG4gICAgICAgIG5vZGUubmFtZSAmJlxuICAgICAgICB1bmJvdW5kSW5zdGFuY2VNZXRob2RzLmluZGV4T2Yobm9kZS5uYW1lLmdldFRleHQoKSkgPj0gMFxuICAgICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0c05vZGVJc1VudXNlZEZ1bmN0aW9uKG5vZGU6IGFueSwgdXNlZDogc3RyaW5nW10sIHVuYm91bmRJbnN0YW5jZU1ldGhvZHM6IHN0cmluZ1tdKTogYm9vbGVhbiB7XG4gICAgaWYgKCF0c05vZGVJc0luU2NvcGUobm9kZSwgdW5ib3VuZEluc3RhbmNlTWV0aG9kcykpIHtcbiAgICAgICAgaWYgKHRzLmlzRnVuY3Rpb25MaWtlKG5vZGUpICYmIHVzZWQuaW5kZXhPZihub2RlLm5hbWUuZ2V0VGV4dCgpKSA8IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGlzVG9wTGV2ZWwgPSB0cy5pc1NvdXJjZUZpbGUobm9kZS5wYXJlbnQpO1xuICAgICAgICAgICAgcmV0dXJuIGlzVG9wTGV2ZWwgJiYgIWlzRGVjbGFyZVN0YXRlbWVudChub2RlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGlzRGVjbGFyZVN0YXRlbWVudChub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUgJiYgbm9kZS5tb2RpZmllcnMgJiYgbm9kZS5tb2RpZmllcnMuc29tZSgobSkgPT4gbS5nZXRUZXh0KCkgPT09ICdkZWNsYXJlJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0c05vZGVJc1R5cGVEZWNsYXJhdGlvbihub2RlOiBhbnkpOiBib29sZWFuIHtcbiAgICBpZiAodHMuaXNGdW5jdGlvbkRlY2xhcmF0aW9uKG5vZGUpIHx8IHRzLmlzVmFyaWFibGVTdGF0ZW1lbnQobm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIGlzRGVjbGFyZVN0YXRlbWVudChub2RlKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdHNOb2RlSXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb25PZihub2RlOiBhbnksIHByb3BlcnRpZXM6IHN0cmluZ1tdKTogYm9vbGVhbiB7XG4gICAgaWYgKHByb3BlcnRpZXMubGVuZ3RoICE9PSAyKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW1wbGVtZW50IHRoaXMnKTtcbiAgICB9XG4gICAgcmV0dXJuIChcbiAgICAgICAgdHMuaXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24obm9kZSkgJiZcbiAgICAgICAgdHMuaXNJZGVudGlmaWVyKG5vZGUuZXhwcmVzc2lvbikgJiZcbiAgICAgICAgbm9kZS5leHByZXNzaW9uLmVzY2FwZWRUZXh0ID09PSBwcm9wZXJ0aWVzWzBdICYmXG4gICAgICAgIHRzLmlzSWRlbnRpZmllcihub2RlLm5hbWUpICYmXG4gICAgICAgIG5vZGUubmFtZS5lc2NhcGVkVGV4dCA9PT0gcHJvcGVydGllc1sxXVxuICAgICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0c05vZGVJc0Z1bmN0aW9uQ2FsbChub2RlOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHMuaXNDYWxsRXhwcmVzc2lvbihub2RlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRzTm9kZUlzR2xvYmFsRnVuY3Rpb25DYWxsKG5vZGU6IHRzLk5vZGUpIHtcbiAgICAvLyBHZXQgdG9wIGxldmVsIGZ1bmN0aW9uIGNhbGxzIGxpa2VcbiAgICAvLyBzZXRJbnRlcnZhbChjYWxsYmFjaywgNTAwKVxuICAgIC8vIGJ1dCBkb24ndCBtYXRjaCB0aGluZ3MgbGlrZVxuICAgIC8vIEFnQ2hhcnRzLmNyZWF0ZShvcHRpb25zKVxuICAgIGlmICh0cy5pc0V4cHJlc3Npb25TdGF0ZW1lbnQobm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIHRzLmlzU291cmNlRmlsZShub2RlLnBhcmVudCkgJiZcbiAgICAgICAgICAgIHRzLmlzQ2FsbEV4cHJlc3Npb24obm9kZS5leHByZXNzaW9uKSAmJlxuICAgICAgICAgICAgdHMuaXNJZGVudGlmaWVyKG5vZGUuZXhwcmVzc2lvbi5leHByZXNzaW9uKVxuICAgICAgICApO1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IHJlY29nbml6ZWREb21FdmVudHMgPSBbJ2NsaWNrJywgJ2NoYW5nZScsICdpbnB1dCcsICdkcmFnb3ZlcicsICdkcmFnc3RhcnQnLCAnZHJvcCddO1xuXG5mdW5jdGlvbiBmbGF0TWFwPFQ+KGFycmF5OiBUW10sIGNhbGxiYWNrOiAodmFsdWU6IFQpID0+IFQpOiBUW10ge1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KFtdLCBhcnJheS5tYXAoY2FsbGJhY2spKTtcbn1cblxuY29uc3QgZXh0cmFjdEV2ZW50SGFuZGxlckJvZHkgPSAoY29kZTogc3RyaW5nKSA9PiBjb2RlLm1hdGNoKC9eKFxcdyspXFwoKC4qKVxcKS8pO1xuXG4vKlxuICogZm9yIGVhY2ggb2YgdGhlIHJlY29nbmlzZWQgZXZlbnRzIChjbGljaywgY2hhbmdlIGV0YykgZXh0cmFjdCB0aGUgY29ycmVzcG9uZGluZyBldmVudCBoYW5kbGVyLCB3aXRoIChvcHRpb25hbCkgcGFyYW1zXG4gKiBlZzogb25jbGljaz1cInJlZnJlc2hFdmVuUm93c0N1cnJlbmN5RGF0YSgpXCJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RFdmVudEhhbmRsZXJzKGRvbVRyZWU6IGFueSwgZXZlbnROYW1lczogc3RyaW5nW10pIHtcbiAgICBjb25zdCBnZXRIYW5kbGVyQXR0cmlidXRlcyA9IChldmVudDogc3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IGhhbmRsZXJOYW1lID0gYG9uJHtldmVudH1gO1xuXG4gICAgICAgIHJldHVybiBkb21UcmVlKGBbJHtoYW5kbGVyTmFtZX1dYCkubWFwKChpbmRleCwgZWwpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBkb21UcmVlKGVsKS5hdHRyKGhhbmRsZXJOYW1lKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiBmbGF0TWFwKGV2ZW50TmFtZXMsIChldmVudDogc3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGdldEhhbmRsZXJBdHRyaWJ1dGVzKGV2ZW50KVxuICAgICAgICAgICAgLm1hcCgoaW5kZXgsIGVsKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtleHRyYWN0RXZlbnRIYW5kbGVyQm9keShlbCldO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50b0FycmF5KCk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZUluU2NvcGVKc0RvYyhtZXRob2Q6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIG1ldGhvZC5yZXBsYWNlKC9cXC9cXCpcXCpcXHMqaW5TY29wZS4qXFwqXFwvXFxuL2csICcnKTtcbn1cblxuLy8gZnVuY3Rpb25zIG1hcmtlZCB3aXRoIGFuIFwiaW5TY29wZVwiIGNvbW1lbnQgd2lsbCBiZSBoYW5kbGVkIGFzIFwiaW5zdGFuY2VcIiBtZXRob2RzLCBhcyBvcHBvc2VkIHRvIChnbG9iYWwvdW51c2VkKVxuLy8gXCJ1dGlsXCIgb25lc1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RVbmJvdW5kSW5zdGFuY2VNZXRob2RzKHNyY0ZpbGU6IHRzLlNvdXJjZUZpbGUpIHtcbiAgICBsZXQgaW5TY29wZU1ldGhvZHMgPSBbXTtcbiAgICBzcmNGaWxlLnN0YXRlbWVudHMuZm9yRWFjaCgobm9kZSkgPT4ge1xuICAgICAgICBpZiAodHMuaXNGdW5jdGlvbkRlY2xhcmF0aW9uKG5vZGUpKSB7XG4gICAgICAgICAgICBjb25zdCBkb2NzID0gKG5vZGUgYXMgYW55KS5qc0RvYztcbiAgICAgICAgICAgIGlmIChkb2NzICYmIGRvY3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGRvY3MuZm9yRWFjaCgoZG9jKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRyaW1tZWQgPSBkb2MuY29tbWVudC50cmltKCkgfHwgJyc7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0cmltbWVkLmluY2x1ZGVzKCdpblNjb3BlJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluU2NvcGVNZXRob2RzID0gWy4uLmluU2NvcGVNZXRob2RzLCBub2RlLm5hbWU/LmdldFRleHQoKV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBpblNjb3BlTWV0aG9kcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RUeXBlSW5mb0ZvclZhcmlhYmxlKHNyY0ZpbGU6IHRzLlNvdXJjZUZpbGUsIHZhck5hbWU6IHN0cmluZykge1xuICAgIGxldCB0eXBlU3RyID0gdW5kZWZpbmVkO1xuICAgIGxldCB0eXBlUGFydHMgPSBbXTtcbiAgICBzcmNGaWxlLnN0YXRlbWVudHMuZm9yRWFjaCgobm9kZSkgPT4ge1xuICAgICAgICBpZiAodHMuaXNWYXJpYWJsZVN0YXRlbWVudChub2RlKSkge1xuICAgICAgICAgICAgbm9kZS5kZWNsYXJhdGlvbkxpc3QuZGVjbGFyYXRpb25zLmZvckVhY2goKGRlYykgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0cy5pc1ZhcmlhYmxlRGVjbGFyYXRpb24oZGVjKSAmJiBkZWMubmFtZS5nZXRUZXh0KCkgPT0gdmFyTmFtZSAmJiBkZWMudHlwZSkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlU3RyID0gZGVjLnR5cGUuZ2V0VGV4dCgpO1xuICAgICAgICAgICAgICAgICAgICB0eXBlUGFydHMgPSBnZXRUeXBlcyhkZWMudHlwZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4geyB0eXBlU3RyLCB0eXBlUGFydHMgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFR5cGVzKG5vZGU6IHRzLk5vZGUpIHtcbiAgICBsZXQgdHlwZXNUb0luY2x1ZGUgPSBbXTtcbiAgICBpZiAodHMuaXNJZGVudGlmaWVyKG5vZGUpKSB7XG4gICAgICAgIGNvbnN0IHR5cGVOYW1lID0gbm9kZS5nZXRUZXh0KCk7XG4gICAgICAgIGlmICghWydIVE1MRWxlbWVudCcsICdGdW5jdGlvbicsICdQYXJ0aWFsJywgJ1REYXRhJywgJ1RDb250ZXh0JywgJ1RWYWx1ZSddLmluY2x1ZGVzKHR5cGVOYW1lKSkge1xuICAgICAgICAgICAgdHlwZXNUb0luY2x1ZGUucHVzaCh0eXBlTmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbm9kZS5mb3JFYWNoQ2hpbGQoKGN0KSA9PiB7XG4gICAgICAgIC8vIE9ubHkgcmVjdXJzZSBkb3duIHRoZSB0eXBlIGJyYW5jaGVzIG9mIHRoZSB0cmVlIHNvIHdlIGRvIG5vdCBpbmNsdWRlIGFyZ3VtZW50IG5hbWVzXG4gICAgICAgIGlmICgoY3QgYXMgYW55KS50eXBlKSB7XG4gICAgICAgICAgICB0eXBlc1RvSW5jbHVkZSA9IFsuLi50eXBlc1RvSW5jbHVkZSwgLi4uZ2V0VHlwZXMoKGN0IGFzIGFueSkudHlwZSldO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdHlwZXNUb0luY2x1ZGUgPSBbLi4udHlwZXNUb0luY2x1ZGUsIC4uLmdldFR5cGVzKGN0KV07XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gdHlwZXNUb0luY2x1ZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VzQ2hhcnRBcGkobm9kZTogdHMuTm9kZSkge1xuICAgIGlmICh0cy5pc0NhbGxFeHByZXNzaW9uKG5vZGUpICYmIG5vZGUuZ2V0VGV4dCgpPy5tYXRjaCgvQWdDaGFydHMuKD8hY3JlYXRlKS8pKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGxldCB1c2VzQXBpID0gZmFsc2U7XG4gICAgbm9kZS5mb3JFYWNoQ2hpbGQoKGN0KSA9PiB7XG4gICAgICAgIHVzZXNBcGkgfHw9IHVzZXNDaGFydEFwaShjdCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHVzZXNBcGk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0SW1wb3J0U3RhdGVtZW50cyhzcmNGaWxlOiB0cy5Tb3VyY2VGaWxlKTogQmluZGluZ0ltcG9ydFtdIHtcbiAgICBjb25zdCBhbGxJbXBvcnRzID0gW107XG4gICAgc3JjRmlsZS5zdGF0ZW1lbnRzLmZvckVhY2goKG5vZGUpID0+IHtcbiAgICAgICAgaWYgKHRzLmlzSW1wb3J0RGVjbGFyYXRpb24obm9kZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IG1vZHVsZSA9IG5vZGUubW9kdWxlU3BlY2lmaWVyLmdldFRleHQoKTtcbiAgICAgICAgICAgIGNvbnN0IG1vZHVsZUltcG9ydHMgPSBub2RlLmltcG9ydENsYXVzZTtcbiAgICAgICAgICAgIGNvbnN0IGltcG9ydHMgPSBbXTtcbiAgICAgICAgICAgIGxldCBuYW1lZEltcG9ydCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGxldCBpc05hbWVzcGFjZWQgPSB0cnVlO1xuXG4gICAgICAgICAgICBpZiAobW9kdWxlSW1wb3J0cz8ubmFtZWRCaW5kaW5ncykge1xuICAgICAgICAgICAgICAgIGlmICghdHMuaXNOYW1lc3BhY2VJbXBvcnQobW9kdWxlSW1wb3J0cy5uYW1lZEJpbmRpbmdzKSkge1xuICAgICAgICAgICAgICAgICAgICBpc05hbWVzcGFjZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbW9kdWxlSW1wb3J0cy5uYW1lZEJpbmRpbmdzLmZvckVhY2hDaGlsZCgobykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpbXBvcnRzLnB1c2goby5nZXRUZXh0KCkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG1vZHVsZUltcG9ydHM/Lm5hbWUpIHtcbiAgICAgICAgICAgICAgICBuYW1lZEltcG9ydCA9IG1vZHVsZUltcG9ydHMubmFtZS5nZXRUZXh0KCk7XG4gICAgICAgICAgICAgICAgaXNOYW1lc3BhY2VkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhbGxJbXBvcnRzLnB1c2goe1xuICAgICAgICAgICAgICAgIG1vZHVsZSxcbiAgICAgICAgICAgICAgICBpc05hbWVzcGFjZWQsXG4gICAgICAgICAgICAgICAgbmFtZWRJbXBvcnQsXG4gICAgICAgICAgICAgICAgaW1wb3J0cyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGFsbEltcG9ydHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0VHlwZURlY2xhcmF0aW9ucyhzcmNGaWxlOiB0cy5Tb3VyY2VGaWxlKSB7XG4gICAgY29uc3QgYWxsRGVjbGFyZVN0YXRlbWVudHMgPSBbXTtcbiAgICBzcmNGaWxlLnN0YXRlbWVudHMuZm9yRWFjaCgobm9kZSkgPT4ge1xuICAgICAgICBpZiAoKHRzLmlzVmFyaWFibGVTdGF0ZW1lbnQobm9kZSkgfHwgdHMuaXNGdW5jdGlvbkRlY2xhcmF0aW9uKG5vZGUpKSAmJiBub2RlLm1vZGlmaWVycz8ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgaWYgKG5vZGUubW9kaWZpZXJzLnNvbWUoKHMpID0+IHMua2luZCA9PT0gdHMuU3ludGF4S2luZC5EZWNsYXJlS2V5d29yZCkpIHtcbiAgICAgICAgICAgICAgICBhbGxEZWNsYXJlU3RhdGVtZW50cy5wdXNoKG5vZGUuZ2V0VGV4dCgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBhbGxEZWNsYXJlU3RhdGVtZW50cztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RDbGFzc0RlY2xhcmF0aW9ucyhzcmNGaWxlOiB0cy5Tb3VyY2VGaWxlKSB7XG4gICAgY29uc3QgYWxsQ2xhc3NlcyA9IFtdO1xuICAgIHNyY0ZpbGUuc3RhdGVtZW50cy5mb3JFYWNoKChub2RlKSA9PiB7XG4gICAgICAgIGlmICh0cy5pc0NsYXNzRGVjbGFyYXRpb24obm9kZSkpIHtcbiAgICAgICAgICAgIGFsbENsYXNzZXMucHVzaChub2RlLmdldFRleHQoKSk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gYWxsQ2xhc3Nlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RJbnRlcmZhY2VzKHNyY0ZpbGU6IHRzLlNvdXJjZUZpbGUpIHtcbiAgICBjb25zdCBhbGxJbnRlcmZhY2VzID0gW107XG4gICAgc3JjRmlsZS5zdGF0ZW1lbnRzLmZvckVhY2goKG5vZGUpID0+IHtcbiAgICAgICAgaWYgKHRzLmlzSW50ZXJmYWNlRGVjbGFyYXRpb24obm9kZSkpIHtcbiAgICAgICAgICAgIGFsbEludGVyZmFjZXMucHVzaChub2RlLmdldFRleHQoKSk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gYWxsSW50ZXJmYWNlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRzTm9kZUlzVG9wTGV2ZWxGdW5jdGlvbihub2RlOiBhbnkpOiBib29sZWFuIHtcbiAgICBpZiAodHMuaXNGdW5jdGlvbkxpa2Uobm9kZSkpIHtcbiAgICAgICAgY29uc3QgaXNUb3BMZXZlbCA9IHRzLmlzU291cmNlRmlsZShub2RlLnBhcmVudCk7XG4gICAgICAgIHJldHVybiBpc1RvcExldmVsO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogRmluZCBhbGwgdGhlIHZhcmlhYmxlcyBkZWZpbmVkIGluIHRoaXMgbm9kZSB0cmVlIHJlY3Vyc2l2ZWx5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kQWxsVmFyaWFibGVzKG5vZGUpIHtcbiAgICBsZXQgYWxsVmFyaWFibGVzID0gW107XG4gICAgaWYgKHRzLmlzQ2xhc3NEZWNsYXJhdGlvbihub2RlKSkge1xuICAgICAgICBhbGxWYXJpYWJsZXMucHVzaChub2RlLm5hbWUuZ2V0VGV4dCgpKTtcbiAgICB9XG4gICAgaWYgKHRzLmlzVmFyaWFibGVEZWNsYXJhdGlvbihub2RlKSkge1xuICAgICAgICBpZiAodHMuaXNPYmplY3RCaW5kaW5nUGF0dGVybihub2RlLm5hbWUpKSB7XG4gICAgICAgICAgICAvLyBDb2RlIGxpa2UgdGhpczogIGNvbnN0IHsgcGFnZVNldHVwLCBtYXJnaW5zIH0gPSBnZXRTaGVldENvbmZpZygpO1xuICAgICAgICAgICAgbm9kZS5uYW1lLmVsZW1lbnRzLmZvckVhY2goKG4pID0+IGFsbFZhcmlhYmxlcy5wdXNoKG4uZ2V0VGV4dCgpKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhbGxWYXJpYWJsZXMucHVzaChub2RlLm5hbWUuZ2V0VGV4dCgpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAodHMuaXNGdW5jdGlvbkRlY2xhcmF0aW9uKG5vZGUpKSB7XG4gICAgICAgIC8vIGNhdGNoIGxvY2FsbHkgZGVmaW5lZCBmdW5jdGlvbnMgd2l0aGluIHRoZSBtYWluIGZ1bmN0aW9uIGJvZHlcbiAgICAgICAgLy8gZnVuY3Rpb24gc2V0TWVzc2FnZShtc2c6IHN0cmluZykgeyAuLi4gfVxuICAgICAgICBhbGxWYXJpYWJsZXMucHVzaChub2RlLm5hbWUuZ2V0VGV4dCgpKTtcbiAgICB9XG4gICAgaWYgKHRzLmlzUGFyYW1ldGVyKG5vZGUpKSB7XG4gICAgICAgIC8vIGNhdGNoIGxvY2FsbHkgZGVmaW5lZCBhcnJvdyBmdW5jdGlvbnMgd2l0aCB0aGVpciBwYXJhbXNcbiAgICAgICAgLy8gIGNvbnN0IGNvbFRvTmFtZUZ1bmMgPSAoY29sOiBDb2x1bW4sIGluZGV4OiBudW1iZXIpID0+IGluZGV4ICsgJyA9ICcgKyBjb2wuZ2V0SWQoKVxuICAgICAgICAvLyAgY29uc3QgY29sTmFtZXMgPSBjb2xzLm1hcChjb2xUb05hbWVGdW5jKS5qb2luKCcsICcpXG5cbiAgICAgICAgYWxsVmFyaWFibGVzLnB1c2gobm9kZS5uYW1lLmdldFRleHQoKSk7XG4gICAgfVxuICAgIHRzLmZvckVhY2hDaGlsZChub2RlLCAobikgPT4ge1xuICAgICAgICBjb25zdCB2YXJpYWJsZXMgPSBmaW5kQWxsVmFyaWFibGVzKG4pO1xuICAgICAgICBpZiAodmFyaWFibGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGFsbFZhcmlhYmxlcyA9IFsuLi5hbGxWYXJpYWJsZXMsIC4uLnZhcmlhYmxlc107XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gYWxsVmFyaWFibGVzO1xufVxuXG5mdW5jdGlvbiBnZXRMb3dlc3RFeHByZXNzaW9uKGV4cDogYW55KSB7XG4gICAgbGV0IGhhc0V4cHJlc3Npb24gPSB0cnVlO1xuICAgIHdoaWxlIChoYXNFeHByZXNzaW9uKSB7XG4gICAgICAgIGhhc0V4cHJlc3Npb24gPSBleHAuZXhwcmVzc2lvbjtcbiAgICAgICAgaWYgKGhhc0V4cHJlc3Npb24pIHtcbiAgICAgICAgICAgIGV4cCA9IGV4cC5leHByZXNzaW9uIGFzIGFueTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZXhwO1xufVxuXG4vKipcbiAqIEZpbmQgYWxsIHRoZSBwcm9wZXJ0aWVzIGFjY2Vzc2VkIGluIHRoaXMgbm9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRBbGxBY2Nlc3NlZFByb3BlcnRpZXMobm9kZSkge1xuICAgIGxldCBwcm9wZXJ0aWVzID0gW107XG4gICAgaWYgKHRzLmlzSWRlbnRpZmllcihub2RlKSkge1xuICAgICAgICBjb25zdCBwcm9wZXJ0eSA9IG5vZGUuZ2V0VGV4dCgpO1xuICAgICAgICBpZiAocHJvcGVydHkgIT09ICd1bmRlZmluZWQnICYmIHByb3BlcnR5ICE9PSAnbnVsbCcpIHtcbiAgICAgICAgICAgIHByb3BlcnRpZXMucHVzaChub2RlLmdldFRleHQoKSk7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRzLmlzQ2FsbEV4cHJlc3Npb24obm9kZSkgfHwgdHMuaXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24obm9kZSkpIHtcbiAgICAgICAgLy8gV2hlbiB0aGVyZSBhcmUgY2hhaW5lZCBhY2Nlc3NlcyB3ZSBuZWVkIHRvIHJlY3Vyc2UgdG8gdGhlIGxvd2VzdCBpZGVudGlmaWVyIGFzIHRoaXMgaXMgdGhlIGZpcnN0IGluIHRoZSBzdGF0ZW1lbnQsXG4gICAgICAgIC8vIGFuZCB3aWxsIGJlIHRoZSB0cnVlIGFjY2Vzc2VkIHZhcmlhYmxlLlxuICAgICAgICAvLyBpLmUgZ3JpZE9wdGlvbnMuYXBpIS5nZXRNb2RlbCgpLmdldFJvd0NvdW50KCkgd2UgbmVlZCB0byByZWN1cnNlIGRvd24gdGhlIHRyZWUgdG8gZXh0cmFjdCBncmlkT3B0aW9uc1xuICAgICAgICBjb25zdCBleHAgPSBnZXRMb3dlc3RFeHByZXNzaW9uKG5vZGUuZXhwcmVzc2lvbik7XG5cbiAgICAgICAgaWYgKHRzLmlzQXJyYXlMaXRlcmFsRXhwcmVzc2lvbihleHApKSB7XG4gICAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgYXJyYXkgaGFzIGFueSBwcm9wZXJ0aWVzIGluIGl0IHRoYXQgYXJlIGRlcGVuZGVuY2llc1xuICAgICAgICAgICAgcHJvcGVydGllcyA9IFsuLi5wcm9wZXJ0aWVzLCAuLi5maW5kQWxsQWNjZXNzZWRQcm9wZXJ0aWVzKGV4cCldO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHJvcGVydGllcy5wdXNoKGV4cC5nZXRUZXh0KCkpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0cy5pc0NhbGxFeHByZXNzaW9uKG5vZGUpICYmIG5vZGUuYXJndW1lbnRzKSB7XG4gICAgICAgICAgICAvLyBDaGVjayBhcmd1bWVudHNcbiAgICAgICAgICAgIHByb3BlcnRpZXMgPSBbLi4ucHJvcGVydGllcywgLi4uZmluZEFsbEFjY2Vzc2VkUHJvcGVydGllcyhub2RlLmFyZ3VtZW50cyldO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmICh0cy5pc0JpbmFyeUV4cHJlc3Npb24obm9kZSkpIHtcbiAgICAgICAgLy8gSW4gdGhpcyBmdW5jdGlvbiB3ZSBzZXQgc3dpbW1pbmdIZWlnaHQgYnV0IGFyZSBub3QgZGVwZW5kZW50IG9uIGl0LFxuICAgICAgICAvLyBzbyBmb3IgYmluYXJ5IGV4cHJlc3Npb25zIHdlIG9ubHkgY2hlY2sgdGhlIHJpZ2h0IGhhbmQgYnJhbmNoXG4gICAgICAgIC8vIGZ1bmN0aW9uIHNldFN3aW1taW5nSGVpZ2h0KGhlaWdodDogbnVtYmVyKSB7XG4gICAgICAgIC8vICAgICAgc3dpbW1pbmdIZWlnaHQgPSBoZWlnaHRcbiAgICAgICAgLy8gICAgICBncmlkT3B0aW9ucy5hcGkhLnJlc2V0Um93SGVpZ2h0cygpXG4gICAgICAgIC8vIH1cbiAgICAgICAgY29uc3QgcmlnaHRQcm9wcyA9IGZpbmRBbGxBY2Nlc3NlZFByb3BlcnRpZXMobm9kZS5yaWdodCk7XG4gICAgICAgIGlmIChyaWdodFByb3BzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHByb3BlcnRpZXMgPSBbLi4ucHJvcGVydGllcywgLi4ucmlnaHRQcm9wc107XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRzLmlzVmFyaWFibGVEZWNsYXJhdGlvbihub2RlKSkge1xuICAgICAgICAvLyBnZXQgbG93ZXN0IGlkZW50aWZpZXIgYXMgdGhpcyBpcyB0aGUgZmlyc3QgaW4gdGhlIHN0YXRlbWVudFxuICAgICAgICAvLyBpLmUgdmFyIG5leHRIZWFkZXIgPSBwYXJhbXMubmV4dEhlYWRlclBvc2l0aW9uXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gcmVjdXJzZSBkb3duIHRoZSBpbml0aWFsaXplciB0cmVlIHRvIGV4dHJhY3QgcGFyYW1zIGFuZCBub3QgbmV4dEhlYWRlclBvc2l0aW9uXG4gICAgICAgIGNvbnN0IGluaXQgPSBub2RlLmluaXRpYWxpemVyIGFzIGFueTtcbiAgICAgICAgaWYgKGluaXQpIHtcbiAgICAgICAgICAgIGNvbnN0IGV4cCA9IGdldExvd2VzdEV4cHJlc3Npb24oaW5pdCk7XG4gICAgICAgICAgICBwcm9wZXJ0aWVzID0gWy4uLnByb3BlcnRpZXMsIC4uLmZpbmRBbGxBY2Nlc3NlZFByb3BlcnRpZXMoZXhwKV07XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRzLmlzUHJvcGVydHlBc3NpZ25tZW50KG5vZGUpKSB7XG4gICAgICAgIC8vIElnbm9yZSB0aGUgbmFtZSBvZiByb3dJbmRleCBqdXN0IGNoZWNrIHdoYXQgaXMgYmVpbmcgYXNzaWduZWRcbiAgICAgICAgLy8gIHtcbiAgICAgICAgLy8gICAgICByb3dJbmRleDogbmV4dFJvd0luZGV4LFxuICAgICAgICAvLyAgfVxuICAgICAgICBpZiAobm9kZS5pbml0aWFsaXplcikge1xuICAgICAgICAgICAgcHJvcGVydGllcyA9IFsuLi5wcm9wZXJ0aWVzLCAuLi5maW5kQWxsQWNjZXNzZWRQcm9wZXJ0aWVzKG5vZGUuaW5pdGlhbGl6ZXIpXTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHMuaXNFeHByZXNzaW9uU3RhdGVtZW50KG5vZGUpKSB7XG4gICAgICAgIGlmIChub2RlLmV4cHJlc3Npb24pIHtcbiAgICAgICAgICAgIHByb3BlcnRpZXMgPSBbLi4ucHJvcGVydGllcywgLi4uZmluZEFsbEFjY2Vzc2VkUHJvcGVydGllcyhub2RlLmV4cHJlc3Npb24pXTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHMuaXNDbGFzc0RlY2xhcmF0aW9uKG5vZGUpKSB7XG4gICAgICAgIC8vIERvIG5vdGhpbmcgZm9yIENsYXNzIGRlY2xhcmF0aW9ucyBhcyB0aGlzIGlzIGxpa2VseSBhIGNlbGwgcmVuZGVyZXIgc2V0dXBcbiAgICB9IGVsc2UgaWYgKHRzLmlzVHlwZVJlZmVyZW5jZU5vZGUobm9kZSkpIHtcbiAgICAgICAgLy8gRG8gbm90aGluZyBmb3IgVHlwZSByZWZlcmVuY2VzXG4gICAgfSBlbHNlIGlmIChub2RlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgbm9kZS5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICAgICAgICBwcm9wZXJ0aWVzID0gWy4uLnByb3BlcnRpZXMsIC4uLmZpbmRBbGxBY2Nlc3NlZFByb3BlcnRpZXMoZWxlbWVudCldO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBSZWN1cnNlIGRvd24gdGhlIHRyZWUgbG9va2luZyBmb3IgbW9yZSBhY2Nlc3NlZCBwcm9wZXJ0aWVzXG4gICAgICAgIHRzLmZvckVhY2hDaGlsZChub2RlLCAobikgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvcHMgPSBmaW5kQWxsQWNjZXNzZWRQcm9wZXJ0aWVzKG4pO1xuICAgICAgICAgICAgaWYgKHByb3BzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzID0gWy4uLnByb3BlcnRpZXMsIC4uLnByb3BzXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb3BlcnRpZXM7XG59XG5cbi8qKiBDb252ZXJ0IGltcG9ydCBwYXRocyB0byB0aGVpciBwYWNrYWdlIGVxdWl2YWxlbnQgd2hlbiB0aGUgZG9jcyBhcmUgaW4gUGFja2FnZXMgbW9kZVxuICogaS5lIGltcG9ydCB7IEdyaWRPcHRpb25zIH0gZnJvbSAnQGFnLWdyaWQtY29tbXVuaXR5L2NvcmUnO1xuICogdG9cbiAqIGltcG9ydCB7IEdyaWRPcHRpb25zIH0gZnJvbSAnQGFnLWdyaWQtY29tbXVuaXR5JztcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnRJbXBvcnRQYXRoKG1vZHVsZVBhY2thZ2U6IHN0cmluZywgY29udmVydFRvUGFja2FnZTogYm9vbGVhbikge1xuICAgIGlmIChjb252ZXJ0VG9QYWNrYWdlKSB7XG4gICAgICAgIGNvbnN0IGNvbnZlcnNpb25zID0ge1xuICAgICAgICAgICAgXCInQGFnLWdyaWQtY29tbXVuaXR5L2FuZ3VsYXInXCI6IFwiJ2FnLWdyaWQtYW5ndWxhcidcIixcbiAgICAgICAgICAgICdcIkBhZy1ncmlkLWNvbW11bml0eS9hbmd1bGFyXCInOiBcIidhZy1ncmlkLWFuZ3VsYXInXCIsXG4gICAgICAgICAgICBcIidAYWctZ3JpZC1jb21tdW5pdHkvdnVlMydcIjogXCInYWctZ3JpZC12dWUzJ1wiLFxuICAgICAgICAgICAgJ1wiQGFnLWdyaWQtY29tbXVuaXR5L3Z1ZTNcIic6IFwiJ2FnLWdyaWQtdnVlMydcIixcbiAgICAgICAgICAgIFwiJ0BhZy1ncmlkLWNvbW11bml0eS92dWUnXCI6IFwiJ2FnLWdyaWQtdnVlJ1wiLFxuICAgICAgICAgICAgJ1wiQGFnLWdyaWQtY29tbXVuaXR5L3Z1ZVwiJzogXCInYWctZ3JpZC12dWUnXCIsXG4gICAgICAgICAgICBcIidAYWctZ3JpZC1jb21tdW5pdHkvcmVhY3QnXCI6IFwiJ2FnLWdyaWQtcmVhY3QnXCIsXG4gICAgICAgICAgICAnXCJAYWctZ3JpZC1jb21tdW5pdHkvcmVhY3RcIic6IFwiJ2FnLWdyaWQtcmVhY3QnXCIsXG4gICAgICAgIH07XG4gICAgICAgIGlmIChjb252ZXJzaW9uc1ttb2R1bGVQYWNrYWdlXSkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbnZlcnNpb25zW21vZHVsZVBhY2thZ2VdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1vZHVsZVBhY2thZ2UuaW5jbHVkZXMoJ0BhZy1ncmlkLWNvbW11bml0eS9jb3JlL2Rpc3QnKSkge1xuICAgICAgICAgICAgcmV0dXJuIG1vZHVsZVBhY2thZ2UucmVwbGFjZSgnQGFnLWdyaWQtY29tbXVuaXR5L2NvcmUvZGlzdCcsICdhZy1ncmlkLWNvbW11bml0eS9kaXN0Jyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1vZHVsZVBhY2thZ2UuaW5jbHVkZXMoJ0BhZy1ncmlkLWNvbW11bml0eS9zdHlsZXMnKSkge1xuICAgICAgICAgICAgcmV0dXJuIG1vZHVsZVBhY2thZ2UucmVwbGFjZSgnQGFnLWdyaWQtY29tbXVuaXR5L3N0eWxlcycsICdhZy1ncmlkLWNvbW11bml0eS9zdHlsZXMnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtb2R1bGVQYWNrYWdlLmluY2x1ZGVzKCdAYWctZ3JpZC1jb21tdW5pdHknKSkge1xuICAgICAgICAgICAgcmV0dXJuIGAnYWctZ3JpZC1jb21tdW5pdHknYDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobW9kdWxlUGFja2FnZS5pbmNsdWRlcygnQGFnLWdyaWQtZW50ZXJwcmlzZScpKSB7XG4gICAgICAgICAgICByZXR1cm4gYCdhZy1ncmlkLWVudGVycHJpc2UnYDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbW9kdWxlUGFja2FnZS5yZXBsYWNlKCdfdHlwZXNjcmlwdCcsICcnKS5yZXBsYWNlKC9cIi9nLCBgJ2ApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW1wb3J0KGZpbGVuYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBjb21wb25lbnRGaWxlTmFtZSA9IGZpbGVuYW1lLnNwbGl0KCcuJylbMF07XG4gICAgY29uc3QgY29tcG9uZW50TmFtZSA9IGNvbXBvbmVudEZpbGVOYW1lWzBdLnRvVXBwZXJDYXNlKCkgKyBjb21wb25lbnRGaWxlTmFtZS5zbGljZSgxKTtcbiAgICByZXR1cm4gYGltcG9ydCB7ICR7Y29tcG9uZW50TmFtZX0gfSBmcm9tICcuLyR7Y29tcG9uZW50RmlsZU5hbWV9JztgO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvcGVydHlJbnRlcmZhY2VzKHByb3BlcnRpZXMpIHtcbiAgICBsZXQgcHJvcFR5cGVzVXNlZCA9IFtdO1xuICAgIHByb3BlcnRpZXMuZm9yRWFjaCgocHJvcCkgPT4ge1xuICAgICAgICBpZiAocHJvcC50eXBpbmdzPy50eXBlc1RvSW5jbHVkZT8ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcHJvcFR5cGVzVXNlZCA9IFsuLi5wcm9wVHlwZXNVc2VkLCAuLi5wcm9wLnR5cGluZ3MudHlwZXNUb0luY2x1ZGVdO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIFsuLi5uZXcgU2V0KHByb3BUeXBlc1VzZWQpXTtcbn1cblxuLyoqXG4gKiAgQWRkIHRoZSBpbXBvcnRzIGZyb20gdGhlIHBhcnNlZCBmaWxlXG4gKiBXZSBpZ25vcmUgYW55IGNvbXBvbmVudCBmaWxlcyBhcyB0aG9zZSBpbXBvcnRzIGFyZSBnZW5lcmF0ZWQgZm9yIGVhY2ggZnJhbWV3b3JrLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkQmluZGluZ0ltcG9ydHMoXG4gICAgYmluZGluZ0ltcG9ydHM6IGFueSxcbiAgICBpbXBvcnRzOiBzdHJpbmdbXSxcbiAgICBjb252ZXJ0VG9QYWNrYWdlOiBib29sZWFuLFxuICAgIGlnbm9yZVRzSW1wb3J0czogYm9vbGVhblxuKSB7XG4gICAgY29uc3Qgd29ya2luZ0ltcG9ydHMgPSB7fTtcbiAgICBjb25zdCBuYW1lc3BhY2VkSW1wb3J0cyA9IFtdO1xuXG4gICAgY29uc3QgY2hhcnRzRW50ZXJwcmlzZSA9IGJpbmRpbmdJbXBvcnRzLnNvbWUoKGkpID0+IGkubW9kdWxlLmluY2x1ZGVzKCdhZy1jaGFydHMtZW50ZXJwcmlzZScpKTtcblxuICAgIGJpbmRpbmdJbXBvcnRzLmZvckVhY2goKGk6IEJpbmRpbmdJbXBvcnQpID0+IHtcbiAgICAgICAgY29uc3QgcGF0aCA9IGNvbnZlcnRJbXBvcnRQYXRoKGkubW9kdWxlLCBjb252ZXJ0VG9QYWNrYWdlKTtcbiAgICAgICAgaWYgKCFpLm1vZHVsZS5pbmNsdWRlcygnX3R5cGVzY3JpcHQnKSB8fCAhaWdub3JlVHNJbXBvcnRzKSB7XG4gICAgICAgICAgICB3b3JraW5nSW1wb3J0c1twYXRoXSA9IHdvcmtpbmdJbXBvcnRzW3BhdGhdIHx8IHtcbiAgICAgICAgICAgICAgICBuYW1lZEltcG9ydDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIGltcG9ydHM6IFtdLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChpLmlzTmFtZXNwYWNlZCkge1xuICAgICAgICAgICAgICAgIGlmIChpLmltcG9ydHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBuYW1lc3BhY2VkSW1wb3J0cy5wdXNoKGBpbXBvcnQgKiBhcyAke2kuaW1wb3J0c1swXX0gZnJvbSAke3BhdGh9O2ApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZWRJbXBvcnRzLnB1c2goYGltcG9ydCAke3BhdGh9O2ApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGkubmFtZWRJbXBvcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgd29ya2luZ0ltcG9ydHNbcGF0aF0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAuLi53b3JraW5nSW1wb3J0c1twYXRoXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWVkSW1wb3J0OiBpLm5hbWVkSW1wb3J0LFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaS5pbXBvcnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIHdvcmtpbmdJbXBvcnRzW3BhdGhdID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLi4ud29ya2luZ0ltcG9ydHNbcGF0aF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnRzOiBbLi4ud29ya2luZ0ltcG9ydHNbcGF0aF0uaW1wb3J0cywgLi4uaS5pbXBvcnRzXSxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGltcG9ydHMucHVzaCguLi5uZXcgU2V0KG5hbWVzcGFjZWRJbXBvcnRzKSk7XG5cbiAgICBsZXQgaGFzRW50ZXJwcmlzZU1vZHVsZXMgPSBmYWxzZTtcbiAgICBPYmplY3QuZW50cmllcyh3b3JraW5nSW1wb3J0cykuZm9yRWFjaCgoW2ssIHZdOiBbc3RyaW5nLCB7IG5hbWVkSW1wb3J0OiBzdHJpbmc7IGltcG9ydHM6IHN0cmluZ1tdIH1dKSA9PiB7XG4gICAgICAgIGxldCB1bmlxdWUgPSBbLi4ubmV3IFNldCh2LmltcG9ydHMpXS5zb3J0KCk7XG5cbiAgICAgICAgaWYgKGNvbnZlcnRUb1BhY2thZ2UgJiYgay5pbmNsdWRlcygnYWctZ3JpZCcpKSB7XG4gICAgICAgICAgICAvLyBSZW1vdmUgbW9kdWxlIHJlbGF0ZWQgaW1wb3J0c1xuICAgICAgICAgICAgdW5pcXVlID0gdW5pcXVlLmZpbHRlcigoaSkgPT4gIWkuaW5jbHVkZXMoJ01vZHVsZScpIHx8IGkgPT0gJ0FnR3JpZE1vZHVsZScpO1xuICAgICAgICAgICAgaGFzRW50ZXJwcmlzZU1vZHVsZXMgfHw9IGsuaW5jbHVkZXMoJ2VudGVycHJpc2UnKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodW5pcXVlLmxlbmd0aCA+IDAgfHwgdi5uYW1lZEltcG9ydCkge1xuICAgICAgICAgICAgY29uc3QgbmFtZWRJbXBvcnQgPSB2Lm5hbWVkSW1wb3J0ID8gdi5uYW1lZEltcG9ydCA6ICcnO1xuICAgICAgICAgICAgY29uc3QgaW1wb3J0U3RyID0gdW5pcXVlLmxlbmd0aCA+IDAgPyBgeyAke3VuaXF1ZS5qb2luKCcsICcpfSB9YCA6ICcnO1xuICAgICAgICAgICAgY29uc3Qgam9pbmluZ0NvbW1hID0gbmFtZWRJbXBvcnQgJiYgaW1wb3J0U3RyID8gJywgJyA6ICcnO1xuICAgICAgICAgICAgaW1wb3J0cy5wdXNoKGBpbXBvcnQgJHtuYW1lZEltcG9ydH0ke2pvaW5pbmdDb21tYX0ke2ltcG9ydFN0cn0gZnJvbSAke2t9O2ApO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgaWYgKGhhc0VudGVycHJpc2VNb2R1bGVzICYmIGNvbnZlcnRUb1BhY2thZ2UpIHtcbiAgICAgICAgaW1wb3J0cy5wdXNoKGBpbXBvcnQgJ2FnLWdyaWQtZW50ZXJwcmlzZSc7YCk7XG4gICAgfVxuXG4gICAgaWYgKGNoYXJ0c0VudGVycHJpc2UpIHtcbiAgICAgICAgaW1wb3J0cy5wdXNoKGBpbXBvcnQgJ2FnLWNoYXJ0cy1lbnRlcnByaXNlJztgKTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNb2R1bGVSZWdpc3RyYXRpb24oeyBncmlkU2V0dGluZ3MsIGVudGVycHJpc2UsIGV4YW1wbGVOYW1lIH0pIHtcbiAgICBjb25zdCBtb2R1bGVSZWdpc3RyYXRpb24gPSBbXCJpbXBvcnQgeyBNb2R1bGVSZWdpc3RyeSB9IGZyb20gJ0BhZy1ncmlkLWNvbW11bml0eS9jb3JlJztcIl07XG4gICAgY29uc3QgbW9kdWxlcyA9IGdyaWRTZXR0aW5ncy5tb2R1bGVzO1xuXG4gICAgaWYgKGVudGVycHJpc2UgJiYgIUFycmF5LmlzQXJyYXkobW9kdWxlcykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgYFRoZSBleGFtcGxlICR7ZXhhbXBsZU5hbWV9IGhhcyBcImVudGVycHJpc2VcIiA6IHRydWUgYnV0IG5vIG1vZHVsZXMgaGF2ZSBiZWVuIHByb3ZpZGVkIFwibW9kdWxlc1wiOlsuLi5dLiBFaXRoZXIgcmVtb3ZlIHRoZSBlbnRlcnByaXNlIGZsYWcgb3IgcHJvdmlkZSB0aGUgcmVxdWlyZWQgbW9kdWxlcy5gXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgZXhhbXBsZU1vZHVsZXMgPSBBcnJheS5pc0FycmF5KG1vZHVsZXMpID8gbW9kdWxlcyA6IFsnY2xpZW50c2lkZSddO1xuICAgIGNvbnN0IHsgbW9kdWxlSW1wb3J0cywgc3VwcGxpZWRNb2R1bGVzIH0gPSBtb2R1bGVzUHJvY2Vzc29yKGV4YW1wbGVNb2R1bGVzKTtcbiAgICBtb2R1bGVSZWdpc3RyYXRpb24ucHVzaCguLi5tb2R1bGVJbXBvcnRzKTtcbiAgICBjb25zdCBncmlkU3VwcGxpZWRNb2R1bGVzID0gYFske3N1cHBsaWVkTW9kdWxlcy5qb2luKCcsICcpfV1gO1xuXG4gICAgbW9kdWxlUmVnaXN0cmF0aW9uLnB1c2goYFxcbi8vIFJlZ2lzdGVyIHRoZSByZXF1aXJlZCBmZWF0dXJlIG1vZHVsZXMgd2l0aCB0aGUgR3JpZGApO1xuICAgIG1vZHVsZVJlZ2lzdHJhdGlvbi5wdXNoKGBNb2R1bGVSZWdpc3RyeS5yZWdpc3Rlck1vZHVsZXMoJHtncmlkU3VwcGxpZWRNb2R1bGVzfSlgKTtcbiAgICByZXR1cm4gbW9kdWxlUmVnaXN0cmF0aW9uO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFuZGxlUm93R2VuZXJpY0ludGVyZmFjZShmaWxlVHh0OiBzdHJpbmcsIHREYXRhOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICh0RGF0YSkge1xuICAgICAgICBmaWxlVHh0ID0gZmlsZVR4dFxuICAgICAgICAgICAgLnJlcGxhY2UoXG4gICAgICAgICAgICAgICAgLzwoVERhdGF8VFZhbHVlfFRDb250ZXh0fGFueSk/KCwgKT8oVERhdGF8VFZhbHVlfFRDb250ZXh0fGFueSk/KCwgKT8oVERhdGF8VFZhbHVlfFRDb250ZXh0fGFueSk/Pi9nLFxuICAgICAgICAgICAgICAgICcnXG4gICAgICAgICAgICApXG4gICAgICAgICAgICAucmVwbGFjZSgvVERhdGFcXFtcXF0vZywgYCR7dERhdGF9W11gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmaWxlVHh0ID0gZmlsZVR4dC5yZXBsYWNlKC88VERhdGE+L2csICcnKS5yZXBsYWNlKC9URGF0YVxcW1xcXS9nLCAnYW55W10nKTtcbiAgICB9XG4gICAgcmV0dXJuIGZpbGVUeHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGRHZW5lcmljSW50ZXJmYWNlSW1wb3J0KGltcG9ydHM6IHN0cmluZ1tdLCB0RGF0YTogc3RyaW5nLCBiaW5kaW5ncykge1xuICAgIGlmICh0RGF0YSAmJiAhYmluZGluZ3MuaW50ZXJmYWNlcy5zb21lKChpKSA9PiBpLmluY2x1ZGVzKHREYXRhKSkgJiYgIWltcG9ydHMuc29tZSgoaSkgPT4gaS5pbmNsdWRlcyh0RGF0YSkpKSB7XG4gICAgICAgIGltcG9ydHMucHVzaChgaW1wb3J0IHsgJHt0RGF0YX0gfSBmcm9tICcuL2ludGVyZmFjZXMnYCk7XG4gICAgfVxufVxuIl0sIm5hbWVzIjpbImFkZEJpbmRpbmdJbXBvcnRzIiwiYWRkR2VuZXJpY0ludGVyZmFjZUltcG9ydCIsImNvbnZlcnRGdW5jdGlvblRvQ29uc3RQcm9wZXJ0eSIsImNvbnZlcnRGdW5jdGlvblRvQ29uc3RQcm9wZXJ0eVRzIiwiY29udmVydEZ1bmN0aW9uVG9Qcm9wZXJ0eSIsImNvbnZlcnRJbXBvcnRQYXRoIiwiZXh0cmFjdENsYXNzRGVjbGFyYXRpb25zIiwiZXh0cmFjdEV2ZW50SGFuZGxlcnMiLCJleHRyYWN0SW1wb3J0U3RhdGVtZW50cyIsImV4dHJhY3RJbnRlcmZhY2VzIiwiZXh0cmFjdFR5cGVEZWNsYXJhdGlvbnMiLCJleHRyYWN0VHlwZUluZm9Gb3JWYXJpYWJsZSIsImV4dHJhY3RVbmJvdW5kSW5zdGFuY2VNZXRob2RzIiwiZmluZEFsbEFjY2Vzc2VkUHJvcGVydGllcyIsImZpbmRBbGxWYXJpYWJsZXMiLCJnZXRGdW5jdGlvbk5hbWUiLCJnZXRJbXBvcnQiLCJnZXRNb2R1bGVSZWdpc3RyYXRpb24iLCJnZXRQcm9wZXJ0eUludGVyZmFjZXMiLCJnZXRUeXBlcyIsImhhbmRsZVJvd0dlbmVyaWNJbnRlcmZhY2UiLCJpc0luc3RhbmNlTWV0aG9kIiwibW9kdWxlc1Byb2Nlc3NvciIsInBhcnNlRmlsZSIsInJlYWRBc0pzRmlsZSIsInJlY29nbml6ZWREb21FdmVudHMiLCJyZW1vdmVGdW5jdGlvbktleXdvcmQiLCJyZW1vdmVJblNjb3BlSnNEb2MiLCJ0c0NvbGxlY3QiLCJ0c0dlbmVyYXRlIiwidHNOb2RlSXNGdW5jdGlvbkNhbGwiLCJ0c05vZGVJc0Z1bmN0aW9uV2l0aE5hbWUiLCJ0c05vZGVJc0dsb2JhbEZ1bmN0aW9uQ2FsbCIsInRzTm9kZUlzR2xvYmFsVmFyIiwidHNOb2RlSXNHbG9iYWxWYXJXaXRoTmFtZSIsInRzTm9kZUlzSW5TY29wZSIsInRzTm9kZUlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uT2YiLCJ0c05vZGVJc1Byb3BlcnR5V2l0aE5hbWUiLCJ0c05vZGVJc1RvcExldmVsRnVuY3Rpb24iLCJ0c05vZGVJc1RvcExldmVsVmFyaWFibGUiLCJ0c05vZGVJc1R5cGVEZWNsYXJhdGlvbiIsInRzTm9kZUlzVW51c2VkRnVuY3Rpb24iLCJ1c2VzQ2hhcnRBcGkiLCJzcmNGaWxlIiwib3B0aW9ucyIsInVuZGVmaW5lZCIsInRzRmlsZSIsInJlcGxhY2UiLCJpbmNsdWRlSW1wb3J0cyIsImpzRmlsZSIsInRyYW5zZm9ybSIsInRyYW5zZm9ybXMiLCJkaXNhYmxlRVNUcmFuc2Zvcm1zIiwiY29kZSIsInNyYyIsInRzIiwiY3JlYXRlU291cmNlRmlsZSIsIlNjcmlwdFRhcmdldCIsIkxhdGVzdCIsInByaW50ZXIiLCJjcmVhdGVQcmludGVyIiwicmVtb3ZlQ29tbWVudHMiLCJvbWl0VHJhaWxpbmdTZW1pY29sb24iLCJub2RlIiwicHJpbnROb2RlIiwiRW1pdEhpbnQiLCJVbnNwZWNpZmllZCIsImVycm9yIiwiY29uc29sZSIsIm1vZHVsZXMiLCJtb2R1bGVJbXBvcnRzIiwic3VwcGxpZWRNb2R1bGVzIiwicmVxdWlyZWRNb2R1bGVzIiwiZm9yRWFjaCIsIm1vZHVsZSIsIndhcm4iLCJyZXF1aXJlZE1vZHVsZSIsInB1c2giLCJleHBvcnRlZCIsIm1hdGNoZXMiLCJleGVjIiwibGVuZ3RoIiwidHJpbSIsIm1ldGhvZHMiLCJwcm9wZXJ0eSIsIm1hcCIsImZpbHRlciIsIm5hbWUiLCJOb2RlVHlwZSIsInRzVHJlZSIsInRzQmluZGluZ3MiLCJjb2xsZWN0b3JzIiwicmVjdXJzZSIsImZvckVhY2hDaGlsZCIsImMiLCJyZXMiLCJhcHBseSIsImlzVmFyaWFibGVEZWNsYXJhdGlvbiIsImlzU291cmNlRmlsZSIsInBhcmVudCIsImdldFRleHQiLCJpc1Byb3BlcnR5QXNzaWdubWVudCIsImluaXRpYWxpemVyIiwicmVnaXN0ZXJlZCIsImlzVmFyaWFibGVEZWNsYXJhdGlvbkxpc3QiLCJkZWNsYXJhdGlvbnMiLCJkZWNsYXJhdGlvbiIsImlzRGVjbGFyZVN0YXRlbWVudCIsImluZGV4T2YiLCJpc0Z1bmN0aW9uRGVjbGFyYXRpb24iLCJpc01hdGNoIiwidW5ib3VuZEluc3RhbmNlTWV0aG9kcyIsInVzZWQiLCJpc0Z1bmN0aW9uTGlrZSIsImlzVG9wTGV2ZWwiLCJtb2RpZmllcnMiLCJzb21lIiwibSIsImlzVmFyaWFibGVTdGF0ZW1lbnQiLCJwcm9wZXJ0aWVzIiwiRXJyb3IiLCJpc1Byb3BlcnR5QWNjZXNzRXhwcmVzc2lvbiIsImlzSWRlbnRpZmllciIsImV4cHJlc3Npb24iLCJlc2NhcGVkVGV4dCIsImlzQ2FsbEV4cHJlc3Npb24iLCJpc0V4cHJlc3Npb25TdGF0ZW1lbnQiLCJmbGF0TWFwIiwiYXJyYXkiLCJjYWxsYmFjayIsIkFycmF5IiwicHJvdG90eXBlIiwiY29uY2F0IiwiZXh0cmFjdEV2ZW50SGFuZGxlckJvZHkiLCJtYXRjaCIsImRvbVRyZWUiLCJldmVudE5hbWVzIiwiZ2V0SGFuZGxlckF0dHJpYnV0ZXMiLCJldmVudCIsImhhbmRsZXJOYW1lIiwiaW5kZXgiLCJlbCIsImF0dHIiLCJyZXN1bHQiLCJ0b0FycmF5IiwibWV0aG9kIiwiaW5TY29wZU1ldGhvZHMiLCJzdGF0ZW1lbnRzIiwiZG9jcyIsImpzRG9jIiwiZG9jIiwidHJpbW1lZCIsImNvbW1lbnQiLCJpbmNsdWRlcyIsInZhck5hbWUiLCJ0eXBlU3RyIiwidHlwZVBhcnRzIiwiZGVjbGFyYXRpb25MaXN0IiwiZGVjIiwidHlwZSIsInR5cGVzVG9JbmNsdWRlIiwidHlwZU5hbWUiLCJjdCIsInVzZXNBcGkiLCJhbGxJbXBvcnRzIiwiaXNJbXBvcnREZWNsYXJhdGlvbiIsIm1vZHVsZVNwZWNpZmllciIsImltcG9ydENsYXVzZSIsImltcG9ydHMiLCJuYW1lZEltcG9ydCIsImlzTmFtZXNwYWNlZCIsIm5hbWVkQmluZGluZ3MiLCJpc05hbWVzcGFjZUltcG9ydCIsIm8iLCJhbGxEZWNsYXJlU3RhdGVtZW50cyIsInMiLCJraW5kIiwiU3ludGF4S2luZCIsIkRlY2xhcmVLZXl3b3JkIiwiYWxsQ2xhc3NlcyIsImlzQ2xhc3NEZWNsYXJhdGlvbiIsImFsbEludGVyZmFjZXMiLCJpc0ludGVyZmFjZURlY2xhcmF0aW9uIiwiYWxsVmFyaWFibGVzIiwiaXNPYmplY3RCaW5kaW5nUGF0dGVybiIsImVsZW1lbnRzIiwibiIsImlzUGFyYW1ldGVyIiwidmFyaWFibGVzIiwiZ2V0TG93ZXN0RXhwcmVzc2lvbiIsImV4cCIsImhhc0V4cHJlc3Npb24iLCJpc0FycmF5TGl0ZXJhbEV4cHJlc3Npb24iLCJhcmd1bWVudHMiLCJpc0JpbmFyeUV4cHJlc3Npb24iLCJyaWdodFByb3BzIiwicmlnaHQiLCJpbml0IiwiaXNUeXBlUmVmZXJlbmNlTm9kZSIsImVsZW1lbnQiLCJwcm9wcyIsIm1vZHVsZVBhY2thZ2UiLCJjb252ZXJ0VG9QYWNrYWdlIiwiY29udmVyc2lvbnMiLCJmaWxlbmFtZSIsImNvbXBvbmVudEZpbGVOYW1lIiwic3BsaXQiLCJjb21wb25lbnROYW1lIiwidG9VcHBlckNhc2UiLCJzbGljZSIsInByb3BUeXBlc1VzZWQiLCJwcm9wIiwidHlwaW5ncyIsIlNldCIsImJpbmRpbmdJbXBvcnRzIiwiaWdub3JlVHNJbXBvcnRzIiwid29ya2luZ0ltcG9ydHMiLCJuYW1lc3BhY2VkSW1wb3J0cyIsImNoYXJ0c0VudGVycHJpc2UiLCJpIiwicGF0aCIsImhhc0VudGVycHJpc2VNb2R1bGVzIiwiT2JqZWN0IiwiZW50cmllcyIsImsiLCJ2IiwidW5pcXVlIiwic29ydCIsImltcG9ydFN0ciIsImpvaW4iLCJqb2luaW5nQ29tbWEiLCJncmlkU2V0dGluZ3MiLCJlbnRlcnByaXNlIiwiZXhhbXBsZU5hbWUiLCJtb2R1bGVSZWdpc3RyYXRpb24iLCJpc0FycmF5IiwiZXhhbXBsZU1vZHVsZXMiLCJncmlkU3VwcGxpZWRNb2R1bGVzIiwiZmlsZVR4dCIsInREYXRhIiwiYmluZGluZ3MiLCJpbnRlcmZhY2VzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztJQXVtQmdCQSxpQkFBaUI7ZUFBakJBOztJQXNHQUMseUJBQXlCO2VBQXpCQTs7SUEvbUJIQyw4QkFBOEI7ZUFBOUJBOztJQUVBQyxnQ0FBZ0M7ZUFBaENBOztJQUxBQyx5QkFBeUI7ZUFBekJBOztJQXVkR0MsaUJBQWlCO2VBQWpCQTs7SUFoS0FDLHdCQUF3QjtlQUF4QkE7O0lBeElBQyxvQkFBb0I7ZUFBcEJBOztJQTJGQUMsdUJBQXVCO2VBQXZCQTs7SUF1REFDLGlCQUFpQjtlQUFqQkE7O0lBdEJBQyx1QkFBdUI7ZUFBdkJB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