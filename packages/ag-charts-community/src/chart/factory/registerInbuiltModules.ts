import { registerModule } from '../../module/module';
import { CategoryAxis } from '../axis/categoryAxis';
import { GroupedCategoryAxis } from '../axis/groupedCategoryAxis';
import { LogAxis } from '../axis/logAxis';
import { NumberAxis } from '../axis/numberAxis';
import { TimeAxis } from '../axis/timeAxis';
import { BackgroundModule } from '../background/backgroundModule';
import { Legend } from '../legend';
import { NavigatorModule } from '../navigator/navigatorModule';
import { AreaSeriesModule } from '../series/cartesian/areaSeriesModule';
import { BarSeriesModule } from '../series/cartesian/barSeriesModule';
import { BubbleSeriesModule } from '../series/cartesian/bubbleSeriesModule';
import { HistogramSeriesModule } from '../series/cartesian/histogramSeriesModule';
import { LineSeriesModule } from '../series/cartesian/lineSeriesModule';
import { ScatterSeriesModule } from '../series/cartesian/scatterSeriesModule';
import { DonutSeriesModule } from '../series/polar/donutSeriesModule';
import { PieSeriesModule } from '../series/polar/pieSeriesModule';
import { registerAxis } from './axisTypes';
import { registerLegend } from './legendTypes';

export function registerInbuiltModules() {
    registerModule(BackgroundModule);
    registerModule(NavigatorModule);

    registerModule(AreaSeriesModule);
    registerModule(BarSeriesModule);
    registerModule(BubbleSeriesModule);
    registerModule(LineSeriesModule);
    registerModule(ScatterSeriesModule);
    registerModule(DonutSeriesModule);
    registerModule(PieSeriesModule);
    registerModule(HistogramSeriesModule);

    const inbuiltAxes = new Map<string, any>([
        [NumberAxis.type, NumberAxis],
        [CategoryAxis.type, CategoryAxis],
        [TimeAxis.type, TimeAxis],
        [GroupedCategoryAxis.type, GroupedCategoryAxis],
        [LogAxis.type, LogAxis],
    ]);
    inbuiltAxes.forEach((impl, type) => {
        registerAxis(type, impl);
    });

    registerLegend('category', 'legend', Legend, undefined);
}
