import { type AgCartesianAxisPosition, _ModuleSupport } from 'ag-charts-community';
import {
    AbstractModuleInstance,
    ChartAxisDirection,
    ChartUpdateType,
    Property,
    UNIT_MAX,
    UNIT_MIN,
    ZIndexMap,
    clamp,
    definedZoomState,
} from 'ag-charts-core';

import { ZoomScrollPanner } from '../zoom-interaction/zoomScrollPanner';
import { ScrollbarDOMProxy } from './scrollbarDOMProxy';
import {
    HorizontalScrollbarProperties,
    ScrollbarThumb,
    ScrollbarTrack,
    VerticalScrollbarProperties,
} from './scrollbarProperties';

const { BBox, Group, Rect, LayoutElement, InteractionState } = _ModuleSupport;

type ScrollbarOrientation = 'horizontal' | 'vertical';

interface ScrollbarOrientationState {
    orientation: ScrollbarOrientation;
    group: _ModuleSupport.Group;
    track: _ModuleSupport.Rect;
    thumb: _ModuleSupport.Rect;
    dom: ScrollbarDOMProxy;
    properties: HorizontalScrollbarProperties | VerticalScrollbarProperties;
    layoutRect?: _ModuleSupport.BBox;
    position: AgCartesianAxisPosition;
    positionHasAxis: boolean;
    axisId?: string;
    hovered: boolean;
}

const SCROLLING_STEP = 0.1;
const SCROLLING_MODE = 'pan';

export class Scrollbar extends AbstractModuleInstance {
    @Property
    public enabled: boolean = false;

    @Property
    public enableAxisScrolling: boolean = false;

    @Property
    public enableSeriesAreaScrolling: boolean = false;

    @Property
    public thickness?: number;

    @Property
    public spacing?: number;

    @Property
    public tickSpacing?: number;

    @Property
    public placement?: 'inner' | 'outer';

    @Property
    public visible?: 'auto' | 'always' | 'never';

    @Property
    public track = new ScrollbarTrack();

    @Property
    public thumb = new ScrollbarThumb();

    @Property
    public horizontal = new HorizontalScrollbarProperties();

    @Property
    public vertical = new VerticalScrollbarProperties();

    private readonly state: Record<ScrollbarOrientation, ScrollbarOrientationState>;
    private seriesRect?: _ModuleSupport.BBox;

    private readonly scrollPanner = new ZoomScrollPanner();

    public constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
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

    private resolveProperties(orientation: ScrollbarOrientation) {
        // base properties are merged with orientation-specific properties in theme processing
        return orientation === 'horizontal' ? this.horizontal : this.vertical;
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
        this.ctx.eventsHub.emit('axis-dom-proxy:update', {
            source: 'scrollbar',
            enabled: this.enabled,
            enableDoubleClick: false,
            enableDragging: false,
            enableScrolling: this.enableAxisScrolling,
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
        track.setStyleProperties(properties.track);
        track.cornerRadius = properties.track.cornerRadius ?? 0;
        track.opacity = properties.track.opacity ?? 1;

        thumb.setStyleProperties(properties.thumb);
        thumb.cornerRadius = properties.thumb.cornerRadius ?? 0;
        thumb.opacity = properties.thumb.opacity ?? 1;

        const hoverStyle = properties.thumb.hoverStyle;

        thumb.fill = hovered ? hoverStyle?.fill ?? properties.thumb.fill : properties.thumb.fill;
        thumb.stroke = hovered ? hoverStyle?.stroke ?? properties.thumb.stroke : properties.thumb.stroke;
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

        const minSize = state.properties.thumb.minSize ?? 0;
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
        const zoom = this.ctx.zoomManager.getZoom();
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
        this.ctx.zoomManager.updateZoom(
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
        if (!this.enableSeriesAreaScrolling) return;
        return this.handleWheel(baseEvent);
    }

    private onAxisWheel(baseEvent: _ModuleSupport.ZoomInteractionAxisWheelEvent) {
        if (!this.enableAxisScrolling) return;
        return this.handleWheel(baseEvent);
    }

    private onScrollbarWheel(baseEvent: _ModuleSupport.ZoomInteractionWheelEvent) {
        return this.handleWheel(baseEvent);
    }

    private handleWheel(baseEvent: _ModuleSupport.ZoomInteractionWheelEvent) {
        const {
            seriesRect,
            ctx: { zoomManager },
        } = this;
        const { event } = baseEvent;

        const isHorizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);

        if (isHorizontal && !this.horizontal.enabled) return;
        if (!isHorizontal && !this.vertical.enabled) return;

        baseEvent.stopProcessing();

        const direction = isHorizontal ? ChartAxisDirection.X : ChartAxisDirection.Y;
        const axisId = this.ctx.zoomManager.getPrimaryAxisId(direction);

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
        const newZoom = { [direction]: { min: newAxisZooms[axisId].min, max: newAxisZooms[axisId].max } };
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
        return definedZoomState(this.ctx.zoomManager.getZoom());
    }

    override destroy() {
        super.destroy();
        this.state.horizontal.dom.destroy();
        this.state.vertical.dom.destroy();
    }
}
