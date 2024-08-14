import type { LayoutContext as ILayoutContext } from '../../module/baseModule';
import type { Scale } from '../../scale/scale';
import { BBox } from '../../scene/bbox';
import { EventEmitter, type EventListener } from '../../util/eventEmitter';
import type { TimeInterval } from '../../util/time';
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
    type: 'layout:complete';
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

interface EventMap {
    'layout:start': LayoutContext;
    'layout:complete': LayoutCompleteEvent;
}

export class LayoutService {
    private readonly events = new EventEmitter<EventMap>();

    addListener<K extends keyof EventMap>(eventName: K, listener: EventListener<EventMap[K]>) {
        return this.events.on(eventName, listener);
    }

    createContext(width: number, height: number): LayoutContext {
        const context = new LayoutContext(width, height);
        this.events.emit('layout:start', context);
        return context;
    }

    emitLayoutComplete(context: LayoutContext, options: LayoutState) {
        const eventType = 'layout:complete';
        const { width, height } = context;
        this.events.emit(eventType, {
            type: eventType,
            axes: options.axes ?? [],
            chart: { width, height },
            clipSeries: options.clipSeries ?? false,
            series: options.series,
        });
    }
}

class LayoutContext implements ILayoutContext {
    readonly layoutBox: BBox;

    constructor(
        public readonly width: number,
        public readonly height: number
    ) {
        this.layoutBox = new BBox(0, 0, width, height);
    }
}
