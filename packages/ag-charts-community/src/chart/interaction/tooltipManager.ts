import { type BoxBounds, CleanupRegistry, objectsEqual } from 'ag-charts-core';

import type { EventsHub } from '../../core/eventsHub';
import type { DOMManager } from '../../dom/domManager';
import type { LocaleManager } from '../../locale/localeManager';
import { StateTracker } from '../../util/stateTracker';
import type { SeriesTooltip } from '../series/seriesTooltip';
import type { DatumIndexType, ErrorBoundSeriesNodeDatum, ISeries, SeriesNodeDatum } from '../series/seriesTypes';
import { getDatumRefPoint } from '../series/util';
import type {
    Tooltip,
    TooltipContent,
    TooltipMeta,
    TooltipPaginationState,
    TooltipPointerEvent,
} from '../tooltip/tooltip';

interface TooltipState {
    content: TooltipContent[] | undefined;
    meta: TooltipMeta | undefined;
    pagination: TooltipPaginationState | undefined;
}

/**
 * Manages the tooltip HTML an element. Tracks the requested HTML from distinct dependents and
 * handles conflicting tooltip requests.
 */
export class TooltipManager {
    private readonly stateTracker = new StateTracker<TooltipState>();
    private readonly suppressState = new StateTracker(false);
    private appliedState: TooltipState | null = null;

    private readonly cleanup = new CleanupRegistry();

    public constructor(
        eventsHub: EventsHub,
        localeManager: LocaleManager,
        private readonly domManager: DOMManager,
        private readonly tooltip: Tooltip
    ) {
        this.cleanup.register(
            tooltip.setup(localeManager, domManager),
            eventsHub.on('dom:hidden', () => this.tooltip.hide())
        );
    }

    public destroy() {
        this.cleanup.flush();
    }

    public updateTooltip(
        callerId: string,
        meta?: TooltipMeta,
        content?: TooltipContent[],
        pagination?: TooltipPaginationState
    ) {
        content ??= this.stateTracker.get(callerId)?.content;
        this.stateTracker.set(callerId, { meta, content, pagination });
        this.applyStates();
    }

    public removeTooltip(callerId: string) {
        this.stateTracker.delete(callerId);
        this.applyStates();
    }

    public suppressTooltip(callerId: string) {
        this.suppressState.set(callerId, true);
    }

    public unsuppressTooltip(callerId: string) {
        this.suppressState.delete(callerId);
    }

    private applyStates() {
        const id = this.stateTracker.stateId();
        const state = id ? this.stateTracker.get(id) : undefined;

        if (this.suppressState.stateValue() || state?.meta == null || state?.content == null) {
            this.appliedState = null;
            this.tooltip.hide();
            return;
        }

        const canvasRect = this.domManager.getBoundingClientRect();
        const boundingRect = this.tooltip.bounds === 'extended' ? this.domManager.getOverlayClientRect() : canvasRect;

        if (
            objectsEqual(this.appliedState?.content, state?.content) &&
            objectsEqual(this.appliedState?.pagination, state?.pagination)
        ) {
            const renderInstantly = this.tooltip.isVisible();
            this.tooltip.show(boundingRect, canvasRect, state?.meta, null, undefined, renderInstantly);
        } else {
            this.tooltip.show(boundingRect, canvasRect, state?.meta, state?.content, state?.pagination);
        }

        this.appliedState = state;
    }

    public static makeTooltipMeta(
        event: TooltipPointerEvent,
        series: ISeries<any, any, any>,
        datum: SeriesNodeDatum<DatumIndexType> & Pick<ErrorBoundSeriesNodeDatum, 'yBar'>,
        movedBounds: BoxBounds | undefined
    ): TooltipMeta {
        const { canvasX, canvasY } = event;
        const tooltip = series.properties.tooltip as SeriesTooltip<any>;
        const { placement, anchorTo, xOffset, yOffset } = tooltip.position;
        const refPoint = getDatumRefPoint(series, datum, movedBounds);
        const meta: TooltipMeta = {
            canvasX,
            canvasY,
            nodeCanvasX: refPoint?.canvasX ?? canvasX,
            nodeCanvasY: refPoint?.canvasY ?? canvasY,
            enableInteraction: tooltip.interaction?.enabled ?? false,
            showArrow: tooltip.showArrow,
            position: {
                placement,
                anchorTo,
                xOffset,
                yOffset,
            },
        };

        return meta;
    }
}
