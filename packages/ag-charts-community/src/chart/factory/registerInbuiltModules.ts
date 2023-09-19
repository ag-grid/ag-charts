import { registerModule } from '../../util/module';
import { NavigatorModule } from '../../util/navigator-module';
import { BackgroundModule } from '../background/backgroundModule';
import { AreaSeriesModule } from '../series/cartesian/areaSeriesModule';
import { BarSeriesModule } from '../series/cartesian/barSeriesModule';
import { BubbleSeriesModule } from '../series/cartesian/bubbleSeriesModule';
import { HistogramSeriesModule } from '../series/cartesian/histogramSeriesModule';
import { LineSeriesModule } from '../series/cartesian/lineSeriesModule';
import { ScatterSeriesModule } from '../series/cartesian/scatterSeriesModule';

export function registerInbuiltModules() {
    registerModule(BackgroundModule);
    registerModule(NavigatorModule);

    registerModule(AreaSeriesModule);
    registerModule(BarSeriesModule);
    registerModule(BubbleSeriesModule);
    registerModule(HistogramSeriesModule);
    registerModule(LineSeriesModule);
    registerModule(ScatterSeriesModule);
}
