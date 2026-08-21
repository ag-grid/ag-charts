import { _ModuleSupport } from 'ag-charts-community';
import type {
    AxisID,
    CleanupRegistry,
    DefinedZoomState,
    NormalisedZoomOnDataChange,
    ZoomMinMax,
    ZoomMinMaxDirection,
} from 'ag-charts-core';
import { ChartAxisDirection, clamp, definedZoomState, isNumericValue, toNumber } from 'ag-charts-core';

const { userInteraction } = _ModuleSupport;

type ZoomChangeState = _ModuleSupport.ZoomChangeState;

// Every scale type can express its domain bounds as a number (category: indices, time: timestamps), so
// preserveDomain interpolates ratios in that space: `toVisibleMinMax` on data change, `fromVisibleMinMax` after.
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

function shouldStickToEnd(opts: NormalisedZoomOnDataChange, zoom: DefinedZoomState): boolean {
    return opts.stickToEnd && zoom.x.max === 1;
}

function toVisibleMinMax(axisId: AxisID, domainMinMax: DomainMinMax, ratios: ZoomMinMax): VisibleMinMax {
    const { domainMin, domainMax } = domainMinMax;
    const span = domainMax - domainMin;
    return {
        axisId,
        visibleMin: domainMin + span * ratios.min,
        visibleMax: domainMin + span * ratios.max,
    };
}

function fromVisibleMinMax(domainMinMax: DomainMinMax, visibleMinMax: VisibleMinMax): ZoomMinMaxDirection {
    const { domainMin, domainMax } = domainMinMax;
    const { visibleMin, visibleMax } = visibleMinMax;
    const span = domainMax - domainMin;
    return {
        direction: 'x',
        min: clamp(0, (visibleMin - domainMin) / span, 1),
        max: clamp(0, (visibleMax - domainMin) / span, 1),
    };
}

export interface ZoomOnDataChangeCtx extends Pick<
    _ModuleSupport.ChartRegistry,
    'chartState' | 'eventsHub' | 'axisManager' | 'logger'
> {
    // `zoomManager` is optional on _ModuleSupport.ChartRegistry, but ZoomOnDataChange is only ever
    // instantiated by the zoom module, which guarantees its presence. Narrow once at
    // the boundary so consumers don't need `!` assertions at every call site.
    readonly zoomManager: _ModuleSupport.ZoomManager;
    readonly cleanup: CleanupRegistry;
    readonly onConstrainChanges: (e: _ModuleSupport.ZoomChangeRequestEvent) => void;
    // Reactive option access delegated from parent via getter property.
    readonly opts: NormalisedZoomOnDataChange;
}

export class ZoomOnDataChange {
    private desiredChanges?: DesiredChanges;

    constructor(private readonly ctx: ZoomOnDataChangeCtx) {
        // The first data:update fires before the axis scales are initialised, so preserveDomain would read an
        // uninitialised domain; only data changes matter here, so listen only after the first layout:complete.
        const { eventsHub, cleanup } = ctx;
        const onFirstDraw = () => {
            eventsHub.off('layout:complete', onFirstDraw);
            cleanup.register(
                eventsHub.on('data:load', (e) => this.onDataLoad(e)),
                eventsHub.on('data:update', (e) => this.onDataUpdate(e))
            );
        };
        cleanup.register(
            eventsHub.on('layout:complete', onFirstDraw),
            eventsHub.on('zoom:change-request', (e) => this.onZoomChangeRequest(e))
        );
    }

    private onDataLoad(_e: _ModuleSupport.EventsHubMap['data:load']): void {
        this.performUpdateStrategy();
    }

    private onDataUpdate(_e: _ModuleSupport.EventsHubMap['data:update']): void {
        this.performUpdateStrategy();
    }

    private onZoomChangeRequest(e: _ModuleSupport.ZoomChangeRequestEvent): void {
        if (e.sourceDetail === 'internal-requiredWidth') {
            this.desiredChanges = undefined;
        }
        const changes = this.popDesiredChanges();
        if (changes) {
            e.constrainChanges(changes);
            this.ctx.onConstrainChanges(e); // FIXME: remove this
        }
    }

    /**
     * Convert ambiguous axes-scale (number | Date | string) into a strictly numerical scale, so that we can use
     * interpolation to implement preserveDomain in an axes-scale agnostic way.
     */
    private computeDomainMinMax(axisId: AxisID): DomainMinMax | undefined {
        const ctx = this.ctx.axisManager.getAxisIdContext(axisId);
        if (!ctx?.continuous || ctx.scale.domain.length === 0) return;

        const [min, max]: [unknown, unknown] = ctx.scale.getDomainMinMax();
        let domainMinMax: DomainMinMax | undefined;
        if (isNumericValue(min) && isNumericValue(max)) {
            // The interpolation below is ratio maths in Number space; sub-ULP bigint precision is not needed.
            domainMinMax = { domainMin: toNumber(min), domainMax: toNumber(max) };
        } else if (min instanceof Date && max instanceof Date) {
            domainMinMax = { domainMin: min.getTime(), domainMax: max.getTime() };
        } else {
            this.ctx.logger.error(`Unexpected range types: start (${typeof min}), end (${typeof max})`);
            return;
        }

        // A zero-span (collapsed) domain would make the ratio interpolation divide by zero → NaN zoom.
        const span = domainMinMax.domainMax - domainMinMax.domainMin;
        if (!Number.isFinite(span) || span === 0) return;

        return domainMinMax;
    }

    private popDesiredChanges(): ZoomChangeState | undefined {
        const { desiredChanges } = this;
        if (!desiredChanges) return;
        this.desiredChanges = undefined;

        switch (desiredChanges.type) {
            case 'domain': {
                const changes: { [K in AxisID]: Readonly<ZoomMinMaxDirection> } = {};
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
        const zoom = definedZoomState(this.ctx.chartState.getValue('zoom'));

        if (shouldIgnoreDataUpdate(zoom)) {
            return;
        } else if (shouldStickToEnd(this.ctx.opts, zoom)) {
            return this.performStickToEnd();
        }

        const { strategy } = this.ctx.opts;
        switch (strategy) {
            case 'reset':
                return this.ctx.zoomManager.resetZoom(userInteraction('onDataChange-reset'));
            case 'preserveRatios':
                return; // do nothing (keep ZoomManager min/max ratios unchanged).
            case 'preserveDomain':
                return this.performPreserveDomain();
            default:
                const unreachable = (a: never): never => a;
                return unreachable(strategy);
        }
    }

    private performPreserveDomain(): void {
        // Data has changes, remember the current domain for all X axes. We'll constrain the next zoom:change-request
        // event to these domain:
        this.desiredChanges = { type: 'domain', domains: [] };
        const xaxes = this.ctx.zoomManager.getAxes().filter((a) => a.direction === ChartAxisDirection.X);
        for (const { id: axisId } of xaxes) {
            const ratios = this.ctx.zoomManager.getAxisZoom(axisId);
            // Skip fully zoomed-out axes — avoids snapshotting a placeholder [0,1] domain on a
            // freshly-recreated axis and collapsing the zoom when re-interpolated against the real domain.
            if (ratios.min === 0 && ratios.max === 1) continue;
            const domainMinMax: DomainMinMax | undefined = this.computeDomainMinMax(axisId);
            if (domainMinMax) {
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

        const ratios = this.ctx.zoomManager.getAxisZoom(axisId);
        const { visibleMin, visibleMax } = toVisibleMinMax(axisId, domainMinMax, ratios);
        const difference = visibleMax - visibleMin;
        this.desiredChanges = { type: 'stickToEnd', axisId, difference };
    }
}
