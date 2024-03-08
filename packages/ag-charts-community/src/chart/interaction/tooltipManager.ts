import type { BBox } from '../../scene/bbox';
import { StateTracker } from '../../util/stateTracker';
import type { ErrorBoundSeriesNodeDatum, SeriesNodeDatum } from '../series/seriesTypes';
import type { Tooltip, TooltipMeta } from '../tooltip/tooltip';
import type { InteractionEvent, InteractionManager, PointerOffsets } from './interactionManager';

interface TooltipState {
    content?: string;
    meta?: TooltipMeta;
}

/**
 * Manages the tooltip HTML an element. Tracks the requested HTML from distinct dependents and
 * handles conflicting tooltip requests.
 */
export class TooltipManager {
    private readonly stateTracker = new StateTracker<TooltipState>();
    private readonly exclusiveAreas = new Map<string, BBox>();
    private appliedState: TooltipState | null = null;
    private appliedExclusiveAreaId?: string;
    private destroyFns: (() => void)[] = [];

    public constructor(
        private readonly tooltip: Tooltip,
        interactionManager: InteractionManager
    ) {
        this.destroyFns.push(interactionManager.addListener('hover', (e) => this.checkExclusiveRects(e)));
    }

    public updateTooltip(callerId: string, meta?: TooltipMeta, content?: string) {
        if (!this.tooltip.enabled) return;
        content ??= this.stateTracker.get(callerId)?.content;
        this.stateTracker.set(callerId, { content, meta });
        this.applyStates();
    }

    public updateExclusiveRect(callerId: string, area?: BBox) {
        if (area) {
            this.exclusiveAreas.set(callerId, area);
        } else {
            this.exclusiveAreas.delete(callerId);
        }
    }

    public removeTooltip(callerId: string) {
        if (!this.tooltip.enabled) return;
        this.stateTracker.delete(callerId);
        this.applyStates();
    }

    public getTooltipMeta(callerId: string): TooltipMeta | undefined {
        return this.stateTracker.get(callerId)?.meta;
    }

    public destroy() {
        for (const destroyFn of this.destroyFns) {
            destroyFn();
        }
    }

    private checkExclusiveRects(e: InteractionEvent<'hover'>): void {
        for (const [areaId, area] of this.exclusiveAreas) {
            if (area.containsPoint(e.offsetX, e.offsetY) && this.appliedExclusiveAreaId !== areaId) {
                this.appliedExclusiveAreaId = areaId;
                this.applyStates();
            }
        }
    }

    private applyStates() {
        const id = this.appliedExclusiveAreaId ?? this.stateTracker.stateId();
        const state = id ? this.stateTracker.get(id) : null;

        if (state?.meta == null || state?.content == null) {
            this.appliedState = null;
            this.tooltip.toggle(false);
            return;
        }

        if (this.appliedState?.content === state?.content) {
            const renderInstantly = this.tooltip.isVisible();
            this.tooltip.show(state?.meta, null, renderInstantly);
        } else {
            this.tooltip.show(state?.meta, state?.content);
        }

        this.appliedState = state;
    }

    public static makeTooltipMeta(
        event: PointerOffsets,
        datum: SeriesNodeDatum & Pick<ErrorBoundSeriesNodeDatum, 'yBar'>
    ): TooltipMeta {
        const { offsetX, offsetY } = event;
        const { tooltip } = datum.series.properties;
        const meta: TooltipMeta = {
            offsetX,
            offsetY,
            enableInteraction: tooltip.interaction?.enabled ?? false,
            lastPointerEvent: { offsetX, offsetY },
            showArrow: tooltip.showArrow,
            position: {
                type: tooltip.position.type,
                xOffset: tooltip.position.xOffset,
                yOffset: tooltip.position.yOffset,
            },
        };

        // On `line` and `scatter` series, the tooltip covers the top of error-bars when using datum.midPoint.
        // Using datum.yBar.upperPoint renders the tooltip higher up.
        const refPoint = datum.yBar?.upperPoint ?? datum.midPoint;

        if (tooltip.position.type === 'node' && refPoint) {
            const { x, y } = refPoint;
            const point = datum.series.contentGroup.inverseTransformPoint(x, y);
            return {
                ...meta,
                offsetX: Math.round(point.x),
                offsetY: Math.round(point.y),
            };
        }

        return meta;
    }
}
