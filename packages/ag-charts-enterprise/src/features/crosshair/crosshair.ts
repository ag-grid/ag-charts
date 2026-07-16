import {
    type AgCrosshairLabelFormatterParams,
    type AgCrosshairLabelRendererResult,
    type ContextDefault,
    type FormatterParams,
    type TextValue,
    _ModuleSupport,
    _Widget,
} from 'ag-charts-community';
import {
    AbstractModuleInstance,
    ChartAxisDirection,
    ChartUpdateType,
    type NormalisedCrosshairOptions,
    ZIndexMap,
    coerceTextValue,
    createId,
    toPlainText,
} from 'ag-charts-core';

import { readDatum } from '../../utils/datum';
import { CrosshairLabel } from './crosshairLabel';

const { Group, TranslatableGroup, Line, BBox, FormatManager, InteractionState } = _ModuleSupport;
type HoverLikeEvent =
    | _Widget.DragWidgetEvent
    | _Widget.MouseWidgetEvent<'mousemove'>
    | _ModuleSupport.DragInterpreterClickEvent;

interface FormatterCache {
    type: string;
    format: string;
    formatter: ((value: any, fractionDigits?: number) => string) | undefined;
}

export class Crosshair
    extends AbstractModuleInstance
    implements _ModuleSupport.AxisFormattableLabel<AgCrosshairLabelFormatterParams<ContextDefault>, FormatterParams>
{
    static readonly className = 'Crosshair';
    readonly id = createId(this);

    private options: NormalisedCrosshairOptions | undefined;

    /**
     * Read by `CartesianChart.adjustAxisWidth` to skip axis-bleeding-width
     * adjustment when a crosshair is active (so the axis-label space the
     * crosshair would otherwise occupy is not reclaimed by the layout).
     * Pre-Phase-5 this was the `@Property enabled` field; after the
     * options-reference migration it lives inside `options.enabled`.
     */
    get enabled(): boolean {
        return this.options?.enabled ?? false;
    }

    private readonly labels: { [key: string]: CrosshairLabel };

    private readonly axisCtx: _ModuleSupport.AxisContext;
    private seriesRect: _ModuleSupport.BBox = new BBox(0, 0, 0, 0);
    private bounds: _ModuleSupport.BBox = new BBox(0, 0, 0, 0);
    private axisLayout?: _ModuleSupport.AxisLayout;

    private cachedFormatter: FormatterCache | undefined;

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
    protected lineGroupSelection = _ModuleSupport.Selection.select(this.lineGroup, Line<string>, false);

    private activeHighlight?: _ModuleSupport.HighlightChangeEvent['currentHighlight'] = undefined;
    private activeHighlightInViewport: boolean = false;

    constructor(private readonly ctx: _ModuleSupport.ChartAxisRegistry<_ModuleSupport.AxisContext>) {
        super();

        this.axisCtx = ctx.parent;
        this.labels = {};

        this.hideCrosshairs();

        ctx.domManager.addEventListener('focusin', ({ target }) => {
            if (this.checkInteractionState()) return;
            const isSeriesAreaChild = target instanceof HTMLElement && ctx.domManager.contains(target, 'series-area');
            if (this.crosshairGroup.visible && !isSeriesAreaChild) {
                this.hideCrosshairs();
                this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.SCENE_RENDER });
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

    applyOptions(options: NormalisedCrosshairOptions) {
        this.options = options;
    }

    formatValue(
        callWithContext: (
            formatter: (params: AgCrosshairLabelFormatterParams<ContextDefault>) => TextValue | undefined,
            params: AgCrosshairLabelFormatterParams<ContextDefault>
        ) => TextValue | undefined,
        type: 'number' | 'date' | 'category',
        value: any,
        params: FormatterParams<any>
    ) {
        const label = this.options?.label;
        if (!label) return undefined;

        const { formatter, format } = label;
        const { domain, boundSeries } = params;

        let result: TextValue | undefined;
        if (formatter != null) {
            const fractionDigits = params.type === 'number' ? params.fractionDigits : undefined;
            const unit = params.type === 'date' ? params.unit : undefined;
            const step = params.type === 'date' ? params.step : undefined;
            result = callWithContext(formatter, { value, domain, fractionDigits, unit, step, boundSeries });
        }

        if (format != null) {
            let cachedFormatter = this.cachedFormatter;
            if (cachedFormatter?.type !== type || cachedFormatter?.format !== format) {
                cachedFormatter = {
                    type,
                    format,
                    formatter: FormatManager.getFormatter(type, format),
                };
                this.cachedFormatter = cachedFormatter;
            }

            result ??= cachedFormatter.formatter?.(value);
        }

        return result == null ? undefined : String(result);
    }

    private checkInteractionState(): boolean {
        return this.ctx.interactionManager.isState(InteractionState.Frozen);
    }

    private layout({ series: { rect, visible }, axes }: _ModuleSupport.LayoutCompleteEvent) {
        const options = this.options;
        if (!visible || !axes || !options?.enabled) return;

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

        if (!options.snap && this.activeHighlight) {
            // AG-16861 TC9. If we're hovering over a candlestick and click it, then this fires a layout:complete
            // event. But we don't need to refresh the positioning of the Y-axis (non-snapping); the non-snap
            // positioning can stay as-is to stay in sync with the mouse position.
            return;
        }

        this.updateLines();
        this.updateLabels(crosshairKeys);

        if (options.snap && !this.activeHighlightInViewport) {
            // Do not redraw the crosshair labels when the highlight is outside the viewport.
            return;
        }

        this.refreshPositions();
    }

    private updateSelections(data: string[]) {
        this.lineGroupSelection.update(data, undefined, (key: string) => key);
    }

    private updateLabels(keys: string[]) {
        const { labels, ctx } = this;
        const labelOpts = this.options?.label;
        for (const key of keys) {
            // Lazy creation of labels if enabled.
            if (labelOpts?.enabled) {
                labels[key] ??= new CrosshairLabel(ctx.domManager, key, this.axisCtx.axisId);
            }

            if (labels[key]) {
                this.updateLabel(labels[key]);
            }
        }
    }

    private updateLabel(label: CrosshairLabel) {
        const labelOpts = this.options?.label;
        if (!labelOpts) return;
        label.xOffset = labelOpts.xOffset;
        label.yOffset = labelOpts.yOffset;
    }

    private updateLines() {
        const options = this.options;
        const { lineGroupSelection, bounds, axisLayout } = this;

        if (!axisLayout || !options) return;

        const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = options;
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
            (event.device === 'touch' && this.ctx.chartState.getValue('options', 'touch').dragAction === 'hover')
        );
    }

    private formatScaleText(value: unknown): string {
        return toPlainText(this.axisCtx.formatScaleValue(value, 'crosshair', this));
    }

    private onClick(event: _ModuleSupport.DragInterpreterClickEvent) {
        if (event.device === 'touch') {
            this.onMouseHoverLike(event);
        }
    }

    private onMouseHoverLike(event: HoverLikeEvent) {
        const options = this.options;
        if (!options?.enabled || options.snap) return;

        const requiredState = this.isHover(event)
            ? InteractionState.Hoverable | InteractionState.Frozen
            : InteractionState.AnnotationsMoveable;
        if (!this.ctx.interactionManager.isState(requiredState)) return;

        this.updatePositions(this.getData(event));
        this.crosshairGroup.visible = true;

        this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.SCENE_RENDER });
    }

    private onMouseOut() {
        // AG-16861 TC9: non-snap crosshairs respond to mouse movements on frozen charts and snap crosshairs don't
        const snap = this.options?.snap ?? true;
        const mask: _ModuleSupport.InteractionState = snap
            ? InteractionState.Hoverable
            : InteractionState.Hoverable | InteractionState.Frozen;
        if (!this.ctx.interactionManager.isState(mask)) return;
        this.hideCrosshairs();
        this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.SCENE_RENDER });
    }

    private onKeyPress() {
        const options = this.options;
        if (options?.enabled && !options.snap && this.ctx.interactionManager.isState(InteractionState.Default)) {
            this.hideCrosshairs();
        }
    }

    private onHighlightChange(event: _ModuleSupport.HighlightChangeEvent) {
        const options = this.options;
        if (!options?.enabled) return;

        const { crosshairGroup, axisCtx } = this;
        const { datum, datums, series } = event.currentHighlight ?? {};
        // Bins (histogram) expose their rows on `datums`, with `datum` left undefined.
        const hasCrosshair =
            (datum != null || datums != null) &&
            (series?.axes.x?.id === axisCtx.axisId || series?.axes.y?.id === axisCtx.axisId);

        this.activeHighlight = hasCrosshair ? event.currentHighlight : undefined;
        this.activeHighlightInViewport = event.highlightInViewport;

        if (!this.activeHighlight) {
            this.hideCrosshairs();
        } else if (options.snap) {
            if (event.highlightInViewport) {
                const activeHighlightData = this.getActiveHighlightData(this.activeHighlight);

                this.updatePositions(activeHighlightData);

                crosshairGroup.visible = true;
            } else {
                this.hideCrosshairs();
            }
        }

        this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.SCENE_RENDER });
    }

    private isInRange(value: number) {
        return this.axisCtx.inRange(value);
    }

    private refreshPositions() {
        if (this.activeHighlight) {
            this.updatePositions(this.getActiveHighlightData(this.activeHighlight));
        }
    }

    private updatePositions(data: { [key: string]: { value: any; position: number } }) {
        const { seriesRect, lineGroupSelection } = this;
        const labelEnabled = this.options?.label.enabled ?? false;
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
                line.x = x;
            } else {
                y = position;
                line.y = y;
            }

            if (labelEnabled) {
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
        const { series, xKey = '', aggregatedValue, cumulativeValue, cumulativeValueExact, midPoint } = activeHighlight;
        const datum = readDatum(activeHighlight);
        const seriesKeyProperties = series.getKeyProperties(axisCtx.direction);

        const halfBandwidth = (axisCtx.scale.bandwidth ?? 0) / 2;

        const matchingAxisId = series.axes[axisCtx.direction]?.id === axisCtx.axisId;
        const isYKey = seriesKeyProperties.includes('yKey') && matchingAxisId;
        const isXKey = seriesKeyProperties.includes('xKey') && matchingAxisId;

        // `cumulativeValueExact` keeps full precision for a bigint plotted value (the narrowed
        // `cumulativeValue` would float64-round it). Histogram exposes a raw, area-independent
        // `aggregatedValue` for callbacks rather than the plotted height, so prefer the plotted value
        // (`cumulativeValueExact`/`cumulativeValue`) when present.
        const datumValue = cumulativeValueExact ?? cumulativeValue ?? aggregatedValue;
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

        for (const unsafeKey of seriesKeyProperties) {
            // `getKeyProperties()` should return keys of series.properties members of type `string | undefined`:
            type AssertedKey = Exclude<keyof typeof series.properties, 'context' | 'selection' | 'tooltip'>;
            const key = unsafeKey as AssertedKey;

            const keyValue = series.properties[key];
            if (keyValue === undefined) continue;

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
        const defaults: AgCrosshairLabelRendererResult = { text: this.formatScaleText(value) };
        // Returning `undefined` (or `null`, defensively) from the renderer falls through to the
        // default formatted value, matching the documented Renderer<P, R> contract. Empty strings
        // still render an empty label.
        const rendered = this.options?.label.renderer?.({ value, fractionDigits });
        if (rendered == null) {
            return label.toLabelHtml(defaults);
        }
        return label.toLabelHtml(coerceTextValue(rendered), defaults);
    }

    private showLabel(x: number, y: number, value: any, key: string) {
        if (!this.axisLayout) return;

        const { bounds } = this;
        const label = this.labels[key];
        const html = this.getLabelHtml(value, label);

        label.setLabelHtml(html);

        const axisPosition = this.axisCtx.position;
        let padding = this.axisLayout.label.spacing + this.axisLayout.tickSize;

        // Use CSS translate percentages to avoid synchronous dimension reads.
        // translate(-50%, 0) centres horizontally; translate(0, -50%) centres vertically;
        // translate(-100%, ...) offsets by the element's full width/height.
        if (this.axisCtx.direction === ChartAxisDirection.X) {
            padding -= 4;
            const isBottom = axisPosition === 'bottom';
            label.show({
                x,
                y: isBottom ? bounds.y + bounds.height + padding : bounds.y - padding,
                translateX: '-50%',
                translateY: isBottom ? '0' : '-100%',
            });
        } else {
            padding -= 8;
            const isRight = axisPosition === 'right';
            label.show({
                x: isRight ? bounds.x + bounds.width + padding : bounds.x - padding,
                y,
                translateX: isRight ? '0' : '-100%',
                translateY: '-50%',
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
