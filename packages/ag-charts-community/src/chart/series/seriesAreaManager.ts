import type { AgChartClickEvent, AgChartDoubleClickEvent } from 'ag-charts-types';

import type { BBox } from '../../scene/bbox';
import type { Point } from '../../scene/point';
import { createId } from '../../util/id';
import { clamp } from '../../util/number';
import type { TypedEvent } from '../../util/observable';
import { debouncedAnimationFrame } from '../../util/render';
import { isFiniteNumber } from '../../util/type-guards';
import { BaseManager } from '../baseManager';
import type { ChartContext } from '../chartContext';
import type { ChartHighlight } from '../chartHighlight';
import { ChartUpdateType } from '../chartUpdateType';
import type { HighlightChangeEvent } from '../interaction/highlightManager';
import { InteractionState, type PointerInteractionEvent, type PointerOffsets } from '../interaction/interactionManager';
import type { KeyNavEvent } from '../interaction/keyNavManager';
import { REGIONS } from '../interaction/regions';
import { TooltipManager } from '../interaction/tooltipManager';
import { makeKeyboardPointerEvent } from '../keyboardUtil';
import type { LayoutCompleteEvent } from '../layout/layoutService';
import type { ChartOverlays } from '../overlay/chartOverlays';
import {
    DEFAULT_TOOLTIP_CLASS,
    Tooltip,
    type TooltipContent,
    type TooltipEventType,
    type TooltipPointerEvent,
} from '../tooltip/tooltip';
import type { UpdateOpts } from '../updateService';
import { type PickFocusOutputs, type Series, type SeriesNodePickIntent, SeriesNodePickMode } from './series';
import type { SeriesProperties } from './seriesProperties';
import type { ISeries, SeriesNodeDatum } from './seriesTypes';

type PickedNode = {
    series: Series<any, any>;
    datum: SeriesNodeDatum;
    distance: number;
};

type PointerOffsetsAndHistory = PointerOffsets & { pointerHistory?: PointerOffsets[] };

type ChartFocusData = {
    hasFocus: boolean;
    series?: Series<any, any>;
    seriesIndex: number;
    datum: any;
    datumIndex: number;
};

/** Manager that handles all top-down series-area related concerns and state. */
export class SeriesAreaManager extends BaseManager {
    readonly id = createId(this);

    public series: Series<any, any>[] = [];

    private seriesRect?: BBox;
    private hoverRect?: BBox;

    public constructor(
        private readonly chart: {
            performUpdateType: ChartUpdateType;
            fireEvent<TEvent extends TypedEvent>(event: TEvent): void;
        },
        private readonly ctx: ChartContext,
        private chartType: 'cartesian' | 'polar' | 'hierarchy' | 'topology' | 'flow-proportion',
        private readonly tooltip: Tooltip,
        private readonly highlight: ChartHighlight,
        private readonly overlays: ChartOverlays
    ) {
        super();

        const seriesRegion = this.ctx.regionManager.getRegion(REGIONS.SERIES);
        const horizontalAxesRegion = this.ctx.regionManager.addRegion(REGIONS.HORIZONTAL_AXES);
        const verticalAxesRegion = this.ctx.regionManager.addRegion(REGIONS.VERTICAL_AXES);

        this.destroyFns.push(
            this.ctx.domManager.addListener('resize', () => this.resetPointer()),
            this.ctx.layoutService.addListener('layout-complete', (event) => this.layoutComplete(event)),
            seriesRegion.addListener(
                'hover',
                (event) => this.onMouseMove(event),
                InteractionState.Default | InteractionState.Annotations
            ),
            seriesRegion.addListener(
                'drag',
                (event) => this.onMouseMove(event),
                InteractionState.Default | InteractionState.Annotations
            ),
            seriesRegion.addListener('leave', (event) => this.onLeave(event)),
            seriesRegion.addListener('blur', () => this.onBlur()),
            seriesRegion.addListener('tab', (event) => this.onTab(event)),
            seriesRegion.addListener('nav-vert', (event) => this.onNavVert(event)),
            seriesRegion.addListener('nav-hori', (event) => this.onNavHori(event)),
            seriesRegion.addListener('submit', (event) => this.onSubmit(event)),
            seriesRegion.addListener('contextmenu', (event) => this.onContextMenu(event), InteractionState.All),
            horizontalAxesRegion.addListener('hover', (event) => this.onMouseMove(event)),
            verticalAxesRegion.addListener('hover', (event) => this.onMouseMove(event)),
            horizontalAxesRegion.addListener('leave', (event) => this.onLeave(event)),
            verticalAxesRegion.addListener('leave', (event) => this.onLeave(event)),
            this.ctx.keyNavManager.addListener('browserfocus', (event) => this.onBrowserFocus(event)),
            this.ctx.animationManager.addListener('animation-start', () => this.onAnimationStart()),
            this.ctx.highlightManager.addListener('highlight-change', (event) => this.changeHighlightDatum(event)),
            this.ctx.zoomManager.addListener('zoom-pan-start', () => this.resetPointer()),
            this.ctx.zoomManager.addListener('zoom-change', () => {
                this.resetPointer();
                this.ctx.focusIndicator.updateBounds(undefined);
            })
        );
    }

    public dataChanged() {
        this.resetPointer(true);
    }

    public seriesUpdated() {
        const tooltipMeta = this.ctx.tooltipManager.getTooltipMeta(this.id);
        if (tooltipMeta?.lastPointerEvent != null) {
            this.handlePointer(tooltipMeta.lastPointerEvent, true);
        }
    }

    private update(type?: ChartUpdateType, opts?: UpdateOpts) {
        this.ctx.updateService.update(type, opts);
    }

    private layoutComplete(event: LayoutCompleteEvent): void {
        this.seriesRect = event.series.rect;
        this.hoverRect = event.series.paddedRect;
    }

    // x/y are local canvas coordinates in CSS pixels, not actual pixels
    private pickNode(
        point: Point,
        intent: SeriesNodePickIntent,
        collection: {
            series: Series<SeriesNodeDatum, SeriesProperties<object[]>>;
            pickModes?: SeriesNodePickMode[];
            maxDistance?: number;
        }[]
    ): PickedNode | undefined {
        // Iterate through series in reverse, as later declared series appears on top of earlier
        // declared series.
        const reverseSeries = [...collection].reverse();

        let result: { series: Series<any, any>; datum: SeriesNodeDatum; distance: number } | undefined;
        for (const { series, pickModes, maxDistance } of reverseSeries) {
            if (!series.visible || !series.rootGroup.visible) {
                continue;
            }
            const { match, distance } = series.pickNode(point, intent, pickModes) ?? {};
            if (!match || distance == null) {
                continue;
            }
            if ((!result || result.distance > distance) && distance <= (maxDistance ?? Infinity)) {
                result = { series, distance, datum: match };
            }
            if (distance === 0) {
                break;
            }
        }

        return result;
    }

    private pickSeriesNode(
        point: Point,
        intent: SeriesNodePickIntent,
        exactMatchOnly: boolean,
        maxDistance?: number
    ): PickedNode | undefined {
        // Disable 'nearest match' options if looking for exact matches only
        const pickModes = exactMatchOnly ? [SeriesNodePickMode.EXACT_SHAPE_MATCH] : undefined;
        return this.pickNode(
            point,
            intent,
            this.series.map((series) => ({ series, pickModes, maxDistance }))
        );
    }

    private pickTooltip(point: Point): PickedNode | undefined {
        return this.pickNode(
            point,
            'tooltip',
            this.series.map((series) => {
                const tooltipRange = series.properties.tooltip.range;
                let pickModes: SeriesNodePickMode[] | undefined;
                if (tooltipRange === 'exact') {
                    pickModes = [SeriesNodePickMode.EXACT_SHAPE_MATCH];
                } else {
                    pickModes = undefined;
                }

                const maxDistance = typeof tooltipRange === 'number' ? tooltipRange : undefined;
                return { series, pickModes, maxDistance };
            })
        );
    }

    private lastPick?: SeriesNodeDatum;

    private onMouseMove(event: PointerInteractionEvent<'hover' | 'drag'>): void {
        this.lastInteractionEvent = event;
        this.pointerScheduler.schedule();

        this.update(ChartUpdateType.SCENE_RENDER);
    }

    private onLeave(event: PointerInteractionEvent<'leave'>): void {
        const el = event.relatedElement;
        if (el && this.ctx.domManager.isManagedDOMElement(el)) return;

        this.resetPointer();
        this.update(ChartUpdateType.SCENE_RENDER);
        this.ctx.cursorManager.updateCursor('chart');
    }

    private onBrowserFocus(event: KeyNavEvent<'browserfocus'>): void {
        if (event.delta > 0) {
            this.focus.datum = undefined;
            this.focus.series = undefined;
            this.focus.datumIndex = 0;
            this.focus.seriesIndex = 0;
        } else if (event.delta < 0) {
            this.focus.datum = undefined;
            this.focus.series = undefined;
            this.focus.datumIndex = Infinity;
            this.focus.seriesIndex = Infinity;
        }
    }

    private onAnimationStart() {
        if (this.focus.hasFocus) {
            this.onBlur();
        }
    }

    private onBlur(): void {
        this.ctx.focusIndicator.updateBounds(undefined);
        this.resetPointer();
        this.focus.hasFocus = false;
        // Do not consume blur events to allow the browser-focus to leave the canvas element.
    }

    private onContextMenu(event: PointerInteractionEvent<'contextmenu'>): void {
        this.ctx.tooltipManager.removeTooltip(this.id);

        // If there is already a context menu visible, then re-pick the highlighted node.
        // We check InteractionState.Default too just in case we were in ContextMenu and the
        // mouse hasn't moved since (see AG-10233).
        const { Default, ContextMenu } = InteractionState;

        let pickedNode: SeriesNodeDatum | undefined;
        if (this.ctx.interactionManager.getState() & (Default | ContextMenu)) {
            this.checkSeriesNodeRange('context-menu', event, (_series, datum) => {
                this.ctx.highlightManager.updateHighlight(this.id);
                pickedNode = datum;
            });
        }

        this.ctx.contextMenuRegistry.dispatchContext('series', event, { pickedNode });
    }

    resetPointer(highlightOnly = false) {
        if (!highlightOnly) {
            this.ctx.tooltipManager.removeTooltip(this.id);
        }
        this.ctx.highlightManager.updateHighlight(this.id);
        this.lastInteractionEvent = undefined;
    }

    private lastInteractionEvent?: TooltipPointerEvent<'hover' | 'drag' | 'keyboard'>;
    private static isHoverEvent(
        event: TooltipPointerEvent<TooltipEventType> | undefined
    ): event is TooltipPointerEvent<'hover'> {
        return event !== undefined && event.type === 'hover';
    }
    private static isDragEvent(
        event: TooltipPointerEvent<TooltipEventType> | undefined
    ): event is TooltipPointerEvent<'drag'> {
        return event !== undefined && event.type === 'drag';
    }
    private readonly pointerScheduler = debouncedAnimationFrame(() => {
        if (!this.lastInteractionEvent) return;

        if (this.chart.performUpdateType <= ChartUpdateType.SERIES_UPDATE) {
            // Reschedule until the current update processing is complete, if we try to
            // perform a highlight mid-update then we may not have fresh node data to work with.
            this.pointerScheduler.schedule();
            return;
        }

        this.handlePointer(this.lastInteractionEvent, false);
        this.lastInteractionEvent = undefined;
    });

    private handlePointer(event: TooltipPointerEvent<'hover' | 'drag' | 'keyboard'>, redisplay: boolean) {
        // Ignored "pointer event" that comes from a keyboard. We don't need to worry about finding out
        // which datum to use in the highlight & tooltip because the keyboard just navigates through the
        // data directly.
        const state = this.ctx.interactionManager.getState();
        if (
            (state !== InteractionState.Default && state !== InteractionState.Annotations) ||
            (!SeriesAreaManager.isHoverEvent(event) && !SeriesAreaManager.isDragEvent(event))
        ) {
            return;
        }

        const { lastPick } = this;
        const { offsetX, offsetY } = event;

        const disablePointer = (highlightOnly = false) => {
            if (lastPick) {
                this.resetPointer(highlightOnly);
            }
        };

        if (redisplay ? this.ctx.animationManager.isActive() : !this.hoverRect?.containsPoint(offsetX, offsetY)) {
            disablePointer();
            return;
        }

        // Handle node highlighting and tooltip toggling when pointer within `tooltip.range`
        this.handlePointerTooltip(event, disablePointer);

        // Handle node highlighting and mouse cursor when pointer withing `series[].nodeClickRange`
        this.handlePointerNode(event, 'highlight');
    }

    private handlePointerTooltip(
        event: TooltipPointerEvent<'hover' | 'drag'>,
        disablePointer: (highlightOnly?: boolean) => void
    ) {
        const { lastPick } = this;
        const { offsetX, offsetY, targetElement } = event;

        if (
            targetElement &&
            this.tooltip.interactive &&
            this.ctx.domManager.isManagedChildDOMElement(targetElement, 'canvas-overlay', DEFAULT_TOOLTIP_CLASS)
        ) {
            // Skip tooltip update if tooltip is interactive, and the source event was for a tooltip HTML element.
            return;
        }

        const pick = this.pickTooltip({ x: offsetX, y: offsetY });
        if (!pick) {
            this.ctx.tooltipManager.removeTooltip(this.id);
            if (this.highlight.range === 'tooltip') {
                disablePointer(true);
            }
            return;
        }

        const isNewDatum = this.highlight.range === 'node' || !lastPick || lastPick !== pick.datum;
        let html;

        if (isNewDatum) {
            html = pick.series.getTooltipHtml(pick.datum);

            if (this.highlight.range === 'tooltip' && pick.series.properties.highlight.enabled) {
                this.ctx.highlightManager.updateHighlight(this.id, pick.datum);
            }
        }

        const tooltipEnabled = this.tooltip.enabled && pick.series.tooltipEnabled;
        const shouldUpdateTooltip = tooltipEnabled && (!isNewDatum || html !== undefined);

        const meta = TooltipManager.makeTooltipMeta(event, pick.datum);

        if (shouldUpdateTooltip) {
            this.ctx.tooltipManager.updateTooltip(this.id, meta, html);
        }
    }

    private handlePointerNode(event: PointerOffsetsAndHistory, intent: SeriesNodePickIntent) {
        const { range } = this.highlight;

        const found = this.checkSeriesNodeRange(intent, event, (series, datum) => {
            if (series.hasEventListener('nodeClick') || series.hasEventListener('nodeDoubleClick')) {
                this.ctx.cursorManager.updateCursor('chart', 'pointer');
            }

            if (range === 'tooltip' && series.properties.tooltip.enabled) return;
            this.ctx.highlightManager.updateHighlight(this.id, datum);
        });
        if (found) return;

        this.ctx.cursorManager.updateCursor('chart');
        if (range !== 'node') return;
        this.ctx.highlightManager.updateHighlight(this.id);
    }

    private onClick(event: PointerInteractionEvent<'click'>) {
        if (this.checkSeriesNodeClick(event)) {
            this.update(ChartUpdateType.SERIES_UPDATE);
            event.preventDefault();
            return;
        }
        this.chart.fireEvent<AgChartClickEvent>({ type: 'click', event: event.sourceEvent });
    }

    private onDoubleClick(event: PointerInteractionEvent<'dblclick'>) {
        if (this.checkSeriesNodeDoubleClick(event)) {
            this.update(ChartUpdateType.SERIES_UPDATE);
            event.preventDefault();
            return;
        }
        this.chart.fireEvent<AgChartDoubleClickEvent>({ type: 'doubleClick', event: event.sourceEvent });
    }

    private checkSeriesNodeClick(event: PointerInteractionEvent<'click'>): boolean {
        return this.checkSeriesNodeRange('event', event, (series, datum) =>
            series.fireNodeClickEvent(event.sourceEvent, datum)
        );
    }

    private checkSeriesNodeDoubleClick(event: PointerInteractionEvent<'dblclick'>): boolean {
        return this.checkSeriesNodeRange('event', event, (series, datum) =>
            series.fireNodeDoubleClickEvent(event.sourceEvent, datum)
        );
    }

    private checkSeriesNodeRange(
        intent: SeriesNodePickIntent,
        event: PointerOffsetsAndHistory & { preventZoomDblClick?: boolean },
        callback: (series: ISeries<any, any>, datum: SeriesNodeDatum) => void
    ): boolean {
        const nearestNode = this.pickSeriesNode({ x: event.offsetX, y: event.offsetY }, intent, false);

        const datum = nearestNode?.datum;
        const nodeClickRange = datum?.series.properties.nodeClickRange;

        let pixelRange: number | undefined;
        if (isFiniteNumber(nodeClickRange)) {
            pixelRange = nodeClickRange;
        }

        // Find the node if exactly matched and update the highlight picked node
        let pickedNode = this.pickSeriesNode({ x: event.offsetX, y: event.offsetY }, intent, true);
        if (pickedNode) {
            // See: AG-11737#TC3, AG-11676
            //
            // The Zoom module's double-click handler resets the zoom, but only if there isn't an
            // exact match on a node. This is counter-intuitive, and there's no built-in mechanism
            // in the InteractionManager / RegionManager for the Zoom module to listen to non-exact
            // series-rect double-clicks. As a workaround, we'll set this boolean to tell the Zoom
            // double-click handler to ignore the event whenever we are double-clicking exactly on
            // a node.
            event.preventZoomDblClick = true;
        }

        // First check if we should trigger the callback based on nearest node
        if (datum && nodeClickRange === 'nearest') {
            callback(datum.series, datum);
            return true;
        }

        if (nodeClickRange !== 'exact') {
            pickedNode = this.pickSeriesNode({ x: event.offsetX, y: event.offsetY }, intent, false, pixelRange);
        }

        if (!pickedNode) return false;

        // Then if we've picked a node within the pixel range, or exactly, trigger the callback
        const isPixelRange = pixelRange != null;
        const exactlyMatched = nodeClickRange === 'exact' && pickedNode.distance === 0;

        if (isPixelRange || exactlyMatched) {
            const allMatch: boolean =
                event.pointerHistory === undefined ||
                event.pointerHistory?.every((pastEvent) => {
                    const historyPoint = { x: pastEvent.offsetX, y: pastEvent.offsetY };
                    const historyNode =
                        nodeClickRange === 'exact'
                            ? this.pickSeriesNode(historyPoint, intent, true)
                            : this.pickSeriesNode(historyPoint, intent, false, pixelRange);
                    return historyNode?.datum === pickedNode?.datum;
                });
            if (allMatch) {
                callback(pickedNode.series, pickedNode.datum);
                return true;
            }
        }

        return false;
    }

    private onTab(event: KeyNavEvent<'tab'>): void {
        this.handleFocus(0, 0);
        event.preventDefault();
        this.focus.hasFocus = true;
    }

    private onNavVert(event: KeyNavEvent<'nav-vert'>): void {
        this.focus.seriesIndex += event.delta;
        this.handleFocus(event.delta, 0);
        event.preventDefault();
    }

    private onNavHori(event: KeyNavEvent<'nav-hori'>): void {
        this.focus.datumIndex += event.delta;
        this.handleFocus(0, event.delta);
        event.preventDefault();
    }

    private focus: ChartFocusData = {
        hasFocus: false,
        series: undefined,
        seriesIndex: 0,
        datumIndex: 0,
        datum: undefined,
    };

    private handleFocus(seriesIndexDelta: number, datumIndexDelta: number) {
        this.focus.hasFocus = true;
        const overlayFocus = this.overlays.getFocusInfo(this.ctx.localeManager);
        if (overlayFocus == null) {
            this.handleSeriesFocus(seriesIndexDelta, datumIndexDelta);
        } else {
            this.ctx.focusIndicator.updateBounds(overlayFocus.rect);
            this.ctx.ariaAnnouncementService.announceValue(overlayFocus.text);
        }
    }

    private handleSeriesFocus(otherIndexDelta: number, datumIndexDelta: number) {
        if (this.chartType === 'hierarchy') {
            this.handleHierarchySeriesFocus(otherIndexDelta, datumIndexDelta);
            return;
        }
        const { focus, seriesRect, series } = this;
        const visibleSeries = series.filter((s) => s.visible);
        if (visibleSeries.length === 0) return;

        // Update focused series:
        focus.seriesIndex = clamp(0, focus.seriesIndex, visibleSeries.length - 1);
        focus.series = visibleSeries[focus.seriesIndex];

        // Update focused datum:
        const { datumIndex, seriesIndex: otherIndex } = focus;
        const pick = focus.series.pickFocus({ datumIndex, datumIndexDelta, otherIndex, otherIndexDelta, seriesRect });
        this.updatePickedFocus(pick);
    }

    handleHierarchySeriesFocus(otherIndexDelta: number, datumIndexDelta: number) {
        // Hierarchial charts (treemap, sunburst) can only have 1 series. So we'll repurpose the focus.seriesIndex
        // value to control the focused depth. This allows the hierarchial charts to piggy-back on the base keyboard
        // handling implementation.
        this.focus.series = this.series[0];
        const {
            focus: { series, seriesIndex: otherIndex, datumIndex },
            seriesRect,
        } = this;
        if (series === undefined) return;
        const pick = series.pickFocus({ datumIndex, datumIndexDelta, otherIndex, otherIndexDelta, seriesRect });
        this.updatePickedFocus(pick);
    }

    private updatePickedFocus(pick: PickFocusOutputs | undefined) {
        const { focus } = this;
        if (pick === undefined || focus.series === undefined) return;

        const { datum, datumIndex } = pick;
        focus.datumIndex = datumIndex;
        focus.datum = datum;

        // Update user interaction/interface:
        const keyboardEvent = makeKeyboardPointerEvent(this.ctx.focusIndicator, pick);
        if (keyboardEvent !== undefined) {
            this.lastInteractionEvent = keyboardEvent;
            const html = focus.series.getTooltipHtml(datum);
            const meta = TooltipManager.makeTooltipMeta(this.lastInteractionEvent, datum);
            const aria = this.getDatumAriaText(datum, html);
            this.ctx.highlightManager.updateHighlight(this.id, datum);
            this.ctx.tooltipManager.updateTooltip(this.id, meta, html);
            this.ctx.ariaAnnouncementService.announceValue('ariaAnnounceHoverDatum', { datum: aria });
        }
    }

    private onSubmit(event: KeyNavEvent<'submit'>): void {
        const { series, datum } = this.focus;
        const sourceEvent = event.sourceEvent.sourceEvent;
        if (series !== undefined && datum !== undefined) {
            series.fireNodeClickEvent(sourceEvent, datum);
        } else {
            this.chart.fireEvent<AgChartClickEvent>({
                type: 'click',
                event: sourceEvent,
            });
        }
        event.preventDefault();
    }

    private changeHighlightDatum(event: HighlightChangeEvent) {
        const seriesToUpdate: Set<ISeries<any, any>> = new Set();
        const { series: newSeries = undefined, datum: newDatum } = event.currentHighlight ?? {};
        const { series: lastSeries = undefined, datum: lastDatum } = event.previousHighlight ?? {};

        if (lastSeries) {
            seriesToUpdate.add(lastSeries);
        }

        if (newSeries) {
            seriesToUpdate.add(newSeries);
        }

        // Adjust cursor if a specific datum is highlighted, rather than just a series.
        if (lastSeries?.properties.cursor && lastDatum) {
            this.ctx.cursorManager.updateCursor(lastSeries.id);
        }
        if (newSeries?.properties.cursor && newDatum) {
            this.ctx.cursorManager.updateCursor(newSeries.id, newSeries.properties.cursor);
        }

        this.lastPick = event.currentHighlight;

        const updateAll = newSeries == null || lastSeries == null;
        if (updateAll) {
            this.update(ChartUpdateType.SERIES_UPDATE);
        } else {
            this.update(ChartUpdateType.SERIES_UPDATE, { seriesToUpdate });
        }
    }

    private getDatumAriaText(datum: SeriesNodeDatum, html: TooltipContent): string {
        const description = html.ariaLabel;
        return datum.series.getDatumAriaText?.(datum, description) ?? description;
    }
}
