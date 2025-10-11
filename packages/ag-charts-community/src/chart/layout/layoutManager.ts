import type { EventListener } from 'ag-charts-core';

import type { AxisLayout, EventsHub } from '../../core/eventsHub';
import type { LayoutContext as ILayoutContext } from '../../module/baseModule';
import { BBox } from '../../scene/bbox';

export interface LayoutState {
    axes?: AxisLayout[];
    clipSeries?: boolean;
    series: { rect: BBox; paddedRect: BBox; visible: boolean };
}

export enum LayoutElement {
    Caption,
    Legend,
    ToolbarLeft,
    ToolbarBottom,
    Navigator,
    Overlay,
}

export class LayoutManager {
    private readonly elements = new Map<LayoutElement, Set<EventListener<LayoutContext>>>();

    constructor(private readonly eventsHub: EventsHub) {}

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
            const listeners = this.elements.get(element);
            if (listeners) {
                for (const listener of listeners) {
                    listener(context);
                }
            }
        }
        return context;
    }

    emitLayoutComplete(context: LayoutContext, options: LayoutState) {
        const { width, height } = context;
        this.eventsHub.emit('layout:complete', {
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
