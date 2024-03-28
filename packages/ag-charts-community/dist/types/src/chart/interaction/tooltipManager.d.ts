import type { ErrorBoundSeriesNodeDatum, SeriesNodeDatum } from '../series/seriesTypes';
import { type Tooltip, type TooltipMeta } from '../tooltip/tooltip';
import type { PointerOffsets } from './interactionManager';
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
    updateTooltip(callerId: string, meta?: TooltipMeta, content?: string): void;
    removeTooltip(callerId: string): void;
    getTooltipMeta(callerId: string): TooltipMeta | undefined;
    destroy(): void;
    private applyStates;
    static makeTooltipMeta(event: PointerOffsets, datum: SeriesNodeDatum & Pick<ErrorBoundSeriesNodeDatum, 'yBar'>): TooltipMeta;
}
