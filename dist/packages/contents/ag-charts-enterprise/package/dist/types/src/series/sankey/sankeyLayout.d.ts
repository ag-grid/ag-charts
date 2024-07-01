import type { NodeGraphEntry } from '../flow-proportion/flowProportionUtil';
import type { SankeyLinkDatum, SankeyNodeDatum } from './sankeySeriesProperties';
export type Column = {
    index: number;
    nodes: NodeGraphEntry<SankeyNodeDatum, SankeyLinkDatum>[];
    size: number;
    readonly x: number;
};
interface Layout {
    seriesRectHeight: number;
    nodeSpacing: number;
    sizeScale: number;
}
export declare function layoutColumns(columns: Column[], layout: Layout): void;
export {};
