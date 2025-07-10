export type NodeTypes =
    | InterfaceNode
    | TypeAliasNode
    | TypeLiteralNode
    | TypeReferenceNode
    | EnumNode
    | FunctionNode
    | IndexAccessNode
    | MultiTypeNode
    | ArrayNode
    | ParameterNode
    | TypeParameterNode
    | MemberNode;

export type TypeNode =
    | string
    | InterfaceNode
    | TypeAliasNode
    | TypeLiteralNode
    | TypeReferenceNode
    | EnumNode
    | FunctionNode
    | IndexAccessNode
    | MultiTypeNode
    | ArrayNode;

export interface MemberNode {
    kind: 'member';
    name: string;
    type: TypeNode;
    optional?: boolean;
    defaultValue?: string;
    docs?: string[];
}

export interface InterfaceNode {
    kind: 'interface';
    name: string;
    typeParams?: TypeParameterNode[];
    heritage?: TypeNode[];
    members: MemberNode[];
    docs?: string[];
    genericsMap?: Record<string, TypeNode>;
}

export interface TypeAliasNode {
    kind: 'typeAlias';
    name: string;
    type: TypeNode;
    typeParams?: TypeParameterNode[];
    docs?: string[];
}

export interface TypeLiteralNode {
    kind: 'typeLiteral';
    name?: string;
    members: MemberNode[];
}

export interface TypeReferenceNode {
    kind: 'typeRef';
    type: string;
    typeArguments?: Array<string | TypeReferenceNode>;
}

export interface EnumNode {
    kind: 'enum';
    name: string;
    members: Record<string, string>;
}

export interface FunctionNode {
    kind: 'function';
    params?: ParameterNode[];
    typeParams?: TypeParameterNode[];
    returnType: TypeNode;
}

export interface IndexAccessNode {
    kind: 'indexAccess';
    type: TypeNode;
    index: string;
}

export interface MultiTypeNode {
    kind: 'union' | 'intersection' | 'tuple';
    type: TypeNode[];
}

export interface ArrayNode {
    kind: 'array';
    type: TypeNode;
}

export interface ParameterNode {
    kind: 'param';
    name: string;
    type: TypeNode;
}

export interface TypeParameterNode {
    kind: 'typeParam';
    name: string;
    constraint?: TypeNode;
    default?: TypeNode;
}
