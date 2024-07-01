import type { DataController } from '../chart/data/dataController';
import type { BBox } from '../scene/bbox';
type LayoutPositions = 'title' | 'subtitle' | 'footnote';
export interface LayoutContext {
    shrinkRect: BBox;
    positions: {
        [K in LayoutPositions]?: BBox;
    };
    padding: {
        [K in LayoutPositions]?: number;
    };
}
export interface ModuleInstance {
    processData?: (opts: {
        dataController: DataController;
    }) => Promise<void>;
    updateData?: (opts: {
        data: any;
    }) => Promise<void>;
    performLayout?: (opts: LayoutContext) => Promise<LayoutContext>;
    performCartesianLayout?: (opts: {
        seriesRect: BBox;
    }) => Promise<void>;
    destroy(): void;
}
export type ChartTypes = 'cartesian' | 'polar' | 'hierarchy' | 'topology' | 'flow-proportion';
export interface BaseModule<T extends ChartTypes = ChartTypes> {
    optionsKey: string;
    packageType: 'community' | 'enterprise';
    chartTypes: T[];
    identifier?: string;
    dependencies?: string[];
}
export {};
