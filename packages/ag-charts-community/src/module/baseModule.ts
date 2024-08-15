import type { DataController } from '../chart/data/dataController';
import type { BBox } from '../scene/bbox';

export interface LayoutContext {
    width: number;
    height: number;
    layoutBox: BBox;
}

export interface ModuleInstance {
    processData?: (dataController: DataController) => Promise<void>;
    updateData?: (data: any) => void;
    performLayout?: (ctx: LayoutContext) => void;
    destroy(): void;
}

export type ChartTypes = 'cartesian' | 'polar' | 'hierarchy' | 'topology' | 'flow-proportion' | 'gauge';

export interface BaseModule<T extends ChartTypes = ChartTypes> {
    optionsKey: string;
    packageType: 'community' | 'enterprise';
    chartTypes: T[];
    identifier?: string;
    dependencies?: string[];
}
