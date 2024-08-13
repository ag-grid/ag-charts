import type { DataController } from '../chart/data/dataController';
import type { BBox } from '../scene/bbox';

export interface LayoutContext {
    width: number;
    height: number;
    layoutBox: BBox;
}

export interface ModuleInstance {
    processData?: (opts: { dataController: DataController }) => Promise<void>;
    updateData?: (opts: { data: any }) => Promise<void>;
    performLayout?: (ctx: LayoutContext) => Promise<void> | void;
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
