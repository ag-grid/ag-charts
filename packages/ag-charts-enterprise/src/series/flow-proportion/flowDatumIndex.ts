import type { _ModuleSupport } from 'ag-charts-community';

// Link datumIndex values are positive (first node is 0, then 1, and so on)...
// Node datumIndex values are strictly negative (first node is -1, then -2, and so on)...
export enum FlowProportionDatumType {
    Link,
    Node,
}

// Type-branding to avoid accidentally mixing up different number variables:
export type FlowNodeDatumIndex = _ModuleSupport.DatumIndex & { __brand_node: never };
export type FlowLinkDatumIndex = _ModuleSupport.DatumIndex & { __brand_link: never };

export function flowNodeDatumIndex(offset: number): FlowNodeDatumIndex {
    return -(offset + 1) as FlowNodeDatumIndex;
}

export function flowLinkDatumIndex(offset: number): FlowLinkDatumIndex {
    return offset as FlowLinkDatumIndex;
}

export function toFlowNodeOffset(datumIndex: FlowNodeDatumIndex): number {
    return -(datumIndex + 1);
}

export function toFlowLinkOffset(datumIndex: FlowLinkDatumIndex): number {
    return datumIndex;
}

export function isFlowNodeDatumIndex(datumIndex: _ModuleSupport.DatumIndex): datumIndex is FlowNodeDatumIndex {
    return datumIndex < 0;
}

export function isFlowLinkDatumIndex(datumIndex: _ModuleSupport.DatumIndex): datumIndex is FlowLinkDatumIndex {
    return datumIndex >= 0;
}

export function toFlowNodeAriaIndex(datumIndex: FlowNodeDatumIndex): number {
    return toFlowNodeOffset(datumIndex) + 1;
}

export function toFlowLinkAriaIndex(datumIndex: FlowLinkDatumIndex): number {
    return toFlowLinkOffset(datumIndex) + 1;
}
