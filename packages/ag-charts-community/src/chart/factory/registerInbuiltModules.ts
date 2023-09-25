import { registerModule } from '../../util/module';
import { BackgroundModule } from '../background/backgroundModule';
import { AreaSeriesModule } from '../series/cartesian/areaSeriesModule';
import { BarSeriesModule } from '../series/cartesian/barSeriesModule';
import { BubbleSeriesModule } from '../series/cartesian/bubbleSeriesModule';
import { LineSeriesModule } from '../series/cartesian/lineSeriesModule';
import { ScatterSeriesModule } from '../series/cartesian/scatterSeriesModule';
import { PieSeriesModule } from '../series/polar/pieSeriesModule';

export function registerInbuiltModules() {
    registerModule(BackgroundModule);

    registerModule(AreaSeriesModule);
    registerModule(BarSeriesModule);
    registerModule(BubbleSeriesModule);
    registerModule(LineSeriesModule);
    registerModule(ScatterSeriesModule);
    registerModule(PieSeriesModule);
}
