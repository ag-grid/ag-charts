import { LocaleModule } from '../../locale/localeModule';
import { moduleRegistry } from '../../module/module';
import { CategoryAxis } from '../axis/categoryAxis';
import { ContinuousTimeAxis } from '../axis/continuousTimeAxis';
import { GroupedCategoryAxis } from '../axis/groupedCategoryAxis';
import { LogAxis } from '../axis/logAxis';
import { NumberAxis } from '../axis/numberAxis';
import { TimeAxis } from '../axis/timeAxis';
import { BackgroundModule } from '../background/backgroundModule';
import { CommunityLegendModule } from '../legend/legendModule';
import { AreaSeriesModule } from '../series/cartesian/areaSeriesModule';
import { BarSeriesModule } from '../series/cartesian/barSeriesModule';
import { BubbleSeriesModule } from '../series/cartesian/bubbleSeriesModule';
import { HistogramSeriesModule } from '../series/cartesian/histogramSeriesModule';
import { LineSeriesModule } from '../series/cartesian/lineSeriesModule';
import { ScatterSeriesModule } from '../series/cartesian/scatterSeriesModule';
import { DonutSeriesModule } from '../series/polar/donutSeriesModule';
import { PieSeriesModule } from '../series/polar/pieSeriesModule';
import { axisRegistry } from './axisRegistry';

export function registerInbuiltModules() {
    moduleRegistry.register(
        BackgroundModule,
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

    for (const AxisConstructor of [
        NumberAxis,
        CategoryAxis,
        ContinuousTimeAxis,
        GroupedCategoryAxis,
        LogAxis,
        TimeAxis,
    ]) {
        axisRegistry.register(AxisConstructor.type, {
            moduleFactory: (ctx) => new AxisConstructor(ctx),
        });
    }
}
