export enum FlowProportionDatumType {
    Link,
    Node,
}

export type FlowProportionNodeDatumIndex = {
    type: FlowProportionDatumType;
    index: number;
};
