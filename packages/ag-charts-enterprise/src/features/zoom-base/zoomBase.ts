import type { _ModuleSupport, _Widget } from 'ag-charts-community';
import { AbstractModuleInstance, ChartAxisDirection } from 'ag-charts-core';

import { ZoomWheelSequencer, type ZoomWheelSequencerCbResult } from './zoomWheelSequencer';

export type ZoomBaseRequestAxisWheelEvent = _ModuleSupport.ZoomBaseRequestAxisWheelEvent<
    _Widget.WheelWidgetEvent,
    ChartAxisDirection
>;
export type ZoomBaseWheelEvent = _ModuleSupport.ZoomBaseWheelEvent<_Widget.WheelWidgetEvent>;
export type ZoomBaseAxisWheelEvent = _ModuleSupport.ZoomBaseAxisWheelEvent<
    _Widget.WheelWidgetEvent,
    ChartAxisDirection
>;

const processorPriority = ['zoom', 'scrollbar'] as const;

export class ZoomBase extends AbstractModuleInstance {
    private readonly wheelSequencer = new ZoomWheelSequencer();

    constructor(readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        this.cleanup.register(
            ctx.widgets.seriesWidget.addListener('wheel', (event) => this.onWheel(event)),
            ctx.eventsHub.on('zoom-base:request-axis-wheel', (event) => this.onRequestAxisWheel(event))
        );
    }

    private onWheel(event: _Widget.WheelWidgetEvent) {
        this.wheelSequencer.onWheel(event, () => this.handleWheelSequencer('wheel', { event }));
    }

    private onRequestAxisWheel({ event, direction }: ZoomBaseRequestAxisWheelEvent) {
        this.wheelSequencer.onWheel(event, () => this.handleWheelSequencer('axis-wheel', { event, direction }));
    }

    private handleWheelSequencer(
        subEvent: 'wheel',
        packet: { event: _Widget.WheelWidgetEvent }
    ): ZoomWheelSequencerCbResult;
    private handleWheelSequencer(
        subEvent: 'axis-wheel',
        packet: { event: _Widget.WheelWidgetEvent; direction: ChartAxisDirection }
    ): ZoomWheelSequencerCbResult;
    private handleWheelSequencer(
        subEvent: 'wheel' | 'axis-wheel',
        packet: { event: _Widget.WheelWidgetEvent; direction?: ChartAxisDirection }
    ) {
        let stopped = false;
        let wheelStatus: ZoomWheelSequencerCbResult = 'abort';

        // Handle the processors in priority order, stop processing when an event has been first handled.
        for (const processor of processorPriority) {
            const event: ZoomBaseWheelEvent | ZoomBaseAxisWheelEvent = {
                ...packet,
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
            this.ctx.eventsHub.emit(`zoom-base:${processor}:${subEvent}`, event);

            if (stopped) {
                return wheelStatus;
            }
        }

        return 'abort';
    }
}
