export type NodeType =
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

export interface MemberNode {
    kind: 'member';
    name: string;
    type: NodeType;
    optional?: boolean;
    defaultValue?: string;
    docs?: string[];
}

export interface InterfaceNode {
    kind: 'interface';
    name: string;
    typeParams?: TypeParameterNode[];
    heritage?: NodeType[];
    members: MemberNode[];
    docs?: string[];
    genericsMap?: Record<string, NodeType>;
}

export interface TypeAliasNode {
    kind: 'typeAlias';
    name: string;
    type: NodeType;
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
    returnType: NodeType;
}

export interface IndexAccessNode {
    kind: 'indexAccess';
    type: NodeType;
    index: string;
}

export interface MultiTypeNode {
    kind: 'union' | 'intersection' | 'tuple';
    type: NodeType[];
}

export interface ArrayNode {
    kind: 'array';
    type: NodeType;
}

export interface ParameterNode {
    kind: 'param';
    name: string;
    type: NodeType;
}

export interface TypeParameterNode {
    kind: 'typeParam';
    name: string;
    constraint?: NodeType;
    default?: NodeType;
}
