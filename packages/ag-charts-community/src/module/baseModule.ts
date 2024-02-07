import type { BBox } from '../integrated-charts-scene';
import type { DataController } from '../module-support';

export interface ModuleInstance {
    processData?: (opts: { dataController: DataController }) => Promise<void>;
    updateData?: (opts: { data: any }) => Promise<void>;
    performLayout?: (opts: { shrinkRect: BBox }) => Promise<{ shrinkRect: BBox }>;
    performCartesianLayout?: (opts: { seriesRect: BBox }) => Promise<void>;
    destroy(): void;
}

export interface BaseModule {
    optionsKey: string;
    packageType: 'community' | 'enterprise';
    chartTypes: ('cartesian' | 'polar' | 'hierarchy')[];
    identifier?: string;
}
