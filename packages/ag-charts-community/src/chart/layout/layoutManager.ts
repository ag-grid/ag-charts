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
    'layout:complete': LayoutCompleteEvent;
}

export enum LayoutElement {
    Caption,
    Legend,
    Toolbar,
    Navigator,
    Overlay,
}

export class LayoutManager {
    private readonly events = new EventEmitter<EventMap>();
    private readonly elements = new Map<LayoutElement, Set<EventListener<LayoutContext>>>();

    addListener<K extends keyof EventMap>(eventName: K, listener: EventListener<EventMap[K]>) {
        return this.events.on(eventName, listener);
    }

    registerElement(element: LayoutElement, listener: EventListener<LayoutContext>) {
        if (this.elements.has(element)) {
            this.elements.get(element)!.add(listener);
        } else {
            this.elements.set(element, new Set([listener]));
        }
        return () => this.elements.get(element)?.delete(listener);
    }

    createContext(width: number, height: number): LayoutContext {
        const context = new LayoutContext(width, height);
        for (const element of Object.values(LayoutElement)) {
            if (typeof element !== 'number') continue;
            this.elements.get(element)?.forEach((listener) => listener(context));
        }
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
