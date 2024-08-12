import type { DataController } from '../chart/data/dataController';
import type { BBox } from '../scene/bbox';

export type LayoutPosition = 'top' | 'right' | 'bottom' | 'left';

type LayoutElement = 'title' | 'subtitle' | 'footnote';
export interface LayoutContext {
    layoutRect: BBox;
    positions: { [K in LayoutElement]?: BBox };
    padding: { [K in LayoutElement]?: number };
}

export interface ModuleInstance {
    processData?: (opts: { dataController: DataController }) => Promise<void>;
    updateData?: (opts: { data: any }) => Promise<void>;
    performLayout?: (ctx: LayoutContext) => Promise<void> | void;
    performCartesianLayout?: (opts: { seriesRect: BBox }) => Promise<void>;
    // onLayoutComplete?: (ctx: LayoutContext) => Promise<void> | void;
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
