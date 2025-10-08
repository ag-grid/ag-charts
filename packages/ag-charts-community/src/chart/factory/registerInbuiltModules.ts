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
import { VERSION } from '../../version';
import { BackgroundModule } from '../background/backgroundModule';
import { LegendModule } from '../legend/legendModule';
import { SeriesAreaModule } from '../series-area/seriesAreaModule';
import { AreaSeriesModule } from '../series/cartesian/areaSeriesModule';
import { BarSeriesModule } from '../series/cartesian/barSeriesModule';
import { BubbleSeriesModule } from '../series/cartesian/bubbleSeriesModule';
import { HistogramSeriesModule } from '../series/cartesian/histogramSeriesModule';
import { LineSeriesModule } from '../series/cartesian/lineSeriesModule';
import { ScatterSeriesModule } from '../series/cartesian/scatterSeriesModule';
import { DonutSeriesModule } from '../series/polar/donutSeriesModule';
import { PieSeriesModule } from '../series/polar/pieSeriesModule';

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
            AreaSeriesModule,
            BarSeriesModule,
            BubbleSeriesModule,
            LineSeriesModule,
            ScatterSeriesModule,
            DonutSeriesModule,
            PieSeriesModule,
            HistogramSeriesModule,

            // Plugin modules
            BackgroundModule,
            SeriesAreaModule,
            LegendModule,
            LocaleModule,
        ],
        VERSION
    );
}
