import { createId } from '../../util/id';
import type { TypedEvent } from '../../util/observable';
import { BaseManager } from '../baseManager';
import type { ChartContext } from '../chartContext';
import type { ChartHighlight } from '../chartHighlight';
import { ChartUpdateType } from '../chartUpdateType';
import { InteractionState, type PointerInteractionEvent } from '../interaction/interactionManager';
import { REGIONS } from '../interaction/regions';
import type { ChartOverlays } from '../overlay/chartOverlays';
import { Tooltip } from '../tooltip/tooltip';
import { type Series } from './series';
import { SeriesAreaClickManager } from './seriesAreaClickManager';
import { SeriesAreaFocusManager } from './seriesAreaFocusManager';
import { SeriesAreaHighlightManager } from './seriesAreaHighlightManager';
import { SeriesAreaTooltipManager } from './seriesAreaTooltipManager';
import type { SeriesNodeDatum } from './seriesTypes';
import { pickNode } from './util';

/** Manager that handles all top-down series-area related concerns and state. */
export class SeriesAreaManager extends BaseManager {
    readonly id = createId(this);

    private series: Series<any, any>[] = [];

    private readonly focusManager: SeriesAreaFocusManager;
    private readonly highlightManager: SeriesAreaHighlightManager;
    private readonly tooltipManager: SeriesAreaTooltipManager;
    private readonly clickManager: SeriesAreaClickManager;

    public constructor(
        chart: {
            performUpdateType: ChartUpdateType;
            fireEvent<TEvent extends TypedEvent>(event: TEvent): void;
        },
        private readonly ctx: ChartContext,
        chartType: 'cartesian' | 'polar' | 'hierarchy' | 'topology' | 'flow-proportion',
        tooltip: Tooltip,
        highlight: ChartHighlight,
        overlays: ChartOverlays
    ) {
        super();

        this.focusManager = new SeriesAreaFocusManager(this.id, chart, ctx, chartType, overlays);
        this.highlightManager = new SeriesAreaHighlightManager(this.id, chart, ctx, highlight);
        this.tooltipManager = new SeriesAreaTooltipManager(this.id, chart, ctx, tooltip);
        this.clickManager = new SeriesAreaClickManager(this.id, chart, ctx);

        const seriesRegion = this.ctx.regionManager.getRegion(REGIONS.SERIES);

        this.destroyFns.push(
            () => this.focusManager.destroy(),
            () => this.highlightManager.destroy(),
            () => this.tooltipManager.destroy(),
            () => this.clickManager.destroy(),
            seriesRegion.addListener('contextmenu', (event) => this.onContextMenu(event), InteractionState.All)
        );
    }

    public dataChanged() {
        this.highlightManager.dataChanged();
        this.clickManager.dataChanged();
    }

    public seriesUpdated() {
        this.highlightManager.seriesUpdated();
        this.clickManager.seriesUpdated();
    }

    public seriesChanged(series: Series<any, any>[]) {
        this.series = series;
        this.focusManager.series = series;
        this.highlightManager.series = series;
        this.tooltipManager.series = series;
        this.clickManager.series = series;
    }

    private onContextMenu(event: PointerInteractionEvent<'contextmenu'>): void {
        // If there is already a context menu visible, then re-pick the highlighted node.
        // We check InteractionState.Default too just in case we were in ContextMenu and the
        // mouse hasn't moved since (see AG-10233).
        const { Default, ContextMenu } = InteractionState;

        let pickedNode: SeriesNodeDatum | undefined;
        if (this.ctx.interactionManager.getState() & (Default | ContextMenu)) {
            const match = pickNode(this.series, { x: event.offsetX, y: event.offsetY }, 'context-menu');
            if (match) {
                this.ctx.highlightManager.updateHighlight(this.id);
                pickedNode = match.datum;
            }
        }

        this.ctx.contextMenuRegistry.dispatchContext('series', event, { pickedNode });
    }
}
