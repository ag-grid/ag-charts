import ts from 'typescript';
export type ImportType = 'packages' | 'modules';
export interface BindingImport {
    isNamespaced: boolean;
    module: string;
    namedImport: string;
    imports: string[];
}
export declare function readAsJsFile(srcFile: any, options?: {
    includeImports: boolean;
}): string;
export declare function parseFile(src: any): ts.SourceFile;
export declare function tsGenerate(node: any, srcFile: any): string;
export declare function modulesProcessor(modules: string[]): {
    moduleImports: any[];
    suppliedModules: any[];
};
export declare function removeFunctionKeyword(code: string): string;
export declare function getFunctionName(code: string): string;
export declare const convertFunctionToProperty: (code: string) => string;
export declare const convertFunctionToConstProperty: (code: string) => string;
export declare const convertFunctionToConstPropertyTs: (code: string) => string;
export declare function isInstanceMethod(methods: string[], property: any): boolean;
export declare const enum NodeType {
    Variable = "VariableDeclaration",
    Function = "FunctionDeclaration",
    Expression = "ExpressionStatement"
}
export declare function tsCollect(tsTree: any, tsBindings: any, collectors: any, recurse?: boolean): any;
export declare function tsNodeIsGlobalVar(node: any): boolean;
export declare function tsNodeIsGlobalVarWithName(node: any, name: string): boolean;
export declare function tsNodeIsPropertyWithName(node: ts.Node, name: string): boolean;
export declare function tsNodeIsTopLevelVariable(node: ts.Node, registered?: string[]): boolean;
export declare function tsNodeIsFunctionWithName(node: ts.Node, name: string): boolean;
export declare function tsNodeIsInScope(node: any, unboundInstanceMethods: string[]): boolean;
export declare function tsNodeIsUnusedFunction(node: any, used: string[], unboundInstanceMethods: string[]): boolean;
export declare function tsNodeIsTypeDeclaration(node: any): boolean;
export declare function tsNodeIsPropertyAccessExpressionOf(node: any, properties: string[]): boolean;
export declare function tsNodeIsFunctionCall(node: any): boolean;
export declare function tsNodeIsGlobalFunctionCall(node: ts.Node): boolean;
export declare const recognizedDomEvents: string[];
export declare function extractEventHandlers(domTree: any, eventNames: string[]): any[];
export declare function removeInScopeJsDoc(method: string): string;
export declare function extractUnboundInstanceMethods(srcFile: ts.SourceFile): any[];
export declare function extractTypeInfoForVariable(srcFile: ts.SourceFile, varName: string): {
    typeStr: any;
    typeParts: any[];
};
export declare function getTypes(node: ts.Node): any[];
export declare function usesChartApi(node: ts.Node): boolean;
export declare function extractImportStatements(srcFile: ts.SourceFile): BindingImport[];
export declare function extractTypeDeclarations(srcFile: ts.SourceFile): any[];
export declare function extractClassDeclarations(srcFile: ts.SourceFile): any[];
export declare function extractInterfaces(srcFile: ts.SourceFile): any[];
export declare function tsNodeIsTopLevelFunction(node: any): boolean;
/**
 * Find all the variables defined in this node tree recursively
 */
export declare function findAllVariables(node: any): any[];
/**
 * Find all the properties accessed in this node.
 */
export declare function findAllAccessedProperties(node: any): any[];
/** Convert import paths to their package equivalent when the docs are in Packages mode
 * i.e import { GridOptions } from '@ag-grid-community/core';
 * to
 * import { GridOptions } from '@ag-grid-community';
 */
export declare function convertImportPath(modulePackage: string, convertToPackage: boolean): any;
export declare function getImport(filename: string): string;
export declare function getPropertyInterfaces(properties: any): any[];
/**
 *  Add the imports from the parsed file
 * We ignore any component files as those imports are generated for each framework.
 */
export declare function addBindingImports(bindingImports: any, imports: string[], convertToPackage: boolean, ignoreTsImports: boolean): void;
export declare function getModuleRegistration({ gridSettings, enterprise, exampleName }: {
    gridSettings: any;
    enterprise: any;
    exampleName: any;
}): string[];
export declare function handleRowGenericInterface(fileTxt: string, tData: string): string;
export declare function addGenericInterfaceImport(imports: string[], tData: string, bindings: any): void;
