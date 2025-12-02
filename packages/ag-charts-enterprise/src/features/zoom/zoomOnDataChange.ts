import { _ModuleSupport } from 'ag-charts-community';
import { BaseProperties, Logger, Property } from 'ag-charts-core';
import type { AxisID, CleanupRegistry, DeepRequired } from 'ag-charts-core';
import type { AgZoomOnDataChange, AgZoomOnDataChangeStrategy, AgZoomRange } from 'ag-charts-types';

import { definedZoomState } from './zoomUtils';

const { ChartAxisDirection } = _ModuleSupport;
type DefinedZoomState = _ModuleSupport.DefinedZoomState;
type ModuleContext = Pick<_ModuleSupport.ModuleContext, 'eventsHub' | 'zoomManager' | 'axisManager'>;
type ZoomChangeState = _ModuleSupport.ZoomChangeState;
type ZoomState = _ModuleSupport.ZoomState;
type ZoomStateDirection = _ModuleSupport.ZoomStateDirection;

type DateMinMax = { min: Date; max: Date };
type DateVisibleMinMax = { visibleMin: Date; visibleMax: Date };

type NoDesiredChanges = {
    domain?: never;
    stickToEnd?: never;
};

type DesiredDomains = {
    domain: (
        | { axisId: AxisID; range: AgZoomRange; dates?: never }
        | { axisId: AxisID; range?: never; dates: DateVisibleMinMax }
    )[];
    stickToEnd?: never;
};

type DesiredStickToEnd = {
    domain?: never;
    stickToEnd: { axisId: AxisID; difference: number; type: 'number' | 'date' };
};

type DesiredChanges = NoDesiredChanges | DesiredDomains | DesiredStickToEnd;

function shouldIgnoreDataUpdate(zoom: DefinedZoomState): boolean {
    return zoom.x.min === 0 && zoom.x.max === 1 && zoom.y.min === 0 && zoom.y.max === 1;
}

function shouldStickToEnd(properties: ZoomOnDataChangeProperties, zoom: DefinedZoomState): boolean {
    return properties.stickToEnd && zoom.x.max === 1;
}

function getDateMinMax(axisManager: ModuleContext['axisManager'], axisId: AxisID): DateMinMax | undefined {
    const ctx = axisManager.getAxisIdContext(axisId);
    if (!ctx) return;

    if (_ModuleSupport.OrdinalTimeScale.is(ctx.scale)) {
        const min = ctx.scale.bands[0];
        const max = ctx.scale.bands.at(-1);
        if (max) {
            return { min, max };
        }
    }
}

function toDateVisibleMinMax(dates: DateMinMax, ratios: ZoomState): DateVisibleMinMax {
    const tmin = dates.min.getTime();
    const tmax = dates.max.getTime();
    const span = tmax - tmin;
    const visibleMin = new Date(tmin + span * ratios.min);
    const visibleMax = new Date(tmin + span * ratios.max);
    return { visibleMin, visibleMax };
}

function fromDateVisibleMinMax(dates: DateMinMax, visibleDates: DateVisibleMinMax): ZoomState {
    const tmin = dates.min.getTime();
    const tmax = dates.max.getTime();
    const span = tmax - tmin;
    return {
        min: (visibleDates.visibleMin.getTime() - tmin) / span,
        max: (visibleDates.visibleMax.getTime() - tmin) / span
    };
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
        // initialised. This causes the 'preserveDomain' strategy to read an uninitialised (and incorrect) domain, and
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

    private rangeToRatio(axisId: AxisID, range: AgZoomRange): ZoomState | undefined {
        return this.ctx.zoomManager.rangeToRatio(axisId, range, { clampRanges: true });
    }

    private popDesiredChanges(): ZoomChangeState | undefined {
        const { desiredChanges = {} } = this;
        this.desiredChanges = undefined;

        if (desiredChanges.domain) {
            const changes: { [K in AxisID]: Readonly<ZoomStateDirection> } = {};
            for (const entry of desiredChanges.domain) {
                if (entry.range) {
                    const ratio = this.rangeToRatio(entry.axisId, entry.range);
                    if (ratio) {
                        const { min, max } = ratio;
                        changes[entry.axisId] = { direction: 'x', min, max };
                    }
                } else if (entry.dates) {
                    const dateMinMax = getDateMinMax(this.ctx.axisManager, entry.axisId);
                    if (dateMinMax){
                        const ratio = fromDateVisibleMinMax(dateMinMax, entry.dates);
                        const { min, max } = ratio;
                        changes[entry.axisId] = { direction: 'x', min, max };
                    }
                }
            }
            return changes;
        } else if (desiredChanges.stickToEnd) {
            const { axisId, difference } = desiredChanges.stickToEnd;
            const newRange = this.calculateNewStickToEndRange(axisId, difference);
            if (newRange == undefined) return;

            const newRatio = this.rangeToRatio(axisId, newRange);
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
            default:
                const unreachable = (a: never): never => a;
                return unreachable(this.properties.strategy);
        }
    }

    private performPreserveDomain(): void {
        // Data has changes, remember the current domain for all X axes. We'll constrain the next zoom:change-request
        // event to these domain:
        this.desiredChanges = { domain: [] };
        const xaxes = this.ctx.zoomManager.getAxes().filter((a) => a.direction === ChartAxisDirection.X);
        for (const { id: axisId } of xaxes) {
            const dateMinMax = getDateMinMax(this.ctx.axisManager, axisId);

            if (dateMinMax) {
                const ratios = this.ctx.zoomManager.getAxisZoom(axisId);
                const dates = toDateVisibleMinMax(dateMinMax, ratios);
                this.desiredChanges.domain.push({ axisId, dates });
            } else {
                const range = this.ctx.zoomManager.getCurrentRange(axisId);
                if (range) {
                    this.desiredChanges.domain.push({ axisId, range });
                }
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
