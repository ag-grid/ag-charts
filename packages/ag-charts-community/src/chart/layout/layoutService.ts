import type { LayoutContext } from '../../module/baseModule';
import type { Scale } from '../../scale/scale';
import type { BBox } from '../../scene/bbox';
import { EventEmitter } from '../../util/eventEmitter';
import type { TimeInterval } from '../../util/time/interval';
import type { ChartAxisDirection } from '../chartAxisDirection';

export interface AxisLayout {
    id: string;
    rect: BBox;
    gridPadding: number;
    seriesAreaPadding: number;
    tickSize: number;
    label: {
        fractionDigits: number;
        padding: number;
        format?: string;
    };
    direction: ChartAxisDirection;
    domain: any[];
    scale: Scale<any, any, number | TimeInterval>;
}

export interface LayoutCompleteEvent {
    type: 'layout-complete';
    chart: { width: number; height: number };
    series: { rect: BBox; paddedRect: BBox; visible: boolean; shouldFlipXY?: boolean };
    clipSeries: boolean;
    axes?: AxisLayout[];
}

export interface LayoutState {
    axes?: AxisLayout[];
    clipSeries?: boolean;
    series: { visible: boolean; rect: BBox; paddedRect: BBox; shouldFlipXY?: boolean };
}

interface LayoutEventMap {
    'start-layout': LayoutContext;
    'before-series': LayoutContext;
    'layout-complete': LayoutCompleteEvent;
}

export class LayoutService extends EventEmitter<LayoutEventMap> {
    setLayout(width: number, height: number, state: LayoutState) {
        this.emit('layout-complete', {
            type: 'layout-complete',
            chart: { width, height },
            axes: state.axes ?? [],
            clipSeries: state.clipSeries ?? false,
            series: state.series,
        });
    }
}
