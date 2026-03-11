import type { _ModuleSupport, _Widget } from 'ag-charts-community';
import { AbstractModuleInstance, ChartAxisDirection } from 'ag-charts-core';

import { ZoomWheelSequencer, type ZoomWheelSequencerCbResult } from './zoomWheelSequencer';

const processorPriority = ['zoom', 'scrollbar'] as const;

export class ZoomInteraction extends AbstractModuleInstance {
    private readonly wheelSequencer = new ZoomWheelSequencer();

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        this.cleanup.register(
            ctx.eventsHub.on('axis-dom-proxy:mouseenter', (event) => this.onAxisMouseEnter(event)),
            ctx.eventsHub.on('axis-dom-proxy:mouseleave', (event) => this.onAxisMouseLeave(event)),
            ctx.eventsHub.on('axis-dom-proxy:drag-start', (event) => this.onAxisDragStart(event)),
            ctx.eventsHub.on('axis-dom-proxy:drag-move', (event) => this.onAxisDragMove(event)),
            ctx.eventsHub.on('axis-dom-proxy:drag-end', (event) => this.onAxisDragEnd(event)),
            ctx.eventsHub.on('axis-dom-proxy:dblclick', (event) => this.onAxisDoubleClick(event)),
            ctx.eventsHub.on('axis-dom-proxy:wheel', (event) => this.onAxisWheel(event)),
            ctx.widgets.seriesWidget.addListener('wheel', (event) => this.onSeriesAreaWheel(event))
        );
    }

    private onAxisMouseEnter(event: _ModuleSupport.AxisDOMProxyMouseEnterEvent) {
        this.processEvent('axis-mouseenter', event);
    }

    private onAxisMouseLeave(event: _ModuleSupport.AxisDOMProxyMouseLeaveEvent) {
        this.processEvent('axis-mouseleave', event);
    }

    private onAxisDragStart(event: _ModuleSupport.AxisDOMProxyDragEvent<'drag-start'>) {
        this.processEvent('axis-drag-start', event);
    }

    private onAxisDragMove(event: _ModuleSupport.AxisDOMProxyDragEvent<'drag-move'>) {
        this.processEvent('axis-drag-move', event);
    }

    private onAxisDragEnd(event: _ModuleSupport.AxisDOMProxyDragEvent<'drag-end'>) {
        this.processEvent('axis-drag-end', event);
    }

    private onAxisDoubleClick(event: _ModuleSupport.AxisDOMProxyMouseEvent<'dblclick'>) {
        this.processEvent('axis-dblclick', event);
    }

    private onSeriesAreaWheel(event: _Widget.WheelWidgetEvent) {
        this.wheelSequencer.onWheel(event, () => this.handleWheelSequencer('wheel', { event }));
    }

    private onAxisWheel({ event, direction }: _ModuleSupport.AxisDOMProxyWheelEvent) {
        this.wheelSequencer.onWheel(event, () => this.handleWheelSequencer('axis-wheel', { event, direction }));
    }

    private handleWheelSequencer(
        subEvent: 'wheel' | 'axis-wheel',
        payload: { event: _Widget.WheelWidgetEvent; direction?: ChartAxisDirection }
    ) {
        let stopped = false;
        let wheelStatus: ZoomWheelSequencerCbResult = 'abort';

        // Handle the processors in priority order, stop processing when an event has been first handled.
        for (const processor of processorPriority) {
            const event: _ModuleSupport.ZoomInteractionWheelEvent | _ModuleSupport.ZoomInteractionAxisWheelEvent = {
                ...payload,
                abort() {
                    wheelStatus = 'abort';
                },
                capped() {
                    wheelStatus = 'capped';
                },
                uncapped() {
                    wheelStatus = 'uncapped';
                },
                stopProcessing() {
                    stopped = true;
                },
            };
            this.ctx.eventsHub.emit(`zoom-interaction:${processor}:${subEvent}`, event);

            if (stopped) {
                return wheelStatus;
            }
        }

        return 'abort';
    }

    private processEvent(
        subEvent:
            | 'axis-drag-start'
            | 'axis-drag-move'
            | 'axis-drag-end'
            | 'axis-dblclick'
            | 'axis-mouseenter'
            | 'axis-mouseleave',
        payload: any
    ) {
        let stopped = false;

        // Handle the processors in priority order, stop processing when an event has been first handled.
        for (const processor of processorPriority) {
            const chainedEvent: any = {
                ...payload,
                stopProcessing() {
                    stopped = true;
                },
            };
            this.ctx.eventsHub.emit(`zoom-interaction:${processor}:${subEvent}`, chainedEvent);

            if (stopped) return;
        }
    }
}
