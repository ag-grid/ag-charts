import type { AxisID, EventListener } from 'ag-charts-core';
import type { AgScrollbarPlacement } from 'ag-charts-types';

import type { AxisLayout, EventsHub } from '../../core/eventsHub';
import { BBox } from '../../scene/bbox';

export interface LayoutContext {
    width: number;
    height: number;
    layoutBox: BBox;
    scrollbars: ScrollbarLayoutMap;
}

export interface ScrollbarLayout {
    enabled: boolean;
    thickness: number;
    spacing: number;
    placement: AgScrollbarPlacement;
}

export type ScrollbarLayoutMap = Partial<Record<AxisID, ScrollbarLayout>>;

export interface LayoutState {
    axes?: Record<string, AxisLayout>;
    clipSeries?: boolean;
    series: { rect: BBox; paddedRect: BBox; visible: boolean };
}

export enum LayoutElement {
    Caption,
    Legend,
    ToolbarLeft,
    ToolbarBottom,
    Scrollbar,
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
        const context: LayoutContext = { width, height, layoutBox: new BBox(0, 0, width, height), scrollbars: {} };
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

    emitLayoutComplete({ width, height }: LayoutContext, options: LayoutState) {
        this.eventsHub.emit('layout:complete', {
            axes: options.axes ?? {},
            chart: { width, height },
            clipSeries: options.clipSeries ?? false,
            series: options.series,
        });
    }
}
