import { BaseProperties } from '../../util/properties';
import type { LocaleManager } from '../locale/localeManager';
import { Overlay } from './overlay';
export declare class ChartOverlays extends BaseProperties {
    darkTheme: boolean;
    readonly loading: Overlay;
    readonly noData: Overlay;
    readonly noVisibleSeries: Overlay;
    getFocusInfo(localeManager: LocaleManager): {
        text: string;
        rect: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
    } | undefined;
    destroy(): void;
}
