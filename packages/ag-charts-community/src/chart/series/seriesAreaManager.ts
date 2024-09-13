import type { BBox } from '../../scene/bbox';
import { createId } from '../../util/id';
import type { TypedEvent } from '../../util/observable';
import { BaseManager } from '../baseManager';
import type { ChartContext } from '../chartContext';
import type { ChartHighlight } from '../chartHighlight';
import { ChartUpdateType } from '../chartUpdateType';
import { InteractionState } from '../interaction/interactionManager';
import type { RegionEvent } from '../interaction/regionManager';
import { REGIONS } from '../interaction/regions';
import type { LayoutCompleteEvent } from '../layout/layoutManager';
import type { ChartOverlays } from '../overlay/chartOverlays';
import { Tooltip } from '../tooltip/tooltip';
import { type Series } from './series';
import { SeriesAreaClickManager } from './seriesAreaClickManager';
import { SeriesAreaFocusManager } from './seriesAreaFocusManager';
import { SeriesAreaHighlightManager } from './seriesAreaHighlightManager';
import { SeriesAreaTooltipManager } from './seriesAreaTooltipManager';
import type { SeriesNodeDatum } from './seriesTypes';
import { pickNode } from './util';

interface SeriesAreaSubManager {
    seriesChanged(series: Series<any, any>[]): void;
    dataChanged?: () => void;
    preSceneRender?: () => void;

    destroy(): void;
}

/** Manager that handles all top-down series-area related concerns and state. */
export class SeriesAreaManager extends BaseManager {
    readonly id = createId(this);

    private series: Series<any, any>[] = [];
    private seriesRect?: BBox;

    private readonly subManagers: SeriesAreaSubManager[];

    public constructor(
        chart: {
            performUpdateType: ChartUpdateType;
            fireEvent<TEvent extends TypedEvent>(event: TEvent): void;
        },
        private readonly ctx: ChartContext,
        chartType: 'cartesian' | 'polar' | 'hierarchy' | 'topology' | 'flow-proportion' | 'gauge',
        tooltip: Tooltip,
        highlight: ChartHighlight,
        overlays: ChartOverlays
    ) {
        super();

        this.subManagers = [
            new SeriesAreaFocusManager(this.id, chart, ctx, chartType, overlays),
            new SeriesAreaHighlightManager(this.id, chart, ctx, highlight),
            new SeriesAreaTooltipManager(this.id, chart, ctx, tooltip),
            new SeriesAreaClickManager(this.id, chart, ctx),
        ];

        const seriesRegion = this.ctx.regionManager.getRegion(REGIONS.SERIES);
        this.destroyFns.push(
            () => this.subManagers.forEach((s) => s.destroy()),
            seriesRegion.addListener('contextmenu', (event) => this.onContextMenu(event), InteractionState.All),
            this.ctx.updateService.addListener('pre-scene-render', () => this.preSceneRender()),
            this.ctx.layoutManager.addListener('layout:complete', (event) => this.layoutComplete(event))
        );
    }

    public dataChanged() {
        for (const manager of this.subManagers) {
            manager.dataChanged?.();
        }
    }

    private preSceneRender() {
        for (const manager of this.subManagers) {
            manager.preSceneRender?.();
        }
    }

    public seriesChanged(series: Series<any, any>[]) {
        this.series = series;
        for (const manager of this.subManagers) {
            manager.seriesChanged([...series]);
        }
    }

    private layoutComplete(event: LayoutCompleteEvent): void {
        this.seriesRect = event.series.rect;
    }

    private onContextMenu(event: RegionEvent<'contextmenu'>): void {
        // If there is already a context menu visible, then re-pick the highlighted node.
        // We check InteractionState.Default too just in case we were in ContextMenu and the
        // mouse hasn't moved since (see AG-10233).
        const { Default, ContextMenu } = InteractionState;

        let pickedNode: SeriesNodeDatum | undefined;
        let position: { x: number; y: number } | undefined;
        if (this.ctx.focusIndicator.guessDevice(event.sourceEvent).type === 'keyboard') {
            pickedNode = this.ctx.highlightManager.getActiveHighlight();
            if (pickedNode && this.seriesRect && pickedNode.midPoint) {
                position = {
                    x: this.seriesRect.x + pickedNode.midPoint.x,
                    y: this.seriesRect.y + pickedNode.midPoint.y,
                };
            }
        } else if (this.ctx.interactionManager.getState() & (Default | ContextMenu)) {
            const match = pickNode(this.series, { x: event.regionOffsetX, y: event.regionOffsetY }, 'context-menu');
            if (match) {
                this.ctx.highlightManager.updateHighlight(this.id);
                pickedNode = match.datum;
            }
        }

        this.ctx.contextMenuRegistry.dispatchContext('series', event, { pickedNode }, position);
    }
}
