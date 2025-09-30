import { ModuleRegistry } from 'ag-charts-core';

import { LocaleModule } from '../../locale/localeModule';
import {
    CategoryAxisModule,
    GroupedCategoryAxisModule,
    LogAxisModule,
    NumberAxisModule,
    TimeAxisModule,
    UnitTimeAxisModule,
} from '../../module/axisModules';
import { moduleRegistry } from '../../module/module';
import { VERSION } from '../../version';
import { CategoryAxis } from '../axis/categoryAxis';
import { GroupedCategoryAxis } from '../axis/groupedCategoryAxis';
import { LogAxis } from '../axis/logAxis';
import { NumberAxis } from '../axis/numberAxis';
import { TimeAxis } from '../axis/timeAxis';
import { UnitTimeAxis } from '../axis/unitTimeAxis';
import { BackgroundModule } from '../background/backgroundModule';
import { CommunityLegendModule } from '../legend/legendModule';
import { SeriesAreaModule } from '../series-area/seriesAreaModule';
import { AreaSeriesModule, NewAreaSeriesModule } from '../series/cartesian/areaSeriesModule';
import { BarSeriesModule, NewBarSeriesModule } from '../series/cartesian/barSeriesModule';
import { BubbleSeriesModule, NewBubbleSeriesModule } from '../series/cartesian/bubbleSeriesModule';
import { HistogramSeriesModule, NewHistogramSeriesModule } from '../series/cartesian/histogramSeriesModule';
import { LineSeriesModule, NewLineSeriesModule } from '../series/cartesian/lineSeriesModule';
import { NewScatterSeriesModule, ScatterSeriesModule } from '../series/cartesian/scatterSeriesModule';
import { DonutSeriesModule, NewDonutSeriesModule } from '../series/polar/donutSeriesModule';
import { NewPieSeriesModule, PieSeriesModule } from '../series/polar/pieSeriesModule';
import { axisRegistry } from './axisRegistry';

export function registerInbuiltModules() {
    ModuleRegistry.registerMany(
        [
            // Axis modules
            NumberAxisModule,
            LogAxisModule,
            TimeAxisModule,
            UnitTimeAxisModule,
            CategoryAxisModule,
            GroupedCategoryAxisModule,

            // Series modules
            NewAreaSeriesModule,
            NewBarSeriesModule,
            NewBubbleSeriesModule,
            NewLineSeriesModule,
            NewScatterSeriesModule,
            NewDonutSeriesModule,
            NewPieSeriesModule,
            NewHistogramSeriesModule,

            // Plugin modules
            // BackgroundModule,
            // SeriesAreaModule,
            // CommunityLegendModule,
            // LocaleModule,
        ],
        VERSION
    );

    moduleRegistry.register(
        BackgroundModule,
        SeriesAreaModule,
        CommunityLegendModule,
        LocaleModule,

        AreaSeriesModule,
        BarSeriesModule,
        BubbleSeriesModule,
        LineSeriesModule,
        ScatterSeriesModule,
        DonutSeriesModule,
        PieSeriesModule,
        HistogramSeriesModule
    );

    for (const AxisConstructor of [NumberAxis, CategoryAxis, TimeAxis, GroupedCategoryAxis, LogAxis, UnitTimeAxis]) {
        axisRegistry.register(AxisConstructor.type, {
            moduleFactory: (ctx) => new AxisConstructor(ctx),
        });
    }
}
