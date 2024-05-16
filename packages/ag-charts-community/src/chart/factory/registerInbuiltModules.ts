import { moduleRegistry } from '../../module/module';
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
import { ChordSeriesModule } from '../series/chord/chordSeriesModule';
import { DonutSeriesModule } from '../series/polar/donutSeriesModule';
import { PieSeriesModule } from '../series/polar/pieSeriesModule';
import { SankeySeriesModule } from '../series/sankey/sankeySeriesModule';
import { ToolbarModule } from '../toolbar/toolbarModule';
import { axisRegistry } from './axisRegistry';

export function registerInbuiltModules() {
    moduleRegistry.register(
        BackgroundModule,
        CommunityLegendModule,
        NavigatorModule,
        ToolbarModule,
        AreaSeriesModule,
        BarSeriesModule,
        BubbleSeriesModule,
        LineSeriesModule,
        ScatterSeriesModule,
        DonutSeriesModule,
        PieSeriesModule,
        HistogramSeriesModule,
        SankeySeriesModule,
        ChordSeriesModule
    );

    for (const AxisConstructor of [NumberAxis, CategoryAxis, TimeAxis, GroupedCategoryAxis, LogAxis]) {
        axisRegistry.register(AxisConstructor.type, {
            instanceConstructor: AxisConstructor,
            hidden: AxisConstructor === GroupedCategoryAxis,
        });
    }
}
