import type { _ModuleSupport } from 'ag-charts-community';

export enum FlowProportionDatumType {
    Link,
    Node,
}

export type FlowNodeDatumIndex = _ModuleSupport.DatumIndex & { __brand_node: never };
export type FlowLinkDatumIndex = _ModuleSupport.DatumIndex & { __brand_link: never };

export function flowNodeDatumIndex(n: number): FlowNodeDatumIndex {
    return n as FlowNodeDatumIndex;
}

export function flowLinkDatumIndex(n: number): FlowLinkDatumIndex {
    return -(n + 1) as FlowLinkDatumIndex;
}
