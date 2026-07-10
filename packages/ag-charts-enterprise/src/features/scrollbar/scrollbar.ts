import { type AgCartesianAxisPosition, _ModuleSupport } from 'ag-charts-community';
import {
    AbstractModuleInstance,
    ChartAxisDirection,
    ChartUpdateType,
    type DynamicContext,
    type FillStrokeMorph,
    type Normalised,
    UNIT_MAX,
    UNIT_MIN,
    ZIndexMap,
    clamp,
    definedZoomState,
    isNumberEqual,
} from 'ag-charts-core';
import type { AgScrollbarThumbStyle, AgScrollbarTrackStyle } from 'ag-charts-types';

import { ZoomScrollPanner } from '../zoom-interaction/zoomScrollPanner';
import { ScrollbarDOMProxy } from './scrollbarDOMProxy';

const { BBox, Group, Rect, LayoutElement, InteractionState } = _ModuleSupport;

type ScrollbarOrientation = 'horizontal' | 'vertical';

type NormalisedScrollbarTrackStyle = Normalised<AgScrollbarTrackStyle, never, FillStrokeMorph>;
type NormalisedScrollbarThumbStyle = Normalised<
    AgScrollbarThumbStyle,
    never,
    FillStrokeMorph & { hoverStyle?: FillStrokeMorph }
>;

interface ScrollbarOrientationState {
    orientation: ScrollbarOrientation;
    group: _ModuleSupport.Group;
    track: _ModuleSupport.Rect;
    thumb: _ModuleSupport.Rect;
    dom: ScrollbarDOMProxy;
    properties: _ModuleSupport.NormalisedScrollbarOrientationOptions;
    layoutRect?: _ModuleSupport.BBox;
    position: AgCartesianAxisPosition;
    positionHasAxis: boolean;
    axisId?: string;
    hovered: boolean;
}

const SCROLLING_STEP = 0.1;
const SCROLLING_MODE = 'pan';

export class Scrollbar extends AbstractModuleInstance {
    private readonly state: Record<ScrollbarOrientation, ScrollbarOrientationState>;
    private seriesRect?: _ModuleSupport.BBox;

    private readonly scrollPanner = new ZoomScrollPanner();

    // Scrollbar is only created when the `scrollbar` subtree is configured, so assert presence
    // here and rely on SCROLLBAR_THEME for field-level defaults (including horizontal/vertical
    // sub-objects, which the theme always populates via SCROLLBAR_ORIENTATION_THEME).
    private get opts(): _ModuleSupport.NormalisedScrollbarOptions {
        return this.ctx.chartState.getValue('options', 'scrollbar')!;
    }

    // Chart.hasViewportSupport() reads this to preserve zoom state across updates.
    public get enabled(): boolean {
        return this.opts.enabled;
    }

    public constructor(private readonly ctx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super();

        this.state = {
            horizontal: this.createOrientationState('horizontal'),
            vertical: this.createOrientationState('vertical'),
        };

        this.cleanup.register(
            ctx.scene.attachNode(this.state.horizontal.group),
            ctx.scene.attachNode(this.state.vertical.group),
            ctx.layoutManager.registerElement(LayoutElement.Scrollbar, (e) => this.onLayoutStart(e)),
            ctx.eventsHub.on('layout:complete', (e) => this.onLayoutComplete(e)),
            ctx.eventsHub.on('zoom:change-complete', () => this.updateThumbs()),
            ctx.eventsHub.on('zoom-interaction:scrollbar:wheel', (event) => this.onWheel(event)),
            ctx.eventsHub.on('zoom-interaction:scrollbar:axis-wheel', (event) => this.onAxisWheel(event)),
            ctx.eventsHub.on('zoom-interaction:scrollbar:scrollbar-wheel', (event) => this.onScrollbarWheel(event))
        );
    }

    private createOrientationState(orientation: ScrollbarOrientation): ScrollbarOrientationState {
        const group = new Group({ name: `scrollbar-${orientation}`, zIndex: ZIndexMap.NAVIGATOR });
        const track = new Rect();
        const thumb = new Rect();
        group.append(track);
        group.append(thumb);

        const dom = new ScrollbarDOMProxy(
            this.ctx,
            orientation,
            (min, max) => this.handleUserChange(orientation, min, max),
            (hovered) => this.handleHoverChange(orientation, hovered)
        );

        const properties = this.resolveProperties(orientation);

        return {
            orientation,
            group,
            track,
            thumb,
            dom,
            properties,
            position: this.getDefaultPosition(orientation),
            positionHasAxis: false,
            hovered: false,
        };
    }

    private resolveProperties(orientation: ScrollbarOrientation): _ModuleSupport.NormalisedScrollbarOrientationOptions {
        return orientation === 'horizontal' ? this.opts.horizontal : this.opts.vertical;
    }

    private getDefaultPosition(orientation: ScrollbarOrientation): AgCartesianAxisPosition {
        return orientation === 'horizontal' ? 'bottom' : 'left';
    }

    private resolveAxis(
        orientation: ScrollbarOrientation,
        configuredPosition?: AgCartesianAxisPosition
    ): {
        axis?: _ModuleSupport.AxisContext;
        position: AgCartesianAxisPosition;
        positionHasAxis: boolean;
    } {
        const direction = orientation === 'horizontal' ? ChartAxisDirection.X : ChartAxisDirection.Y;
        const contexts = this.ctx.axisManager.getAxisContext(direction);

        if (contexts.length === 0) {
            return { position: this.getDefaultPosition(orientation), positionHasAxis: false };
        }

        if (configuredPosition == null) {
            const axis = contexts[0];
            return { axis, position: axis.position ?? this.getDefaultPosition(orientation), positionHasAxis: true };
        }

        const axis = contexts.find((ctx) => ctx.position === configuredPosition);
        if (axis) {
            return { axis, position: configuredPosition, positionHasAxis: true };
        }

        return { axis: contexts[0], position: configuredPosition, positionHasAxis: false };
    }

    private onLayoutStart({ scrollbars, layoutBox }: _ModuleSupport.LayoutContext) {
        for (const orientation of ['horizontal', 'vertical'] as const) {
            const state = this.state[orientation];
            const properties = this.resolveProperties(orientation);

            const { min, max } = this.getZoomRange(state.orientation);
            const span = clamp(0, max - min, 1);

            const {
                axis: { axisId } = {},
                position,
                positionHasAxis,
            } = this.resolveAxis(orientation, properties.position);

            state.properties = properties;
            state.axisId = axisId;
            state.position = position;
            state.positionHasAxis = positionHasAxis;

            const show = this.updateVisibility(state, span);

            if (!show || axisId == null) continue;

            const { thickness, spacing, placement, tickSpacing } = properties;
            if (positionHasAxis) {
                scrollbars[axisId] = {
                    enabled: show,
                    thickness,
                    spacing,
                    tickSpacing,
                    placement,
                };
            } else {
                layoutBox.shrink(spacing + thickness, position);
            }

            this.updateStyles(state);
        }
    }

    private onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        const opts = this.opts;
        this.ctx.eventsHub.emit('axis-dom-proxy:update', {
            source: 'scrollbar',
            enabled: opts.enabled,
            enableDoubleClick: false,
            enableDragging: false,
            enableScrolling: opts.enableAxisScrolling,
            enableContextMenu: false,
        });

        this.seriesRect = event.series.rect;

        for (const orientation of ['horizontal', 'vertical'] as const) {
            const state = this.state[orientation];
            const {
                properties: { enabled, visible },
            } = state;
            if (!enabled || visible === 'never') {
                continue;
            }

            const layoutRect = this.getLayoutRect(state, orientation, event);
            state.layoutRect = layoutRect;

            if (!layoutRect) continue;

            this.updateTrack(state, layoutRect);
            this.updateThumb(state, layoutRect);
        }
    }

    private getLayoutRect(
        state: ScrollbarOrientationState,
        orientation: ScrollbarOrientation,
        event: _ModuleSupport.LayoutCompleteEvent
    ): _ModuleSupport.BBox | undefined {
        const {
            properties: { thickness, spacing },
            position,
            positionHasAxis,
        } = state;

        const axisLayout = state.axisId ? event.axes[state.axisId] : undefined;

        if (!axisLayout) return;

        const { x, y, width, height } = event.series.rect;
        const isHorizontal = orientation === 'horizontal';
        if (!positionHasAxis) {
            if (isHorizontal) {
                const coord = position === 'bottom' ? y + height + spacing : y - spacing - thickness;
                return new BBox(x, coord, width, thickness);
            } else {
                const coord = position === 'right' ? x + width + spacing : x - spacing - thickness;
                return new BBox(coord, y, thickness, height);
            }
        }

        const { scrollbar: scrollbarLayout, translation } = axisLayout;
        if (!scrollbarLayout?.enabled) return;

        const coord = isHorizontal ? translation.y + scrollbarLayout.offset : translation.x + scrollbarLayout.offset;

        return isHorizontal ? new BBox(x, coord, width, thickness) : new BBox(coord, y, thickness, height);
    }

    private updateStyles({ track, thumb, properties, hovered }: ScrollbarOrientationState) {
        // Colour refs are resolved during theme-merge before reaching the scene, so fill/stroke are concrete here.
        const trackStyle = properties.track as NormalisedScrollbarTrackStyle;
        const thumbStyle = properties.thumb as NormalisedScrollbarThumbStyle;

        track.setStyleProperties(trackStyle);
        track.cornerRadius = properties.track.cornerRadius;
        track.opacity = properties.track.opacity;

        thumb.setStyleProperties(thumbStyle);
        thumb.cornerRadius = properties.thumb.cornerRadius;
        thumb.opacity = properties.thumb.opacity;

        const hoverStyle = thumbStyle.hoverStyle;

        thumb.fill = hovered ? (hoverStyle?.fill ?? thumbStyle.fill) : thumbStyle.fill;
        thumb.stroke = hovered ? (hoverStyle?.stroke ?? thumbStyle.stroke) : thumbStyle.stroke;
    }

    private updateTrack(state: ScrollbarOrientationState, bounds: _ModuleSupport.BBox) {
        state.track.x = bounds.x;
        state.track.y = bounds.y;
        state.track.width = bounds.width;
        state.track.height = bounds.height;

        state.dom.updateBounds(bounds);
    }

    private updateThumb(state: ScrollbarOrientationState, track: _ModuleSupport.BBox) {
        const { min, max } = this.getZoomRange(state.orientation);
        const span = clamp(0, max - min, 1);
        const show = this.updateVisibility(state, span);

        if (!show || track.width <= 0 || track.height <= 0) {
            return;
        }

        const minSize = state.properties.thumb.minSize;
        let thumbSpan: number;
        if (state.orientation === 'horizontal') {
            const thumbWidth = Math.min(Math.max(minSize, track.width * span), track.width);
            const start = clamp(track.x, track.x + track.width * min, track.x + track.width - thumbWidth);
            state.thumb.x = start;
            state.thumb.y = track.y;
            state.thumb.width = thumbWidth;
            state.thumb.height = track.height;
            thumbSpan = clamp(0, thumbWidth / track.width, 1);
        } else {
            const thumbHeight = Math.min(Math.max(minSize, track.height * span), track.height);
            const start = clamp(track.y, track.y + track.height * min, track.y + track.height - thumbHeight);
            state.thumb.x = track.x;
            state.thumb.y = start;
            state.thumb.width = track.width;
            state.thumb.height = thumbHeight;
            thumbSpan = clamp(0, thumbHeight / track.height, 1);
        }

        state.dom.updateThumbBounds(state.thumb, track, state.properties.thumb.cornerRadius);
        state.dom.updateMinMax(min, max, thumbSpan);
    }

    private updateThumbs() {
        if (!this.seriesRect) return;

        for (const orientation of ['horizontal', 'vertical'] as const) {
            const state = this.state[orientation];
            const layoutRect = state.layoutRect;
            if (!layoutRect || !state.properties.enabled || state.properties.visible === 'never') continue;

            const trackBounds =
                orientation === 'horizontal'
                    ? new BBox(this.seriesRect.x, layoutRect.y, this.seriesRect.width, state.properties.thickness)
                    : new BBox(layoutRect.x, this.seriesRect.y, state.properties.thickness, this.seriesRect.height);

            this.updateThumb(state, trackBounds);
        }
    }

    private updateVisibility(state: ScrollbarOrientationState, span: number): boolean {
        const show =
            state.properties.enabled &&
            state.axisId != null &&
            state.properties.visible !== 'never' &&
            (state.properties.visible === 'always' || span < 1);

        state.group.visible = show;
        state.track.visible = show;
        state.thumb.visible = show;
        state.dom.updateVisibility(show);

        return show;
    }

    private getZoomRange(orientation: ScrollbarOrientation) {
        const zoom = this.ctx.chartState.getValue('zoom');
        const isHorizontal = orientation === 'horizontal';
        const range = isHorizontal ? zoom?.x : zoom?.y;
        if (!isHorizontal && range != null) {
            return {
                min: 1 - (range.max ?? 1),
                max: 1 - (range.min ?? 0),
            };
        }
        return {
            min: range?.min ?? 0,
            max: range?.max ?? 1,
        };
    }

    private handleUserChange(orientation: ScrollbarOrientation, min: number, max: number) {
        if (!this.ctx.interactionManager.isState(InteractionState.ZoomDraggable)) return;

        const isHorizontal = orientation === 'horizontal';
        if (!isHorizontal) {
            [min, max] = [1 - max, 1 - min];
        }

        const zoom = isHorizontal ? { x: { min, max } } : { y: { min, max } };
        this.ctx.zoomManager?.updateZoom(
            {
                source: 'user-interaction',
                sourceDetail: 'scrollbar',
            },
            zoom
        );
    }

    private handleHoverChange(orientation: ScrollbarOrientation, hovered: boolean) {
        const state = this.state[orientation];
        const nextHovered = hovered && state.group.visible;
        if (state.hovered === nextHovered) return;

        state.hovered = nextHovered;
        this.updateStyles(state);
        this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.SCENE_RENDER });
    }

    private onWheel(baseEvent: _ModuleSupport.ZoomInteractionWheelEvent) {
        if (!this.opts.enableSeriesAreaScrolling) return;
        return this.handleWheel(baseEvent);
    }

    private onAxisWheel(baseEvent: _ModuleSupport.ZoomInteractionAxisWheelEvent) {
        if (!this.opts.enableAxisScrolling) return;
        return this.handleWheel(baseEvent);
    }

    private onScrollbarWheel(baseEvent: _ModuleSupport.ZoomInteractionWheelEvent) {
        return this.handleWheel(baseEvent);
    }

    private handleWheel(baseEvent: _ModuleSupport.ZoomInteractionWheelEvent) {
        const { seriesRect, ctx } = this;
        const zoomManager = ctx.zoomManager!;
        const { event } = baseEvent;

        const isHorizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);

        const horizontalEnabled = this.opts.horizontal.enabled;
        const verticalEnabled = this.opts.vertical.enabled;
        if (isHorizontal && !horizontalEnabled) return;
        if (!isHorizontal && !verticalEnabled) return;

        baseEvent.stopProcessing();

        const direction = isHorizontal ? ChartAxisDirection.X : ChartAxisDirection.Y;
        const axisId = zoomManager.getPrimaryAxisId(direction);

        if (!seriesRect || !axisId) {
            baseEvent.abort();
            return;
        }

        const newAxisZooms = this.scrollPanner.update(
            event,
            SCROLLING_STEP,
            SCROLLING_MODE,
            seriesRect,
            zoomManager.getAxisZooms()
        );

        // At the extent the pan is a no-op; committing it would persist a span left marginally below 1 by
        // floating-point noise, tripping the `span < 1` auto-visibility check. Report capped to let the
        // page scroll instead.
        const next = newAxisZooms[axisId];
        const current = zoomManager.getAxisZoom(axisId);
        if (isNumberEqual(next.min, current.min) && isNumberEqual(next.max, current.max)) {
            baseEvent.capped();
            return;
        }

        const newZoom = { [direction]: { min: next.min, max: next.max } };
        zoomManager.updateZoom({ source: 'user-interaction', sourceDetail: 'scrollbar' }, newZoom);

        const zoom = this.getZoom();
        const isZoomCapped =
            (event.deltaY > 0 && zoom.y.min === UNIT_MIN) || (event.deltaY < 0 && zoom.y.max === UNIT_MAX);

        if (isZoomCapped) {
            baseEvent.capped();
        } else {
            baseEvent.uncapped();
        }
    }

    private getZoom() {
        return definedZoomState(this.ctx.chartState.getValue('zoom'));
    }

    override destroy() {
        super.destroy();
        this.state.horizontal.dom.destroy();
        this.state.vertical.dom.destroy();
    }
}
