import { type AgCrosshairLabelRendererResult, _ModuleSupport } from 'ag-charts-community';

import { CrosshairLabel, CrosshairLabelProperties } from './crosshairLabel';

const {
    Group,
    TranslatableGroup,
    Line,
    BBox,
    createId,
    POSITIVE_NUMBER,
    RATIO,
    BOOLEAN,
    COLOR_STRING,
    LINE_DASH,
    OBJECT,
    InteractionState,
    Validate,
    ZIndexMap,
    formatNumber,
    isInteger,
    ChartAxisDirection,
} = _ModuleSupport;

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
    private seriesRect: _ModuleSupport.BBox = new BBox(0, 0, 0, 0);
    private hoverRect: _ModuleSupport.BBox = new BBox(0, 0, 0, 0);
    private bounds: _ModuleSupport.BBox = new BBox(0, 0, 0, 0);
    private axisLayout?: _ModuleSupport.AxisLayout;
    private labelFormatter?: (value: any) => string;

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

        const seriesRegion = ctx.regionManager.getRegion('series');
        const mouseMoveStates =
            InteractionState.Default | InteractionState.Annotations | InteractionState.AnnotationsSelected;

        this.hideCrosshairs();

        ctx.domManager.addEventListener('focusin', ({ target }) => {
            const isSeriesAreaChild = target instanceof HTMLElement && ctx.domManager.contains(target, 'series-area');
            if (this.crosshairGroup.visible && !isSeriesAreaChild) {
                this.hideCrosshairs();
                this.ctx.updateService.update(_ModuleSupport.ChartUpdateType.PERFORM_LAYOUT);
            }
        });

        this.destroyFns.push(
            ctx.scene.attachNode(this.crosshairGroup),
            seriesRegion.addListener('hover', (event) => this.onMouseMove(event), mouseMoveStates),
            seriesRegion.addListener(
                'drag',
                (event) => this.onMouseMove(event),
                InteractionState.Annotations | InteractionState.AnnotationsSelected
            ),
            seriesRegion.addListener('leave', () => this.onMouseOut(), mouseMoveStates),
            ctx.keyNavManager.addListener('nav-hori', () => this.onKeyPress()),
            ctx.keyNavManager.addListener('nav-vert', () => this.onKeyPress()),
            ctx.zoomManager.addListener('zoom-pan-start', () => this.onMouseOut()),
            ctx.zoomManager.addListener('zoom-change', () => this.onMouseOut()),
            ctx.highlightManager.addListener('highlight-change', (event) => this.onHighlightChange(event)),
            ctx.layoutManager.addListener('layout:complete', (event) => this.layout(event)),
            () => Object.entries(this.labels).forEach(([_, label]) => label.destroy())
        );
    }

    private layout({ series: { rect, paddedRect, visible }, axes }: _ModuleSupport.LayoutCompleteEvent) {
        if (!visible || !axes || !this.enabled) return;

        this.seriesRect = rect;
        this.hoverRect = paddedRect;

        const { position: axisPosition = 'left', axisId } = this.axisCtx;

        const axisLayout = axes.find((a) => a.id === axisId);

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
        this.lineGroupSelection.update(
            data,
            (group) => group.append(new Line()),
            (key: string) => key
        );
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
        this.labelFormatter = this.axisCtx.scaleValueFormatter(this.label.format);
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
        return this.axisCtx.direction === 'x';
    }

    private formatValue(value: unknown): string {
        const {
            labelFormatter,
            axisLayout,
            ctx: { callbackCache },
        } = this;

        if (labelFormatter) {
            const result = callbackCache.call(labelFormatter, value);
            if (result != null) {
                return result;
            }
        }
        if (typeof value === 'number') {
            const fractionDigits = (axisLayout?.label.fractionDigits ?? 0) + (isInteger(value) ? 0 : 1);
            return formatNumber(value, fractionDigits);
        }
        return String(value ?? '');
    }

    private onMouseMove(event: _ModuleSupport.RegionEvent<'hover' | 'drag'>) {
        if (!this.enabled || this.snap) return;

        const { crosshairGroup, hoverRect } = this;
        const { offsetX, offsetY } = event;

        if (hoverRect.containsPoint(offsetX, offsetY)) {
            const lineData = this.getData(event);

            this.updatePositions(lineData);

            crosshairGroup.visible = true;
        } else {
            this.hideCrosshairs();
        }

        this.ctx.updateService.update(_ModuleSupport.ChartUpdateType.SCENE_RENDER);
    }

    private onMouseOut() {
        this.hideCrosshairs();
        this.ctx.updateService.update(_ModuleSupport.ChartUpdateType.SCENE_RENDER);
    }

    private onKeyPress() {
        if (this.enabled && !this.snap) {
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

    private getData(event: _ModuleSupport.RegionEvent<'hover' | 'drag'>): {
        [key: string]: { position: number; value: any };
    } {
        const { axisCtx } = this;
        const key = 'pointer';
        const { datum, xKey = '', yKey = '' } = this.activeHighlight ?? {};
        const { regionOffsetX, regionOffsetY } = event;

        const isVertical = this.isVertical();
        const position = isVertical ? regionOffsetX : regionOffsetY;

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
        const { datum, series, xKey = '', aggregatedValue, cumulativeValue, midPoint } = activeHighlight;
        const seriesKeyProperties = series.getKeyProperties(axisCtx.direction);

        const halfBandwidth = (axisCtx.scale.bandwidth ?? 0) / 2;

        const matchingAxisId = series.axes[axisCtx.direction]?.id === axisCtx.axisId;
        const isYKey = seriesKeyProperties.indexOf('yKey') > -1 && matchingAxisId;
        const isXKey = seriesKeyProperties.indexOf('xKey') > -1 && matchingAxisId;

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
            const value = axisCtx.continuous ? axisCtx.scaleInvert(position) : datum[xKey];
            return this.isInRange(position) ? { xKey: { value, position } } : {};
        }

        const activeHighlightData: Record<string, { position: number; value: any }> = {};

        seriesKeyProperties.forEach((key) => {
            const keyValue = series.properties[key];
            const value = datum[keyValue];
            const position = axisCtx.scale.convert(value) + halfBandwidth;
            const isInRange = this.isInRange(position);

            if (isInRange) {
                activeHighlightData[key] = { value, position };
            }
        });

        return activeHighlightData;
    }

    private getLabelHtml(value: any, label: CrosshairLabel): string {
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
        let padding = this.axisLayout.label.padding + this.axisLayout.tickSize;

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
