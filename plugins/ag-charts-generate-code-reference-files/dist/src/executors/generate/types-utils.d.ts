import * as ts from 'typescript';
type NodeType = any;
type HeritageType = {
    kind?: string;
    type: any;
    typeParams: any[];
    typeArguments?: any[];
    members?: TypingMapItem[];
} | string;
type TypingMapItem = {
    node: NodeType;
    heritage?: HeritageType[];
};
export declare class TypeMapper {
    protected nodeMap: Map<string, TypingMapItem>;
    protected genericsMap: Map<string, string>;
    constructor(inputFiles: string[]);
    entries(): [string, TypingMapItem][];
    resolvedEntries(): any[];
    protected isTopLevelDeclaration(node: ts.Node): node is ts.EnumDeclaration | ts.InterfaceDeclaration | ts.TypeAliasDeclaration;
    protected extractInterfaceHeritage(node: ts.InterfaceDeclaration): any[];
    protected resolveType(nameOrNode: NodeType | string, typeArguments?: NodeType[]): any;
    protected resolveNode({ node, heritage }: TypingMapItem, typeArguments?: NodeType[]): any;
    protected resolveTypeRef(node: any): any;
    cleanupMembers(members: any): any;
}
export declare function formatNode(node: ts.Node): any;
export declare function printNode(node: ts.Node): string;
export {};
