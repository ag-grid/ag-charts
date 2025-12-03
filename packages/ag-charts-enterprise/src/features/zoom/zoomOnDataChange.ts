import { _ModuleSupport } from 'ag-charts-community';
import { BaseProperties, Logger, Property } from 'ag-charts-core';
import type { AxisID, CleanupRegistry, DeepRequired } from 'ag-charts-core';
import type { AgZoomOnDataChange, AgZoomOnDataChangeStrategy } from 'ag-charts-types';

import { definedZoomState } from './zoomUtils';

const { ChartAxisDirection } = _ModuleSupport;
type DefinedZoomState = _ModuleSupport.DefinedZoomState;
type ModuleContext = Pick<_ModuleSupport.ModuleContext, 'eventsHub' | 'zoomManager' | 'axisManager'>;
type ZoomChangeState = _ModuleSupport.ZoomChangeState;
type ZoomState = _ModuleSupport.ZoomState;
type ZoomStateDirection = _ModuleSupport.ZoomStateDirection;

// All axes scale-types can have their minimums & maximums represented as a number.
// * For category-scales, it's indices.
// * For time-scales, it's a timestamp.
// * For continuous-scales, it's already a number
// To keep the preserveDomain logic simple and axis-agnostic, we'll use that concept.
//
// * When data (unprocessed) is changed, we can interpolate the zoom.min and zoom.max ratios on these numeric scales to
//   keep track of which part of the domain is visible (`toVisibleMinMax`).
//
// * Later on, after the data is process (i.e. axes scales are updated), we can use the inverse function
//   `fromVisibleMinMax` to update the ratios such that same slice of the domain is visible.
//
type ScaleMinMax = { scaleMin: number; scaleMax: number };
type VisibleMinMax = { axisId: AxisID; visibleMin: number; visibleMax: number };

type DesiredDomains = {
    type: 'domain';
    domains: VisibleMinMax[];
};

type DesiredStickToEnd = {
    type: 'stickToEnd';
    axisId: AxisID;
    difference: number;
};

type DesiredChanges = DesiredDomains | DesiredStickToEnd;

function shouldIgnoreDataUpdate(zoom: DefinedZoomState): boolean {
    return zoom.x.min === 0 && zoom.x.max === 1 && zoom.y.min === 0 && zoom.y.max === 1;
}

function shouldStickToEnd(properties: ZoomOnDataChangeProperties, zoom: DefinedZoomState): boolean {
    return properties.stickToEnd && zoom.x.max === 1;
}

function toVisibleMinMax(axisId: AxisID, scaleMinMax: ScaleMinMax, ratios: ZoomState): VisibleMinMax {
    const { scaleMin, scaleMax } = scaleMinMax;
    const span = scaleMax - scaleMin;
    return {
        axisId,
        visibleMin: scaleMin + span * ratios.min,
        visibleMax: scaleMin + span * ratios.max,
    };
}

function fromVisibleMinMax(scaleMinMax: ScaleMinMax, visibleMinMax: VisibleMinMax): ZoomStateDirection {
    const { scaleMin, scaleMax } = scaleMinMax;
    const { visibleMin, visibleMax } = visibleMinMax;
    const span = scaleMax - scaleMin;
    return {
        direction: 'x',
        min: Math.max(0, (visibleMin - scaleMin) / span),
        max: Math.min(1, (visibleMax - scaleMin) / span),
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

    /**
     * Convert ambiguous axes-scale (number | Date | string) into a strictly numerical scale, so that we can use
     * interpolation to implement preserveDomain in an axes-scale agnostic way.
     */
    private computeScaleMinMax(axisId: AxisID): ScaleMinMax | undefined {
        const ctx = this.ctx.axisManager.getAxisIdContext(axisId);
        if (!ctx) return;

        const min: unknown = ctx.scale.domain.at(0);
        const max: unknown = ctx.scale.domain.at(-1);
        if (typeof min === 'number' && typeof max === 'number') {
            return { scaleMin: min, scaleMax: max };
        } else if (min instanceof Date && max instanceof Date) {
            return { scaleMin: min.getTime(), scaleMax: max.getTime() };
        } else {
            Logger.error(`Unexpected range types: start (${typeof min}), end (${typeof max})`);
        }
    }

    private popDesiredChanges(): ZoomChangeState | undefined {
        const { desiredChanges } = this;
        if (!desiredChanges) return;
        this.desiredChanges = undefined;

        switch (desiredChanges.type) {
            case 'domain': {
                const changes: { [K in AxisID]: Readonly<ZoomStateDirection> } = {};
                for (const entry of desiredChanges.domains) {
                    const scaleMinMax: ScaleMinMax | undefined = this.computeScaleMinMax(entry.axisId);
                    if (scaleMinMax) {
                        changes[entry.axisId] = fromVisibleMinMax(scaleMinMax, entry);
                    }
                }
                return changes;
            }
            case 'stickToEnd': {
                const { axisId, difference } = desiredChanges;
                const scaleMinMax: ScaleMinMax | undefined = this.computeScaleMinMax(axisId);
                if (scaleMinMax) {
                    const visibleMinMax: VisibleMinMax = {
                        axisId,
                        visibleMin: scaleMinMax.scaleMax - difference,
                        visibleMax: scaleMinMax.scaleMax,
                    };
                    return { [axisId]: fromVisibleMinMax(scaleMinMax, visibleMinMax) };
                }
                break;
            }
            default:
                const unreachable = (a: never): never => a;
                return unreachable(desiredChanges);
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
        this.desiredChanges = { type: 'domain', domains: [] };
        const xaxes = this.ctx.zoomManager.getAxes().filter((a) => a.direction === ChartAxisDirection.X);
        for (const { id: axisId } of xaxes) {
            const scaleMinMax: ScaleMinMax | undefined = this.computeScaleMinMax(axisId);
            if (scaleMinMax) {
                const ratios = this.ctx.zoomManager.getAxisZoom(axisId);
                const entry = toVisibleMinMax(axisId, scaleMinMax, ratios);
                this.desiredChanges.domains.push(entry);
            }
        }
    }

    private performStickToEnd(): void {
        const axisId = this.ctx.zoomManager.getPrimaryAxisId(ChartAxisDirection.X);
        if (!axisId) return;

        const scaleMinMax: ScaleMinMax | undefined = this.computeScaleMinMax(axisId);
        if (!scaleMinMax) return;

        const ratios: ZoomState = this.ctx.zoomManager.getAxisZoom(axisId);
        if (!ratios) return;

        const { visibleMin, visibleMax } = toVisibleMinMax(axisId, scaleMinMax, ratios);
        const difference = visibleMax - visibleMin;
        this.desiredChanges = { type: 'stickToEnd', axisId, difference };
    }
}
