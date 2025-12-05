import { _ModuleSupport } from 'ag-charts-community';
import type { AxisID, CleanupRegistry, DeepRequired } from 'ag-charts-core';
import { BaseProperties, ChartAxisDirection, Logger, Property, clamp } from 'ag-charts-core';
import type { AgZoomOnDataChange, AgZoomOnDataChangeStrategy } from 'ag-charts-types';

import { definedZoomState } from './zoomUtils';

const { userInteraction } = _ModuleSupport;

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
type DomainMinMax = { domainMin: number; domainMax: number };
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

function toVisibleMinMax(axisId: AxisID, domainMinMax: DomainMinMax, ratios: ZoomState): VisibleMinMax {
    const { domainMin, domainMax } = domainMinMax;
    const span = domainMax - domainMin;
    return {
        axisId,
        visibleMin: domainMin + span * ratios.min,
        visibleMax: domainMin + span * ratios.max,
    };
}

function fromVisibleMinMax(domainMinMax: DomainMinMax, visibleMinMax: VisibleMinMax): ZoomStateDirection {
    const { domainMin, domainMax } = domainMinMax;
    const { visibleMin, visibleMax } = visibleMinMax;
    const span = domainMax - domainMin;
    return {
        direction: 'x',
        min: clamp(0, (visibleMin - domainMin) / span, 1),
        max: clamp(0, (visibleMax - domainMin) / span, 1),
    };
}

// `chart.zoom.onDataChange` options
export class ZoomOnDataChangeProperties extends BaseProperties implements DeepRequired<AgZoomOnDataChange> {
    @Property
    strategy: AgZoomOnDataChangeStrategy = 'preserveDomain';

    @Property
    // TODO(olegat): change default to 'true'
    stickToEnd: boolean = false;
}

export class ZoomOnDataChange {
    private desiredChanges?: DesiredChanges;

    constructor(
        private readonly onConstrainChangesCallback: (e: _ModuleSupport.ZoomChangeRequestEvent) => void,
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
            this.onConstrainChangesCallback(e); // FIXME(AG-16414) remove this
        }
    }

    /**
     * Convert ambiguous axes-scale (number | Date | string) into a strictly numerical scale, so that we can use
     * interpolation to implement preserveDomain in an axes-scale agnostic way.
     */
    private computeDomainMinMax(axisId: AxisID): DomainMinMax | undefined {
        const ctx = this.ctx.axisManager.getAxisIdContext(axisId);
        if (!ctx?.continuous) return;

        const [min, max]: [unknown, unknown] = ctx.scale.getDomainMinMax();
        if (typeof min === 'number' && typeof max === 'number') {
            return { domainMin: min, domainMax: max };
        } else if (min instanceof Date && max instanceof Date) {
            return { domainMin: min.getTime(), domainMax: max.getTime() };
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
                    const domainMinMax: DomainMinMax | undefined = this.computeDomainMinMax(entry.axisId);
                    if (domainMinMax) {
                        changes[entry.axisId] = fromVisibleMinMax(domainMinMax, entry);
                    }
                }
                return changes;
            }
            case 'stickToEnd': {
                const { axisId, difference } = desiredChanges;
                const domainMinMax: DomainMinMax | undefined = this.computeDomainMinMax(axisId);
                if (domainMinMax) {
                    const visibleMinMax: VisibleMinMax = {
                        axisId,
                        visibleMin: domainMinMax.domainMax - difference,
                        visibleMax: domainMinMax.domainMax,
                    };
                    return { [axisId]: fromVisibleMinMax(domainMinMax, visibleMinMax) };
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
                return this.ctx.zoomManager.resetZoom(userInteraction('onDataChange-reset'));
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
            const domainMinMax: DomainMinMax | undefined = this.computeDomainMinMax(axisId);
            if (domainMinMax) {
                const ratios = this.ctx.zoomManager.getAxisZoom(axisId);
                const entry = toVisibleMinMax(axisId, domainMinMax, ratios);
                this.desiredChanges.domains.push(entry);
            }
        }
    }

    private performStickToEnd(): void {
        const axisId = this.ctx.zoomManager.getPrimaryAxisId(ChartAxisDirection.X);
        if (!axisId) return;

        const domainMinMax: DomainMinMax | undefined = this.computeDomainMinMax(axisId);
        if (!domainMinMax) return;

        const ratios: ZoomState = this.ctx.zoomManager.getAxisZoom(axisId);
        if (!ratios) return;

        const { visibleMin, visibleMax } = toVisibleMinMax(axisId, domainMinMax, ratios);
        const difference = visibleMax - visibleMin;
        this.desiredChanges = { type: 'stickToEnd', axisId, difference };
    }
}
