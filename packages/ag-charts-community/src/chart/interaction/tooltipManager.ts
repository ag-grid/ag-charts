import { injectStyle } from '../../util/dom';
import { StateTracker } from '../../util/stateTracker';
import type { ErrorBoundSeriesNodeDatum, SeriesNodeDatum } from '../series/seriesTypes';
import type { Tooltip, TooltipMeta } from '../tooltip/tooltip';
import { DEFAULT_TOOLTIP_CLASS, TooltipPointerEvent } from '../tooltip/tooltip';

interface TooltipState {
    content?: string;
    meta?: TooltipMeta;
}

const defaultTooltipCss = `
.${DEFAULT_TOOLTIP_CLASS} {
    transition: transform 0.1s ease;
    max-width: 100%;
    position: fixed;
    left: 0px;
    top: 0px;
    z-index: 99999;
    font: 12px Verdana, sans-serif;
    color: rgb(70, 70, 70);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
}

.${DEFAULT_TOOLTIP_CLASS}-wrap-always {
    overflow-wrap: break-word;
    word-break: break-word;
    hyphens: none;
}

.${DEFAULT_TOOLTIP_CLASS}-wrap-hyphenate {
    overflow-wrap: break-word;
    word-break: break-word;
    hyphens: auto;
}

.${DEFAULT_TOOLTIP_CLASS}-wrap-on-space {
    overflow-wrap: normal;
    word-break: normal;
}

.${DEFAULT_TOOLTIP_CLASS}-wrap-never {
    white-space: pre;
    text-overflow: ellipsis;
}

.${DEFAULT_TOOLTIP_CLASS}-no-interaction {
    pointer-events: none;
    user-select: none;
}

.${DEFAULT_TOOLTIP_CLASS}-no-animation {
    transition: none !important;
}

.${DEFAULT_TOOLTIP_CLASS}-hidden {
    visibility: hidden;
}

.${DEFAULT_TOOLTIP_CLASS}-title {
    overflow: hidden;
    position: relative;
    padding: 8px 14px;
    border-top-left-radius: 2px;
    border-top-right-radius: 2px;
    color: white;
    background-color: #888888;
    z-index: 1;
    text-overflow: inherit;
}

.${DEFAULT_TOOLTIP_CLASS}-title:only-child {
    border-bottom-left-radius: 2px;
    border-bottom-right-radius: 2px;
}

.${DEFAULT_TOOLTIP_CLASS}-content {
    overflow: hidden;
    padding: 6px 14px;
    line-height: 1.7em;
    background: white;
    border-bottom-left-radius: 2px;
    border-bottom-right-radius: 2px;
    border: 1px solid rgba(0, 0, 0, 0.15);
    overflow: hidden;
    text-overflow: inherit;
}

.${DEFAULT_TOOLTIP_CLASS}-arrow::before {
    content: "";

    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);

    border: 5px solid #d9d9d9;

    border-left-color: transparent;
    border-right-color: transparent;
    border-bottom-color: transparent;

    width: 0;
    height: 0;

    margin: 0 auto;
}

.${DEFAULT_TOOLTIP_CLASS}-arrow::after {
    content: "";

    position: absolute;
    top: calc(100% - 1px);
    left: 50%;
    transform: translateX(-50%);

    border: 5px solid white;

    border-left-color: transparent;
    border-right-color: transparent;
    border-bottom-color: transparent;

    width: 0;
    height: 0;

    margin: 0 auto;
}

.ag-chart-wrapper {
    box-sizing: border-box;
    overflow: hidden;
}
`;

/**
 * Manages the tooltip HTML an element. Tracks the requested HTML from distinct dependents and
 * handles conflicting tooltip requests.
 */
export class TooltipManager {
    private readonly stateTracker = new StateTracker<TooltipState>();
    private readonly observer?: IntersectionObserver;
    private appliedState: TooltipState | null = null;

    public constructor(
        private readonly canvasElement: HTMLCanvasElement,
        private readonly tooltip: Tooltip
    ) {
        // Detect when the chart becomes invisible and hide the tooltip as well.
        if (typeof IntersectionObserver !== 'undefined') {
            const observer = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        if (entry.target === this.canvasElement && entry.intersectionRatio === 0) {
                            this.tooltip.toggle(false);
                        }
                    }
                },
                { root: this.tooltip.root }
            );
            observer.observe(this.canvasElement);
            this.observer = observer;
        }

        injectStyle(defaultTooltipCss, 'tooltip');
    }

    public updateTooltip(callerId: string, meta?: TooltipMeta, content?: string) {
        if (!this.tooltip.enabled) return;
        content ??= this.stateTracker.get(callerId)?.content;
        this.stateTracker.set(callerId, { content, meta });
        this.applyStates();
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
        this.observer?.unobserve(this.canvasElement);
    }

    private applyStates() {
        const id = this.stateTracker.stateId();
        const state = id ? this.stateTracker.get(id) : null;

        if (state?.meta == null || state?.content == null) {
            this.appliedState = null;
            this.tooltip.toggle(false);
            return;
        }

        const canvasRect = this.canvasElement.getBoundingClientRect();

        if (this.appliedState?.content === state?.content) {
            const renderInstantly = this.tooltip.isVisible();
            this.tooltip.show(canvasRect, state?.meta, null, renderInstantly);
        } else {
            this.tooltip.show(canvasRect, state?.meta, state?.content);
        }

        this.appliedState = state;
    }

    public static makeTooltipMeta(
        event: TooltipPointerEvent,
        datum: SeriesNodeDatum & Pick<ErrorBoundSeriesNodeDatum, 'yBar'>
    ): TooltipMeta {
        const { offsetX, offsetY } = event;
        const { tooltip } = datum.series.properties;
        const meta: TooltipMeta = {
            offsetX,
            offsetY,
            enableInteraction: tooltip.interaction?.enabled ?? false,
            lastPointerEvent: { type: event.type, offsetX, offsetY },
            showArrow: tooltip.showArrow,
            position: {
                type: tooltip.position.type,
                xOffset: tooltip.position.xOffset,
                yOffset: tooltip.position.yOffset,
            },
        };

        // On `line` and `scatter` series, the tooltip covers the top of error-bars when using datum.midPoint.
        // Using datum.yBar.upperPoint renders the tooltip higher up.
        const refPoint = datum.yBar?.upperPoint ?? datum.midPoint ?? datum.series.datumMidPoint?.(datum);

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
