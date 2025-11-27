import { _ModuleSupport } from 'ag-charts-community';
import { BaseProperties, Logger, Property } from 'ag-charts-core';
import type { AxisID, CleanupRegistry, DeepRequired } from 'ag-charts-core';
import type { AgZoomOnDataChange, AgZoomOnDataChangeStrategy, AgZoomRange } from 'ag-charts-types';

const { ChartAxisDirection } = _ModuleSupport;
type ModuleContext = Pick<_ModuleSupport.ModuleContext, 'dataService' | 'eventsHub' | 'zoomManager'>;
type ZoomChangeState = _ModuleSupport.ZoomChangeState;
type ZoomStateDirection = _ModuleSupport.ZoomStateDirection;

// `chart.zoom.onDataChange` options
export class ZoomOnDataChangeProperties extends BaseProperties implements DeepRequired<AgZoomOnDataChange> {
    @Property
    // TODO(olegat): change default to 'preserveDomain'
    strategy: AgZoomOnDataChangeStrategy = 'preserveRatios';
}

export class ZoomOnDataChange {
    private readonly callerId = 'zoom-on-data-change';
    private desiredRanges?: { axisId: AxisID; range: AgZoomRange }[];

    constructor(
        private readonly properties: ZoomOnDataChangeProperties,
        private readonly ctx: ModuleContext,
        eventsCleanup: CleanupRegistry
    ) {
        // When calling `AgCharts.create`, the data:update event is emitted before the axes ranges/scales are fully
        // initialised. This causes the 'preserveData' strategy to read an uninitialised (and incorrect) domain, and
        // this uninitialised domain therefore incorrectly constrains the initial zoom:change-request event.
        // Fortunately, the ZoomOnDataChange class only needs to worry about data changes, not data initialisation.
        // Therefore, we'll wait for the initial layout:complete event to be emitted before starting to listen for
        // data:update events.
        const onFirstDraw = () => {
            ctx.eventsHub.off('layout:complete', onFirstDraw);
            eventsCleanup.register(
                ctx.eventsHub.on('data:load', (e) => this.onDataLoad(e)),
                ctx.eventsHub.on('data:update', (e) => this.onDataUpdate(e))
            );
        };
        eventsCleanup.register(
            ctx.eventsHub.on('layout:complete', onFirstDraw),
            ctx.eventsHub.on('zoom:change-request', (e) => this.onZoomChangeRequest(e))
        );
    }

    destroy(): void {}

    private onDataLoad(_e: _ModuleSupport.EventsHubMap['data:load']): void {
        this.performUpdateStrategy();
    }

    private onDataUpdate(_e: _ModuleSupport.EventsHubMap['data:update']): void {
        this.performUpdateStrategy();
    }

    private onZoomChangeRequest(e: _ModuleSupport.ZoomChangeRequestEvent): void {
        const changes = this.popDesiredChanges();
        if (changes) {
            e.constrainChanges(changes);
        }
    }

    private popDesiredChanges(): ZoomChangeState | undefined {
        const { desiredRanges } = this;
        this.desiredRanges = undefined;

        if (desiredRanges) {
            const changes: { [K in AxisID]: Readonly<ZoomStateDirection> } = {};
            for (const entry of desiredRanges) {
                const ratio = this.ctx.zoomManager.rangeToRatio(entry.axisId, entry.range);
                if (ratio) {
                    const { min, max } = ratio;
                    changes[entry.axisId] = { direction: 'x', min, max };
                }
            }
            return changes;
        }
    }

    private performUpdateStrategy() {
        switch (this.properties.strategy) {
            case 'reset':
                return this.ctx.zoomManager.resetZoom(this.callerId);
            case 'preserveRatios':
                return; // do nothing (keep ZoomManager min/max ratios unchanged).
            case 'preserveDomain':
                return this.performPreserveDomain();
            case 'preserveData':
                return Logger.error(`unimplemented strategy: ${this.properties.strategy}`);
            default:
                const unreachable = (a: never): never => a;
                return unreachable(this.properties.strategy);
        }
    }

    private performPreserveDomain() {
        // Data has changes, remember the current domain for all X axes. We'll constrain the next zoom:change-request
        // event to these domain:
        this.desiredRanges = [];
        const xaxes = this.ctx.zoomManager.getAxes().filter((a) => a.direction === ChartAxisDirection.X);
        for (const { id: axisId } of xaxes) {
            const range = this.ctx.zoomManager.getCurrentRange(axisId);
            if (range) {
                this.desiredRanges.push({ axisId, range });
            }
        }
    }
}
