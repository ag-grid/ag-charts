import type { DataController } from '../chart/data/dataController';
import type { BBox } from '../scene/bbox';
export interface ModuleInstance {
    processData?: (opts: {
        dataController: DataController;
    }) => Promise<void>;
    updateData?: (opts: {
        data: any;
    }) => Promise<void>;
    performLayout?: (opts: {
        shrinkRect: BBox;
    }) => Promise<{
        shrinkRect: BBox;
    }>;
    performCartesianLayout?: (opts: {
        seriesRect: BBox;
    }) => Promise<void>;
    destroy(): void;
}
export type ChartTypes = 'cartesian' | 'polar' | 'hierarchy' | 'topology';
export interface BaseModule<T extends ChartTypes = ChartTypes> {
    optionsKey: string;
    packageType: 'community' | 'enterprise';
    chartTypes: T[];
    identifier?: string;
    dependencies?: string[];
}
