import type { ExtensibleTheme, SeriesType } from 'ag-charts-types';

import type { ChartType } from '../chart/factory/chartTypes';
import type { ChartLegend, ChartLegendType } from '../chart/legend/legendDatum';
import type { BaseModule, BaseOptionsModule, ModuleInstance } from './baseModule';
import type { ModuleContext } from './moduleContext';

type ModuleInstanceFactory<M> = (moduleContext: ModuleContext) => M;
export type LegendFactory = ModuleInstanceFactory<ChartLegend>;

export interface RemovableModule {
    /** Force whether this is a removable module or not, depending on user options. */
    removable?: boolean | 'standalone-only';
}

export interface ContextModule<M extends ModuleInstance = ModuleInstance> extends BaseModule {
    type: 'context';

    moduleFactory: ModuleInstanceFactory<M>;

    contextKey: string;
}

export interface RootModule<M extends ModuleInstance = ModuleInstance> extends BaseOptionsModule, RemovableModule {
    type: 'root';

    moduleFactory: ModuleInstanceFactory<M>;

    themeTemplate?: object;
}

export interface LegendModule extends BaseOptionsModule, RemovableModule {
    type: 'legend';

    identifier: ChartLegendType;
    moduleFactory: LegendFactory;

    themeTemplate?: object;
}

export interface SeriesModule<TSeries extends SeriesType = SeriesType, _ChartType extends ChartType = ChartType>
    extends BaseOptionsModule<_ChartType> {
    type: 'series';
    identifier: TSeries;
    themeTemplate: ExtensibleTheme<TSeries>;
}
