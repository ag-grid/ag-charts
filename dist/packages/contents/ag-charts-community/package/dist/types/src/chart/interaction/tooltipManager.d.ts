import type { ErrorBoundSeriesNodeDatum, SeriesNodeDatum } from '../series/seriesTypes';
import type { Tooltip, TooltipContent, TooltipMeta } from '../tooltip/tooltip';
import { TooltipPointerEvent } from '../tooltip/tooltip';
/**
 * Manages the tooltip HTML an element. Tracks the requested HTML from distinct dependents and
 * handles conflicting tooltip requests.
 */
export declare class TooltipManager {
    private readonly canvasElement;
    private readonly tooltip;
    private readonly stateTracker;
    private readonly observer?;
    private appliedState;
    constructor(canvasElement: HTMLCanvasElement, tooltip: Tooltip);
    updateTooltip(callerId: string, meta?: TooltipMeta, content?: TooltipContent): void;
    removeTooltip(callerId: string): void;
    getTooltipMeta(callerId: string): TooltipMeta | undefined;
    destroy(): void;
    private applyStates;
    static makeTooltipMeta(event: TooltipPointerEvent<'hover' | 'keyboard'>, datum: SeriesNodeDatum & Pick<ErrorBoundSeriesNodeDatum, 'yBar'>): TooltipMeta;
}
