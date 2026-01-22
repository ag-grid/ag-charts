import { type AgCrosshairLabelRendererResult, _ModuleSupport, _Widget } from 'ag-charts-community';
import {
    AbstractModuleInstance,
    ChartAxisDirection,
    ChartUpdateType,
    Property,
    ZIndexMap,
    createId,
    toPlainText,
} from 'ag-charts-core';

import { readDatum } from '../../utils/datum';
import { CrosshairLabel, CrosshairLabelProperties } from './crosshairLabel';

const { Group, TranslatableGroup, Line, BBox, InteractionState } = _ModuleSupport;
type HoverLikeEvent =
    | _Widget.DragWidgetEvent
    | _Widget.MouseWidgetEvent<'mousemove'>
    | _ModuleSupport.DragInterpreterClickEvent;

export class Crosshair extends AbstractModuleInstance {
    static readonly className = 'Crosshair';
    readonly id = createId(this);

    @Property
    enabled = false;

    @Property
    stroke?: string = 'rgb(195, 195, 195)';

    @Property
    lineDash?: number[] = [6, 3];

    @Property
    lineDashOffset: number = 0;

    @Property
    strokeWidth: number = 1;

    @Property
    strokeOpacity: number = 1;

    @Property
    snap: boolean = true;

    @Property
    readonly label = new CrosshairLabelProperties();

    private readonly labels: { [key: string]: CrosshairLabel };

    private readonly axisCtx: _ModuleSupport.AxisContext;
    private seriesRect: _ModuleSupport.BBox = new BBox(0, 0, 0, 0);
    private bounds: _ModuleSupport.BBox = new BBox(0, 0, 0, 0);
    private axisLayout?: _ModuleSupport.AxisLayout;

    private readonly crosshairGroup = new TranslatableGroup({
        name: 'crosshairs',
        zIndex: ZIndexMap.SERIES_CROSSHAIR,
    });
    protected readonly lineGroup = this.crosshairGroup.appendChild(
        new Group({
            name: `${this.id}-crosshair-lines`,
            zIndex: ZIndexMap.SERIES_CROSSHAIR,
        })
    );
    protected lineGroupSelection = _ModuleSupport.Selection.select(this.lineGroup, Line, false);

    private activeHighlight?: _ModuleSupport.HighlightChangeEvent['currentHighlight'] = undefined;
    constructor(private readonly ctx: _ModuleSupport.ModuleContextWithParent<_ModuleSupport.AxisContext>) {
        super();

        this.axisCtx = ctx.parent;
        this.labels = {};

        this.hideCrosshairs();

        ctx.domManager.addEventListener('focusin', ({ target }) => {
            if (this.checkInteractionState()) return;
            const isSeriesAreaChild = target instanceof HTMLElement && ctx.domManager.contains(target, 'series-area');
            if (this.crosshairGroup.visible && !isSeriesAreaChild) {
                this.hideCrosshairs();
                this.ctx.updateService.update(ChartUpdateType.SCENE_RENDER);
            }
        });

        const { seriesDragInterpreter } = ctx.widgets;
        this.cleanup.register(
            ctx.scene.attachNode(this.crosshairGroup),
            ctx.widgets.seriesWidget.addListener('mousemove', (event) => this.onMouseHoverLike(event)),
            ctx.widgets.seriesWidget.addListener('mouseleave', () => this.onMouseOut()),
            ctx.eventsHub.on('series:focus-change', () => this.onKeyPress()),
            ctx.eventsHub.on('zoom:pan-start', () => this.onMouseOut()),
            ctx.eventsHub.on('zoom:change-complete', () => this.onMouseOut()),
            ctx.eventsHub.on('highlight:change', (event) => this.onHighlightChange(event)),
            ctx.eventsHub.on('layout:complete', (event) => this.layout(event)),
            () => {
                for (const label of Object.values(this.labels)) {
                    label.destroy();
                }
            }
        );
        if (seriesDragInterpreter) {
            this.cleanup.register(
                seriesDragInterpreter.events.on('drag-move', (event) => this.onMouseHoverLike(event)),
                seriesDragInterpreter.events.on('click', (event) => this.onClick(event))
            );
        }
    }

    private checkInteractionState(): boolean {
        return this.ctx.interactionManager.isState(InteractionState.Frozen);
    }

    private layout({ series: { rect, visible }, axes }: _ModuleSupport.LayoutCompleteEvent) {
        if (!visible || !axes || !this.enabled) return;

        this.seriesRect = rect;

        const { position: axisPosition = 'left', axisId } = this.axisCtx;

        const axisLayout = axes[axisId];

        if (!axisLayout) return;

        this.axisLayout = axisLayout;
        this.bounds = rect.clone().grow(axisLayout.gridPadding + axisLayout.seriesAreaPadding, axisPosition);

        const { crosshairGroup, bounds } = this;
        crosshairGroup.translationX = Math.round(bounds.x);
        crosshairGroup.translationY = Math.round(bounds.y);

        const crosshairKeys = ['pointer', ...this.axisCtx.seriesKeyProperties()];
        this.updateSelections(crosshairKeys);
        this.updateLines();
        this.updateLabels(crosshairKeys);
    }

    private updateSelections(data: string[]) {
        this.lineGroupSelection.update(data, undefined, (key: string) => key);
    }

    private updateLabels(keys: string[]) {
        const { labels, ctx } = this;
        for (const key of keys) {
            // Lazy creation of labels if enabled.
            if (this.label.enabled) {
                labels[key] ??= new CrosshairLabel(ctx.domManager, key, this.axisCtx.axisId);
            }

            if (labels[key]) {
                this.updateLabel(labels[key]);
            }
        }
    }

    private updateLabel(label: CrosshairLabel) {
        const { enabled, xOffset, yOffset, format, renderer } = this.label;
        label.enabled = enabled;
        label.xOffset = xOffset;
        label.yOffset = yOffset;
        label.format = format;
        label.renderer = renderer;
    }

    private updateLines() {
        const { lineGroupSelection, bounds, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, axisLayout } =
            this;

        if (!axisLayout) return;

        const isVertical = this.isVertical();

        lineGroupSelection.each((line) => {
            line.stroke = stroke;
            line.strokeWidth = strokeWidth;
            line.strokeOpacity = strokeOpacity;
            line.lineDash = lineDash;
            line.lineDashOffset = lineDashOffset;

            line.y1 = 0;
            line.y2 = isVertical ? bounds.height : 0;
            line.x1 = 0;
            line.x2 = isVertical ? 0 : bounds.width;
        });
    }

    private isVertical(): boolean {
        return this.axisCtx.direction === ChartAxisDirection.X;
    }

    private isHover(event: HoverLikeEvent): boolean {
        return (
            event.type === 'mousemove' ||
            event.type === 'click' ||
            (event.device === 'touch' && this.ctx.chartService.touch.dragAction === 'hover')
        );
    }

    private formatValue(value: unknown): string {
        return toPlainText(this.axisCtx.formatScaleValue(value, 'crosshair', this.label));
    }

    private onClick(event: _ModuleSupport.DragInterpreterClickEvent) {
        if (event.device === 'touch') {
            this.onMouseHoverLike(event);
        }
    }

    private onMouseHoverLike(event: HoverLikeEvent) {
        if (!this.enabled || this.snap) return;

        const requiredState = this.isHover(event) ? InteractionState.Clickable : InteractionState.AnnotationsMoveable;
        if (!this.ctx.interactionManager.isState(requiredState)) return;

        this.updatePositions(this.getData(event));
        this.crosshairGroup.visible = true;

        this.ctx.updateService.update(ChartUpdateType.SCENE_RENDER);
    }

    private onMouseOut() {
        if (!this.ctx.interactionManager.isState(InteractionState.Clickable)) return;
        this.hideCrosshairs();
        this.ctx.updateService.update(ChartUpdateType.SCENE_RENDER);
    }

    private onKeyPress() {
        if (this.enabled && !this.snap && this.ctx.interactionManager.isState(InteractionState.Default)) {
            this.hideCrosshairs();
        }
    }

    private onHighlightChange(event: _ModuleSupport.HighlightChangeEvent) {
        if (!this.enabled) return;

        const { crosshairGroup, axisCtx } = this;
        const { datum, series } = event.currentHighlight ?? {};
        const hasCrosshair = datum && (series?.axes.x?.id === axisCtx.axisId || series?.axes.y?.id === axisCtx.axisId);

        this.activeHighlight = hasCrosshair ? event.currentHighlight : undefined;

        if (!this.activeHighlight) {
            this.hideCrosshairs();
        } else if (this.snap) {
            const activeHighlightData = this.getActiveHighlightData(this.activeHighlight);

            this.updatePositions(activeHighlightData);

            crosshairGroup.visible = true;
        }
    }

    private isInRange(value: number) {
        return this.axisCtx.inRange(value);
    }

    private updatePositions(data: { [key: string]: { value: any; position: number } }) {
        const { seriesRect, lineGroupSelection } = this;
        lineGroupSelection.each((line, key) => {
            const lineData = data[key];
            if (!lineData) {
                line.visible = false;
                this.hideLabel(key);
                return;
            }
            line.visible = true;

            const { value, position } = lineData;
            let x = 0;
            let y = 0;
            if (this.isVertical()) {
                x = position;
                line.x = Math.round(x);
            } else {
                y = position;
                line.y = Math.round(y);
            }

            if (this.label.enabled) {
                this.showLabel(x + seriesRect.x, y + seriesRect.y, value, key);
            } else {
                this.hideLabel(key);
            }
        });
    }

    private getData(event: { currentX: number; currentY: number }): {
        [key: string]: { position: number; value: any };
    } {
        const { axisCtx } = this;
        const key = 'pointer';
        const { xKey = '', yKey = '' } = this.activeHighlight ?? {};
        const { currentX, currentY } = event;
        const datum = readDatum(this.activeHighlight);

        const isVertical = this.isVertical();
        const position = isVertical ? currentX : currentY;

        let value = datum?.[isVertical ? xKey : yKey] ?? '';
        if (axisCtx.continuous) {
            value = axisCtx.scaleInvert(position);
        }

        return { [key]: { position, value } };
    }

    private getActiveHighlightData(
        activeHighlight: Exclude<_ModuleSupport.HighlightChangeEvent['currentHighlight'], undefined>
    ): { [key: string]: { position: number; value: any } } {
        const { axisCtx } = this;
        const { series, xKey = '', aggregatedValue, cumulativeValue, midPoint } = activeHighlight;
        const datum = readDatum(activeHighlight);
        const seriesKeyProperties = series.getKeyProperties(axisCtx.direction);

        const halfBandwidth = (axisCtx.scale.bandwidth ?? 0) / 2;

        const matchingAxisId = series.axes[axisCtx.direction]?.id === axisCtx.axisId;
        const isYKey = seriesKeyProperties.includes('yKey') && matchingAxisId;
        const isXKey = seriesKeyProperties.includes('xKey') && matchingAxisId;

        const datumValue = aggregatedValue ?? cumulativeValue;
        if (isYKey && datumValue !== undefined) {
            const position = axisCtx.scale.convert(datumValue) + halfBandwidth;
            const isInRange = this.isInRange(position);
            return isInRange
                ? {
                      yKey: { value: datumValue, position },
                  }
                : {};
        }

        if (isXKey) {
            const position = (this.isVertical() ? midPoint?.x : midPoint?.y) ?? 0;
            const value = axisCtx.continuous ? axisCtx.scaleInvert(position) : datum?.[xKey];
            return this.isInRange(position) ? { xKey: { value, position } } : {};
        }

        const activeHighlightData: Record<string, { position: number; value: any }> = {};

        for (const key of seriesKeyProperties) {
            const keyValue = series.properties[key];
            const value = datum?.[keyValue];
            const position = axisCtx.scale.convert(value) + halfBandwidth;
            const isInRange = this.isInRange(position);

            if (isInRange) {
                activeHighlightData[key] = { value, position };
            }
        }

        return activeHighlightData;
    }

    private getLabelHtml(value: any, label: CrosshairLabel) {
        const fractionDigits = this.axisLayout?.label?.fractionDigits ?? 0;
        const defaults: AgCrosshairLabelRendererResult = { text: this.formatValue(value) };
        if (this.label.renderer) {
            return label.toLabelHtml(this.label.renderer({ value, fractionDigits }), defaults);
        }
        return label.toLabelHtml(defaults);
    }

    private showLabel(x: number, y: number, value: any, key: string) {
        if (!this.axisLayout) return;

        const { bounds } = this;
        const label = this.labels[key];
        const html = this.getLabelHtml(value, label);

        label.setLabelHtml(html);

        const { width, height } = label.getBBox();
        const axisPosition = this.axisCtx.position;
        let padding = this.axisLayout.label.spacing + this.axisLayout.tickSize;

        if (this.axisCtx.direction === ChartAxisDirection.X) {
            padding -= 4;
            label.show({
                x: x - width / 2,
                y: axisPosition === 'bottom' ? bounds.y + bounds.height + padding : bounds.y - height - padding,
            });
        } else {
            padding -= 8;
            label.show({
                x: axisPosition === 'right' ? bounds.x + bounds.width + padding : bounds.x - width - padding,
                y: y - height / 2,
            });
        }
    }

    private hideCrosshairs() {
        this.crosshairGroup.visible = false;
        for (const key of Object.keys(this.labels)) {
            this.hideLabel(key);
        }
    }

    private hideLabel(key: string) {
        this.labels[key]?.toggle(false);
    }
}
