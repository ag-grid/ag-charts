import { registerModule } from '../../util/module';
import { NavigatorModule } from '../../util/navigator-module';
import { BackgroundModule } from '../background/backgroundModule';
import { BarSeriesModule } from '../series/cartesian/barModule';

export function registerInbuiltModules() {
    registerModule(BackgroundModule);
    registerModule(NavigatorModule);

    registerModule(BarSeriesModule);
}
