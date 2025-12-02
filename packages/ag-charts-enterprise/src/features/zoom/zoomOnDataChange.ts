import { _ModuleSupport } from 'ag-charts-community';
import { BaseProperties, Logger, Property } from 'ag-charts-core';
import type { AxisID, CleanupRegistry, DeepRequired } from 'ag-charts-core';
import type { AgZoomOnDataChange, AgZoomOnDataChangeStrategy, AgZoomRange } from 'ag-charts-types';

import { definedZoomState } from './zoomUtils';

const { ChartAxisDirection } = _ModuleSupport;
type DefinedZoomState = _ModuleSupport.DefinedZoomState;
type ModuleContext = Pick<_ModuleSupport.ModuleContext, 'dataService' | 'eventsHub' | 'zoomManager'>;
type ZoomChangeState = _ModuleSupport.ZoomChangeState;
type ZoomStateDirection = _ModuleSupport.ZoomStateDirection;

type NoDesiredChanges = {
    ranges?: never;
    stickToEnd?: never;
};

type DesiredRanges = {
    ranges: { axisId: AxisID; range: AgZoomRange }[];
    stickToEnd?: never;
};

type DesiredStickToEnd = {
    ranges?: never;
    stickToEnd: { axisId: AxisID; difference: number; type: 'number' | 'date' };
};

type DesiredChanges = NoDesiredChanges | DesiredRanges | DesiredStickToEnd;

function shouldIgnoreDataUpdate(zoom: DefinedZoomState): boolean {
    return zoom.x.min === 0 && zoom.x.max === 1 && zoom.y.min === 0 && zoom.y.max === 1;
}

function shouldStickToEnd(properties: ZoomOnDataChangeProperties, zoom: DefinedZoomState): boolean {
    return properties.stickToEnd && zoom.x.max === 1;
}

// `chart.zoom.onDataChange` options
export class ZoomOnDataChangeProperties extends BaseProperties implements DeepRequired<AgZoomOnDataChange> {
    @Property
    // TODO(olegat): change default to 'preserveDomain'
    strategy: AgZoomOnDataChangeStrategy = 'preserveRatios';

    @Property
    // TODO(olegat): change default to 'true'
    stickToEnd: boolean = false;
}

export class ZoomOnDataChange {
    private readonly callerId = 'zoom-on-data-change';
    private desiredChanges?: DesiredChanges;

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

    private calculateNewStickToEndRange(
        axisId: AxisID,
        difference: number
    ): { start: number; end: number } | { start: Date; end: Date } | undefined {
        const end = this.ctx.zoomManager.getRange(axisId, { min: 0, max: 1 })?.end;
        if (end === undefined || typeof end === 'string') return;

        if (end instanceof Date) {
            return { start: new Date(end.getTime() - difference), end };
        } else {
            return { start: end - difference, end };
        }
    }

    private popDesiredChanges(): ZoomChangeState | undefined {
        const { desiredChanges = {} } = this;
        this.desiredChanges = undefined;

        if (desiredChanges.ranges) {
            const changes: { [K in AxisID]: Readonly<ZoomStateDirection> } = {};
            for (const entry of desiredChanges.ranges) {
                const ratio = this.ctx.zoomManager.rangeToRatio(entry.axisId, entry.range);
                if (ratio) {
                    const { min, max } = ratio;
                    changes[entry.axisId] = { direction: 'x', min, max };
                }
            }
            return changes;
        } else if (desiredChanges.stickToEnd) {
            const { axisId, difference } = desiredChanges.stickToEnd;
            const newRange = this.calculateNewStickToEndRange(axisId, difference);
            if (newRange == undefined) return;

            const newRatio = this.ctx.zoomManager.rangeToRatio(axisId, newRange);
            if (newRatio == undefined) return;

            const { min, max } = newRatio;
            return { [axisId]: { direction: 'x', min, max } };
        }
    }

    private performUpdateStrategy(): void {
        const zoom = definedZoomState(this.ctx.zoomManager.getZoom());

        if (shouldIgnoreDataUpdate(zoom)) {
            return;
        } else if (shouldStickToEnd(this.properties, zoom)) {
            return this.performStickToEnd();
        }

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

    private performPreserveDomain(): void {
        // Data has changes, remember the current domain for all X axes. We'll constrain the next zoom:change-request
        // event to these domain:
        this.desiredChanges = { ranges: [] };
        const xaxes = this.ctx.zoomManager.getAxes().filter((a) => a.direction === ChartAxisDirection.X);
        for (const { id: axisId } of xaxes) {
            const range = this.ctx.zoomManager.getCurrentRange(axisId);
            if (range) {
                this.desiredChanges.ranges.push({ axisId, range });
            }
        }
    }

    private performStickToEnd(): void {
        const axisId = this.ctx.zoomManager.getPrimaryAxisId(ChartAxisDirection.X);
        if (!axisId) return;

        const range = this.ctx.zoomManager.getCurrentRange(axisId);
        if (!range) return;
        const { start, end } = range;

        if (typeof end === 'number' && typeof start === 'number') {
            const difference = end - start;
            this.desiredChanges = { stickToEnd: { axisId, difference, type: 'number' } };
        } else if (end instanceof Date && start instanceof Date) {
            const difference = end.getTime() - start.getTime();
            this.desiredChanges = { stickToEnd: { axisId, difference, type: 'date' } };
        } else {
            Logger.error(`Unexpected range types: start (${typeof start}), end (${typeof end})`);
        }
    }
}
