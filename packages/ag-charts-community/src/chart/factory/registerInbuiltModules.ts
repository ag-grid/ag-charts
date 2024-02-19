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
import { axisRegistry } from './axisRegistry';
import { legendRegistry } from './legendRegistry';

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

    for (const AxisConstructor of [NumberAxis, CategoryAxis, TimeAxis, GroupedCategoryAxis, LogAxis]) {
        axisRegistry.register(AxisConstructor.type, { instanceConstructor: AxisConstructor });
    }

    legendRegistry.register('category', { optionsKey: 'legend', instanceConstructor: Legend });
}
