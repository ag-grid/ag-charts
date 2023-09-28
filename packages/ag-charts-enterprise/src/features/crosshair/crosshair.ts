import type { AgCartesianAxisPosition } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
import type { LabelMeta } from './crosshairLabel';
import { CrosshairLabel } from './crosshairLabel';

type AgCrosshairLabelRendererResult = any;

const { Group, Line, BBox } = _Scene;
const { Validate, NUMBER, BOOLEAN, OPT_COLOR_STRING, OPT_LINE_DASH, Layers } = _ModuleSupport;

export class Crosshair extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @Validate(BOOLEAN)
    enabled = false;

    @Validate(OPT_COLOR_STRING)
    stroke?: string = 'rgb(195, 195, 195)';

    @Validate(OPT_LINE_DASH)
    lineDash?: number[] = [6, 3];

    @Validate(NUMBER(0))
    lineDashOffset: number = 0;

    @Validate(NUMBER(0))
    strokeWidth: number = 1;

    @Validate(NUMBER(0, 1))
    strokeOpacity: number = 1;

    @Validate(BOOLEAN)
    snap: boolean = true;

    readonly label: CrosshairLabel;
    private seriesRect: _Scene.BBox = new BBox(0, 0, 0, 0);
    private hoverRect: _Scene.BBox = new BBox(0, 0, 0, 0);
    private bounds: _Scene.BBox = new BBox(0, 0, 0, 0);
    private visible: boolean = false;
    private axisCtx: _ModuleSupport.AxisContext;
    private axisLayout?: _ModuleSupport.AxisLayout & {
        id: string;
    };
    private labelFormatter?: (value: any) => string;

    private crosshairGroup: _Scene.Group = new Group({ layer: true, zIndex: Layers.SERIES_CROSSHAIR_ZINDEX });
    private lineNode: _Scene.Line = this.crosshairGroup.appendChild(new Line());

    private activeHighlight?: _ModuleSupport.HighlightChangeEvent['currentHighlight'] = undefined;
    constructor(private readonly ctx: _ModuleSupport.ModuleContextWithParent<_ModuleSupport.AxisContext>) {
        super();

        ctx.scene.root?.appendChild(this.crosshairGroup);

        this.axisCtx = ctx.parent;
        this.crosshairGroup.visible = false;
        this.label = new CrosshairLabel(ctx.document, ctx.scene.canvas.container ?? ctx.document.body);

        this.destroyFns.push(
            ctx.interactionManager.addListener('hover', (event) => this.onMouseMove(event)),
            ctx.interactionManager.addListener('leave', () => this.onMouseOut()),
            ctx.highlightManager.addListener('highlight-change', (event) => this.onHighlightChange(event)),
            ctx.layoutService.addListener('layout-complete', (event) => this.layout(event)),
            () => ctx.scene.root?.removeChild(this.crosshairGroup),
            () => this.label.destroy()
        );
    }

    private layout({ series: { rect, paddedRect, visible }, axes }: _ModuleSupport.LayoutCompleteEvent) {
        this.hideCrosshair();

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
        this.bounds = this.buildBounds(rect, axisPosition, padding);

        const { crosshairGroup, bounds } = this;
        crosshairGroup.translationX = Math.round(bounds.x);
        crosshairGroup.translationY = Math.round(
            axisPosition === 'top' || axisPosition === 'bottom' ? bounds.y + bounds.height : bounds.y
        );

        const rotation = axisPosition === 'top' || axisPosition === 'bottom' ? -Math.PI / 2 : 0;
        crosshairGroup.rotation = rotation;

        this.updateLine();

        const format = this.label.format ?? axisLayout.label.format;
        this.labelFormatter = format ? this.axisCtx.scaleValueFormatter(format) : undefined;
    }

    private buildBounds(rect: _Scene.BBox, axisPosition: AgCartesianAxisPosition, padding: number): _Scene.BBox {
        const bounds = rect.clone();
        bounds.x += axisPosition === 'left' ? -padding : 0;
        bounds.y += axisPosition === 'top' ? -padding : 0;
        bounds.width += axisPosition === 'left' || axisPosition === 'right' ? padding : 0;
        bounds.height += axisPosition === 'top' || axisPosition === 'bottom' ? padding : 0;

        return bounds;
    }

    private updateLine() {
        const {
            lineNode: line,
            bounds,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            axisCtx,
            axisLayout,
        } = this;

        if (!axisLayout) {
            return;
        }
        line.stroke = stroke;
        line.strokeWidth = strokeWidth;
        line.strokeOpacity = strokeOpacity;
        line.lineDash = lineDash;
        line.lineDashOffset = lineDashOffset;

        line.y1 = line.y2 = 0;
        line.x1 = 0;
        line.x2 = axisCtx.direction === 'x' ? bounds.height : bounds.width;
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

    private onMouseMove(event: _ModuleSupport.InteractionEvent<'hover'>) {
        const { crosshairGroup, snap, seriesRect, hoverRect, axisCtx, visible, activeHighlight } = this;
        if (snap || !this.enabled) {
            return;
        }

        const { offsetX, offsetY } = event;

        if (visible && hoverRect.containsPoint(offsetX, offsetY)) {
            crosshairGroup.visible = true;

            const highlight = activeHighlight ? this.getActiveHighlight(activeHighlight) : undefined;
            let value;
            let clampedX = 0;
            let clampedY = 0;
            if (axisCtx.direction === 'x') {
                clampedX = Math.max(Math.min(seriesRect.x + seriesRect.width, offsetX), seriesRect.x);
                crosshairGroup.translationX = Math.round(clampedX);
                value = axisCtx.continuous ? axisCtx.scaleInvert(offsetX - seriesRect.x) : highlight?.value;
            } else {
                clampedY = Math.max(Math.min(seriesRect.y + seriesRect.height, offsetY), seriesRect.y);
                crosshairGroup.translationY = Math.round(clampedY);
                value = axisCtx.continuous ? axisCtx.scaleInvert(offsetY - seriesRect.y) : highlight?.value;
            }

            if (value && this.label.enabled) {
                this.showLabel(clampedX, clampedY, value);
            } else {
                this.hideLabel();
            }
        } else {
            this.hideCrosshair();
        }
    }

    private onMouseOut() {
        this.hideLabel();
        this.hideCrosshair();
    }

    private onHighlightChange(event: _ModuleSupport.HighlightChangeEvent) {
        const { enabled, crosshairGroup, snap, seriesRect, axisCtx, visible } = this;

        if (!enabled) {
            return;
        }

        const { currentHighlight } = event;

        const hasCrosshair =
            currentHighlight &&
            currentHighlight.datum &&
            (currentHighlight.series.axes.x.id === axisCtx.axisId ||
                currentHighlight.series.axes.y.id === axisCtx.axisId);

        if (!hasCrosshair) {
            this.activeHighlight = undefined;
        } else {
            this.activeHighlight = currentHighlight;
        }

        if (!snap) {
            return;
        }

        if (visible && this.activeHighlight) {
            crosshairGroup.visible = true;

            const { value, position } = this.getActiveHighlight(this.activeHighlight);

            let x = 0;
            let y = 0;
            if (axisCtx.direction === 'x') {
                x = position;
                crosshairGroup.translationX = Math.round(x + seriesRect.x);
            } else {
                y = position;
                crosshairGroup.translationY = Math.round(y + seriesRect.y);
            }

            if (this.label.enabled) {
                this.showLabel(x + seriesRect.x, y + seriesRect.y, value);
            } else {
                this.hideLabel();
            }
        } else {
            this.hideCrosshair();
        }
    }

    private getActiveHighlight(
        activeHighlight: Exclude<_ModuleSupport.HighlightChangeEvent['currentHighlight'], undefined>
    ): { position: number; value: any } {
        const { axisCtx } = this;
        const { datum, xKey = '', yKey = '', aggregatedValue, series, cumulativeValue, nodeMidPoint } = activeHighlight;
        const halfBandwidth = axisCtx.scaleBandwidth() / 2;
        if (aggregatedValue !== undefined && series.axes.y.id === axisCtx.axisId) {
            return { value: aggregatedValue!, position: axisCtx.scaleConvert(aggregatedValue) + halfBandwidth };
        }

        const isYValue = axisCtx.keys().indexOf(yKey) >= 0;
        if (cumulativeValue !== undefined && isYValue) {
            return { value: cumulativeValue, position: axisCtx.scaleConvert(cumulativeValue) + halfBandwidth };
        }

        const key = isYValue ? yKey : xKey;
        const position = (axisCtx.direction === 'x' ? nodeMidPoint?.x : nodeMidPoint?.y) ?? 0;
        const value = axisCtx.continuous ? axisCtx.scaleInvert(position) : datum[key];
        return { value, position };
    }

    private getLabelHtml(value: any): string {
        const { label, axisLayout: { label: { fractionDigits = 0 } = {} } = {} } = this;
        const { renderer: labelRenderer } = label;
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

    private showLabel(x: number, y: number, value: any) {
        const { axisCtx, bounds, label, axisLayout } = this;

        if (!axisLayout) {
            return;
        }

        const {
            label: { padding: labelPadding },
            tickSize,
        } = axisLayout;

        const padding = labelPadding + tickSize;

        const html = this.getLabelHtml(value);
        label.setLabelHtml(html);
        const labelBBox = label.computeBBox();

        let labelMeta: LabelMeta;
        if (axisCtx.direction === 'x') {
            const xOffset = -labelBBox.width / 2;
            const yOffset = axisCtx.position === 'bottom' ? 0 : -labelBBox.height;
            const fixedY = axisCtx.position === 'bottom' ? bounds.y + bounds.height + padding : bounds.y - padding;
            labelMeta = {
                x: x + xOffset,
                y: fixedY + yOffset,
            };
        } else {
            const yOffset = -labelBBox.height / 2;
            const xOffset = axisCtx.position === 'right' ? 0 : -labelBBox.width;
            const fixedX = axisCtx.position === 'right' ? bounds.x + bounds.width + padding : bounds.x - padding;
            labelMeta = {
                x: fixedX + xOffset,
                y: y + yOffset,
            };
        }

        label.show(labelMeta);
    }

    private hideCrosshair() {
        this.crosshairGroup.visible = false;
        this.hideLabel();
    }

    private hideLabel() {
        this.label.toggle(false);
    }
}
