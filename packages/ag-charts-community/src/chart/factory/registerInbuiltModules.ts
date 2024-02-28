import { registerModule } from '../../module/module';
import { CategoryAxis } from '../axis/categoryAxis';
import { GroupedCategoryAxis } from '../axis/groupedCategoryAxis';
import { LogAxis } from '../axis/logAxis';
import { NumberAxis } from '../axis/numberAxis';
import { TimeAxis } from '../axis/timeAxis';
import { BackgroundModule } from '../background/backgroundModule';
import { CommunityLegendModule } from '../legendModule';
import { NavigatorModule } from '../navigator/navigatorModule';
import { AreaSeriesModule } from '../series/cartesian/areaSeriesModule';
import { BarSeriesModule } from '../series/cartesian/barSeriesModule';
import { BubbleSeriesModule } from '../series/cartesian/bubbleSeriesModule';
import { HistogramSeriesModule } from '../series/cartesian/histogramSeriesModule';
import { LineSeriesModule } from '../series/cartesian/lineSeriesModule';
import { ScatterSeriesModule } from '../series/cartesian/scatterSeriesModule';
import { DonutSeriesModule } from '../series/polar/donutSeriesModule';
import { PieSeriesModule } from '../series/polar/pieSeriesModule';
import { MapSeriesModule } from '../series/topology/mapSeriesModule';
import { axisRegistry } from './axisRegistry';

export function registerInbuiltModules() {
    registerModule(BackgroundModule);
    registerModule(CommunityLegendModule);
    registerModule(NavigatorModule);

    registerModule(AreaSeriesModule);
    registerModule(BarSeriesModule);
    registerModule(BubbleSeriesModule);
    registerModule(LineSeriesModule);
    registerModule(ScatterSeriesModule);
    registerModule(DonutSeriesModule);
    registerModule(PieSeriesModule);
    registerModule(HistogramSeriesModule);

    // @todo(AG-10831) Move to enterprise
    registerModule(MapSeriesModule);

    for (const AxisConstructor of [NumberAxis, CategoryAxis, TimeAxis, GroupedCategoryAxis, LogAxis]) {
        axisRegistry.register(AxisConstructor.type, { instanceConstructor: AxisConstructor });
    }
}
