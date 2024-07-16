import type { SeriesModule } from '../../module/coreModules';
import type { SeriesPaletteFactory } from '../../module/coreModulesTypes';
import type { ModuleContext } from '../../module/moduleContext';
import type { AgCartesianSeriesOptions, AgHierarchySeriesOptions, AgPolarSeriesOptions } from '../../options/agChartOptions';
import type { AgChartOptions } from '../../options/chart/chartBuilderOptions';
import type { AgTopologySeriesOptions } from '../../options/series/topology/topologyOptions';
import type { SeriesType } from '../mapping/types';
import type { ISeries } from '../series/seriesTypes';
export type SeriesOptions = AgCartesianSeriesOptions | AgPolarSeriesOptions | AgHierarchySeriesOptions | AgTopologySeriesOptions;
export declare class SeriesRegistry {
    private seriesMap;
    private themeTemplates;
    register(seriesType: NonNullable<SeriesType>, { chartTypes: [chartType], instanceConstructor, defaultAxes, themeTemplate, enterpriseThemeTemplate, paletteFactory, solo, stackable, groupable, stackedByDefault, swapDefaultAxesCondition, hidden, }: SeriesModule<any, any>): void;
    create(seriesType: SeriesType, moduleContext: ModuleContext): ISeries<any, any>;
    cloneDefaultAxes(seriesType: SeriesType): {
        axes: object[];
    } | null;
    setThemeTemplate(seriesType: NonNullable<SeriesType>, themeTemplate: {}, enterpriseThemeTemplate?: {}): void;
    getThemeTemplate(seriesType: string): object | undefined;
    getPaletteFactory(seriesType: SeriesType): SeriesPaletteFactory<import("../../module/coreModulesTypes").RequiredSeriesType> | undefined;
    isSolo(seriesType: SeriesType): boolean;
    isGroupable(seriesType: SeriesType): boolean;
    isStackable(seriesType: SeriesType): boolean;
    isStackedByDefault(seriesType: SeriesType): boolean;
    isDefaultAxisSwapNeeded(options: AgChartOptions): boolean | undefined;
}
export declare const seriesRegistry: SeriesRegistry;
