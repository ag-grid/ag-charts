import type { DataController } from '../chart/data/dataController';
import type { DataSet } from '../chart/data/dataSet';
import type { ChartType } from '../chart/factory/chartTypes';
import type { BBox } from '../scene/bbox';

export interface LayoutContext {
    width: number;
    height: number;
    layoutBox: BBox;
}

export interface ModuleInstance {
    processData?: (dataController: DataController) => Promise<void>;
    updateData?: (data: DataSet) => void;
    destroy(): void;
}

export interface BaseModule<T extends ChartType = ChartType> {
    packageType: 'community' | 'enterprise';
    chartTypes: T[];
    identifier?: string;
    dependencies?: string[];
}

export interface BaseOptionsModule<T extends ChartType = ChartType> extends BaseModule<T> {
    optionsKey: string;
}
