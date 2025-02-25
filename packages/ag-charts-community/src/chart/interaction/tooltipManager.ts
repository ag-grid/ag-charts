import type { DOMManager } from '../../dom/domManager';
import type { LocaleManager } from '../../locale/localeManager';
import type { BBoxValues } from '../../util/bboxinterface';
import { StateTracker } from '../../util/stateTracker';
import type { MouseWidgetEvent } from '../../widget/widgetEvents';
import type { SeriesTooltip } from '../series/seriesTooltip';
import type { ErrorBoundSeriesNodeDatum, ISeries, SeriesNodeDatum } from '../series/seriesTypes';
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

    private readonly destroyFns: Array<() => void> = [];

    public constructor(
        localeManager: LocaleManager,
        private readonly domManager: DOMManager,
        private readonly tooltip: Tooltip
    ) {
        this.destroyFns.push(
            tooltip.setup(localeManager, domManager),
            domManager.addListener('hidden', () => this.tooltip.hide())
        );
    }

    public destroy() {
        this.destroyFns.forEach((fn) => fn());
    }

    public updateTooltip(
        callerId: string,
        meta?: TooltipMeta,
        content?: TooltipContent[],
        pagination?: TooltipPaginationState
    ) {
        if (!this.tooltip.enabled) return;
        content ??= this.stateTracker.get(callerId)?.content;
        this.stateTracker.set(callerId, { meta, content, pagination });
        this.applyStates();
    }

    public removeTooltip(callerId: string) {
        if (!this.tooltip.enabled) return;
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

        if (this.appliedState?.content === state?.content) {
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
        datum: SeriesNodeDatum<unknown> & Pick<ErrorBoundSeriesNodeDatum, 'yBar'>,
        movedBounds: BBoxValues | undefined
    ): TooltipMeta {
        const { canvasX, canvasY } = event;
        const tooltip = series.properties.tooltip as SeriesTooltip<any>;
        const { placement, defaultPlacement, anchorTo, defaultAnchorTo, xOffset, yOffset } = tooltip.position;
        const meta: TooltipMeta = {
            canvasX,
            canvasY,
            enableInteraction: tooltip.interaction?.enabled ?? false,
            lastPointerEvent: { type: event.type, canvasX, canvasY },
            showArrow: tooltip.showArrow,
            position: {
                placement,
                defaultPlacement,
                anchorTo,
                defaultAnchorTo,
                xOffset,
                yOffset,
            },
        };

        const refPoint = getDatumRefPoint(series, datum, movedBounds);
        if (refPoint != null && (anchorTo ?? defaultAnchorTo) === 'node') {
            return { ...meta, canvasX: refPoint.canvasX, canvasY: refPoint.canvasY };
        }

        return meta;
    }

    public isEnteringInteractiveTooltip(event: MouseWidgetEvent<'mouseleave'>): boolean {
        const { tooltip } = this;
        const relatedTarget = event.sourceEvent.relatedTarget as Node | null;
        return tooltip.interactive && tooltip.enabled && tooltip.isVisible() && tooltip.contains(relatedTarget);
    }
}
