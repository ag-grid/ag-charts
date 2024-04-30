import { BaseProperties } from '../../util/properties';
import { Overlay } from './overlay';
export declare class ChartOverlays extends BaseProperties {
    readonly loading: Overlay;
    readonly noData: Overlay;
    readonly noVisibleSeries: Overlay;
    getFocusInfo(): {
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
