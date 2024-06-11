import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { buildBounds, calculateAxisLabelPosition } from '../../utils/position';
import { CrosshairLabel, CrosshairLabelProperties } from './crosshairLabel';

type AgCrosshairLabelRendererResult = any;

const { Group, Line, BBox } = _Scene;
const { createId } = _Util;
const { POSITIVE_NUMBER, RATIO, BOOLEAN, COLOR_STRING, LINE_DASH, OBJECT, Validate, Layers } = _ModuleSupport;

export class Crosshair extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    readonly id = createId(this);

    @Validate(BOOLEAN)
    enabled = false;

    @Validate(COLOR_STRING, { optional: true })
    stroke?: string = 'rgb(195, 195, 195)';

    @Validate(LINE_DASH, { optional: true })
    lineDash?: number[] = [6, 3];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @Validate(RATIO)
    strokeOpacity: number = 1;

    @Validate(BOOLEAN)
    snap: boolean = true;

    @Validate(OBJECT)
    readonly label = new CrosshairLabelProperties();

    private readonly labels: { [key: string]: CrosshairLabel };

    private readonly axisCtx: _ModuleSupport.AxisContext;
    private seriesRect: _Scene.BBox = new BBox(0, 0, 0, 0);
    private hoverRect: _Scene.BBox = new BBox(0, 0, 0, 0);
    private bounds: _Scene.BBox = new BBox(0, 0, 0, 0);
    private visible: boolean = false;
    private axisLayout?: _ModuleSupport.AxisLayout & { id: string };
    private labelFormatter?: (value: any) => string;

    private readonly crosshairGroup: _Scene.Group = new Group({ layer: true, zIndex: Layers.SERIES_CROSSHAIR_ZINDEX });
    protected readonly lineGroup = this.crosshairGroup.appendChild(
        new Group({
            name: `${this.id}-crosshair-lines`,
            zIndex: Layers.SERIES_CROSSHAIR_ZINDEX,
        })
    );
    protected lineGroupSelection = _Scene.Selection.select(this.lineGroup, Line, false);

    private activeHighlight?: _ModuleSupport.HighlightChangeEvent['currentHighlight'] = undefined;
    constructor(private readonly ctx: _ModuleSupport.ModuleContextWithParent<_ModuleSupport.AxisContext>) {
        super();

        this.axisCtx = ctx.parent;
        this.crosshairGroup.visible = false;
        this.labels = {};

        const region = ctx.regionManager.getRegion('series')!;
        this.destroyFns.push(
            ctx.scene.attachNode(this.crosshairGroup),
            region.addListener('hover', (event) => this.onMouseMove(event)),
            region.addListener('leave', () => this.onMouseOut()),
            ctx.highlightManager.addListener('highlight-change', (event) => this.onHighlightChange(event)),
            ctx.layoutService.addListener('layout-complete', (event) => this.layout(event)),
            () => Object.entries(this.labels).forEach(([_, label]) => label.destroy())
        );
    }

    private layout({ series: { rect, paddedRect, visible }, axes }: _ModuleSupport.LayoutCompleteEvent) {
        this.hideCrosshairs();

        if (!(visible && axes && this.enabled)) {
            this.visible = false;
            return;
        }

        this.visible = true;
        this.seriesRect = rect;
        this.hoverRect = paddedRect;

        const { position: axisPosition = 'left', axisId } = this.axisCtx;

        const axisLayout = axes.find((a) => a.id === axisId);

        if (!axisLayout) {
            return;
        }

        this.axisLayout = axisLayout;
        const padding = axisLayout.gridPadding + axisLayout.seriesAreaPadding;
        this.bounds = buildBounds(rect, axisPosition, padding);

        const { crosshairGroup, bounds } = this;
        crosshairGroup.translationX = Math.round(bounds.x);
        crosshairGroup.translationY = Math.round(bounds.y);

        const crosshairKeys = ['pointer', ...this.axisCtx.seriesKeyProperties()];
        this.updateSelections(crosshairKeys);
        this.updateLines();
        this.updateLabels(crosshairKeys);
    }

    private updateSelections(data: string[]) {
        this.lineGroupSelection.update(
            data,
            (group) => group.append(new Line()),
            (key: string) => key
        );
    }

    private updateLabels(keys: string[]) {
        const { labels, ctx, axisLayout } = this;
        keys.forEach((key) => {
            labels[key] ??= new CrosshairLabel(ctx.domManager);

            this.updateLabel(labels[key]);
        });
        const format = this.label.format ?? axisLayout?.label.format;
        this.labelFormatter = this.axisCtx.scaleValueFormatter(format);
    }

    private updateLabel(label: CrosshairLabel) {
        const { enabled, className, xOffset, yOffset, format, renderer } = this.label;
        label.enabled = enabled;
        label.className = className;
        label.xOffset = xOffset;
        label.yOffset = yOffset;
        label.format = format;
        label.renderer = renderer;
    }

    private updateLines() {
        const { lineGroupSelection, bounds, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, axisLayout } =
            this;

        if (!axisLayout) {
            return;
        }

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
        return this.axisCtx.direction === 'x';
    }

    private formatValue(val: any): string {
        const {
            labelFormatter,
            axisLayout,
            ctx: { callbackCache },
        } = this;

        if (labelFormatter) {
            const result = callbackCache.call(labelFormatter, val);
            if (result !== undefined) return result;
        }

        const isInteger = val % 1 === 0;
        const fractionDigits = (axisLayout?.label.fractionDigits ?? 0) + (isInteger ? 0 : 1);

        return typeof val === 'number' ? val.toFixed(fractionDigits) : String(val);
    }

    private onMouseMove(event: _ModuleSupport.PointerInteractionEvent<'hover'>) {
        if (!this.enabled || this.snap) {
            return;
        }

        const { crosshairGroup, hoverRect } = this;
        const { offsetX, offsetY } = event;

        if (this.visible && hoverRect.containsPoint(offsetX, offsetY)) {
            crosshairGroup.visible = true;

            const lineData = this.getData(event);

            this.updatePositions(lineData);
        } else {
            this.hideCrosshairs();
        }
    }

    private onMouseOut() {
        this.hideCrosshairs();
    }

    private onHighlightChange(event: _ModuleSupport.HighlightChangeEvent) {
        if (!this.enabled) {
            return;
        }

        const { crosshairGroup, axisCtx } = this;
        const { datum, series } = event.currentHighlight ?? {};
        const hasCrosshair = datum && (series?.axes.x?.id === axisCtx.axisId || series?.axes.y?.id === axisCtx.axisId);

        this.activeHighlight = hasCrosshair ? event.currentHighlight : undefined;

        if (this.snap) {
            if (!this.visible || !this.activeHighlight) {
                this.hideCrosshairs();
                return;
            }

            const activeHighlightData = this.getActiveHighlightData(this.activeHighlight);

            this.updatePositions(activeHighlightData);

            crosshairGroup.visible = true;
        }
    }

    private updatePositions(data: { [key: string]: { value: any; position: number } }) {
        const { seriesRect, lineGroupSelection } = this;
        lineGroupSelection.each((line, key) => {
            const lineData = data[key];
            if (!lineData) {
                line.visible = false;
                return;
            }
            line.visible = true;

            const { value, position } = lineData;
            let x = 0;
            let y = 0;
            if (this.isVertical()) {
                x = position;
                line.translationX = Math.round(x);
            } else {
                y = position;
                line.translationY = Math.round(y);
            }

            if (this.label.enabled) {
                this.showLabel(x + seriesRect.x, y + seriesRect.y, value, key);
            } else {
                this.hideLabel(key);
            }
        });
    }

    private getData(event: _ModuleSupport.PointerInteractionEvent<'hover'>): {
        [key: string]: { position: number; value: any };
    } {
        const { seriesRect, axisCtx } = this;
        const key = 'pointer';
        const { datum, xKey = '', yKey = '' } = this.activeHighlight ?? {};
        const { offsetX, offsetY } = event;

        const x = offsetX - seriesRect.x;
        const y = offsetY - seriesRect.y;

        const isVertical = this.isVertical();
        const position = isVertical ? x : y;
        return {
            [key]: {
                position,
                value: axisCtx.continuous ? axisCtx.scaleInvert(position) : datum?.[isVertical ? xKey : yKey] ?? '',
            },
        };
    }

    private getActiveHighlightData(
        activeHighlight: Exclude<_ModuleSupport.HighlightChangeEvent['currentHighlight'], undefined>
    ): { [key: string]: { position: number; value: any } } {
        const { axisCtx } = this;
        const { datum, series, xKey = '', aggregatedValue, cumulativeValue, midPoint } = activeHighlight;
        const seriesKeyProperties = series.getKeyProperties(axisCtx.direction);

        const halfBandwidth = axisCtx.scaleBandwidth() / 2;

        const matchingAxisId = series.axes[axisCtx.direction]?.id === axisCtx.axisId;
        const isYKey = seriesKeyProperties.indexOf('yKey') > -1 && matchingAxisId;
        const isXKey = seriesKeyProperties.indexOf('xKey') > -1 && matchingAxisId;

        if (isYKey && aggregatedValue !== undefined) {
            return {
                yKey: { value: aggregatedValue!, position: axisCtx.scaleConvert(aggregatedValue) + halfBandwidth },
            };
        }

        if (isYKey && cumulativeValue !== undefined) {
            return {
                yKey: { value: cumulativeValue, position: axisCtx.scaleConvert(cumulativeValue) + halfBandwidth },
            };
        }

        if (isXKey) {
            const position = (this.isVertical() ? midPoint?.x : midPoint?.y) ?? 0;
            return {
                xKey: {
                    value: axisCtx.continuous ? axisCtx.scaleInvert(position) : datum[xKey],
                    position,
                },
            };
        }

        const activeHighlightData: Record<string, { position: number; value: any }> = {};

        seriesKeyProperties.forEach((key) => {
            const keyValue = series.properties[key];
            const value = datum[keyValue];
            const position = axisCtx.scaleConvert(value) + halfBandwidth;
            activeHighlightData[key] = { value, position };
        });

        return activeHighlightData;
    }

    private getLabelHtml(value: any, label: CrosshairLabel): string {
        const {
            label: { renderer: labelRenderer },
            axisLayout: { label: { fractionDigits = 0 } = {} } = {},
        } = this;
        const defaults: AgCrosshairLabelRendererResult = {
            text: this.formatValue(value),
        };

        if (labelRenderer) {
            const params = {
                value,
                fractionDigits,
            };
            return label.toLabelHtml(labelRenderer(params), defaults);
        }

        return label.toLabelHtml(defaults);
    }

    private showLabel(x: number, y: number, value: any, key: string) {
        const {
            axisCtx: { position: axisPosition, direction: axisDirection },
            bounds,
            axisLayout,
        } = this;

        if (!axisLayout) {
            return;
        }

        const {
            label: { padding: labelPadding },
            tickSize,
        } = axisLayout;

        const padding = labelPadding + tickSize;

        const label = this.labels[key];

        const html = this.getLabelHtml(value, label);

        label.setLabelHtml(html);
        const labelBBox = label.computeBBox();

        const labelMeta = calculateAxisLabelPosition({
            x,
            y,
            labelBBox,
            bounds,
            axisPosition,
            axisDirection,
            padding,
        });

        label.show(labelMeta);
    }

    private hideCrosshairs() {
        this.crosshairGroup.visible = false;
        for (const key in this.labels) {
            this.hideLabel(key);
        }
    }

    private hideLabel(key: string) {
        this.labels[key].toggle(false);
    }
}
