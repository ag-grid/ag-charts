import type { AgAxisCaptionFormatterParams } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import {
    type AxisID,
    ChartAxisDirection,
    type DynamicContext,
    type NormalisedBaseRadiusAxisOptions,
    type Scale,
    ZIndexMap,
    isNumberEqual,
    normalizeAngle360,
    toRadians,
} from 'ag-charts-core';

const { Group, TransformableGroup, Path, Line, Selection, generateTicks, getAxisLabelSideFlag, AxisGroupZIndexMap } =
    _ModuleSupport;

interface GeneratedTicks {
    ticks: _ModuleSupport.TickDatum[];
    labels: _ModuleSupport.LabelNodeDatum[];
}

export abstract class RadiusAxis<
    S extends Scale<D, number, _ModuleSupport.TickInterval<S>> = Scale<any, number, any>,
    D = unknown,
    TOptions extends NormalisedBaseRadiusAxisOptions = NormalisedBaseRadiusAxisOptions,
> extends _ModuleSupport.PolarAxis<S, D, TOptions> {
    protected gridLineGroupSelection = Selection.select<_ModuleSupport.Line<_ModuleSupport.TickDatum>>(
        this.gridLineGroup,
        Line,
        false
    );

    private generatedTicks: GeneratedTicks | undefined = undefined;

    protected readonly headingLabelGroup = this.axisGroup.appendChild(
        new TransformableGroup({ name: `${this.id}-Axis-heading` })
    );
    protected readonly lineNodeGroup = this.axisGroup.appendChild(
        new TransformableGroup({ name: `${this.id}-Axis-line` })
    );
    protected readonly lineNode = this.lineNodeGroup.appendChild(
        new Line({
            name: `${this.id}-Axis-line`,
            zIndex: AxisGroupZIndexMap.AxisLine,
        })
    );

    protected readonly gridPathGroup = this.gridGroup.appendChild(
        new Group({
            name: `${this.id}-gridPaths`,
            zIndex: ZIndexMap.AXIS_GRID,
        })
    );

    protected gridPathSelection = Selection.select(this.gridPathGroup, Path);

    get direction() {
        return ChartAxisDirection.Radius;
    }

    constructor(moduleCtx: DynamicContext<_ModuleSupport.ChartRegistry>, id: AxisID, scale: S, options: TOptions) {
        super(moduleCtx, id, scale, options);

        this.headingLabelGroup.appendChild(this.caption.node);

        this.cleanup.register(this.caption.registerInteraction(this.moduleCtx, this.id));
    }

    private getAxisTransform() {
        const maxRadius = this.scale.range[0];
        const { translation, innerRadiusRatio } = this;
        const innerRadius = maxRadius * innerRadiusRatio;
        const rotation = toRadians(this.options.positionAngle);
        return {
            translationX: translation.x,
            translationY: translation.y - maxRadius - innerRadius,
            rotation,
            rotationCenterX: 0,
            rotationCenterY: maxRadius + innerRadius,
        };
    }

    override update(): void {
        super.update();

        this.updateTitle();
        this.updateGridLines();

        const { enabled, stroke, width } = this.options.line;
        this.lineNode.setProperties({
            stroke,
            strokeWidth: enabled ? width : 0,
            x1: 0,
            y1: this.range[0],
            x2: 0,
            y2: this.range[1],
        });
    }

    override updatePosition() {
        super.updatePosition();

        const axisTransform = this.getAxisTransform();
        this.tickLineGroup.setProperties(axisTransform);
        this.tickLabelGroup.setProperties(axisTransform);
        this.lineNodeGroup.setProperties(axisTransform);
        this.headingLabelGroup.setProperties(axisTransform);
    }

    calculateRotations() {
        const rotation = 0;
        // When labels are parallel to the axis line, the `parallelFlipFlag` is used to
        // flip the labels to avoid upside-down text, when the axis is rotated
        // such that it is in the right hemisphere, i.e. the angle of rotation
        // is in the [0, π] interval.
        // The rotation angle is normalized, so that we have an easier time checking
        // if it's in the said interval. Since the axis is always rendered vertically
        // and then rotated, zero rotation means 12 (not 3) o-clock.
        // -1 = flip
        //  1 = don't flip (default)
        const parallelFlipRotation = 0;
        const regularFlipRotation = -Math.PI / 2;
        return { rotation, parallelFlipRotation, regularFlipRotation };
    }

    override calculateTickLayout(
        domain: D[],
        niceMode: [_ModuleSupport.NiceMode, _ModuleSupport.NiceMode],
        _visibleRange: [number, number]
    ): {
        niceDomain: D[];
        tickDomain: D[];
        ticks: D[];
        rawTickCount: number | undefined;
        fractionDigits: number;
        timeInterval: undefined;
    } {
        const visibleRange: [number, number] = [0, 1];
        const sideFlag = getAxisLabelSideFlag(this.mirrored);
        const labelSpacing = this.options.label.spacing;
        const labelX = sideFlag * (this.getTickSize() + labelSpacing + this.seriesAreaPadding);

        const { range, defaultTickMinSpacing } = this;
        const { reverse } = this.options;
        const tickGenerationResult = generateTicks({
            scale: this.scale,
            label: this.options.label,
            interval: this.options.interval,
            tickFormatter: (...args) => this.tickFormatter(...args),
            domain,
            range,
            reverse,
            niceMode,
            visibleRange,
            defaultTickMinSpacing,
            labelOffset: labelX,
            sideFlag,
            axisRotation: 0,
            sizeLimit: undefined,
            primaryTickCount: undefined,
        });

        const { tickData } = tickGenerationResult;
        const { ticks, rawTicks, rawTickCount, tickDomain, fractionDigits, niceDomain = domain } = tickData;

        const labels = ticks.map((d) => this.getTickLabelProps(d, tickGenerationResult));

        this.generatedTicks = { ticks, labels };

        return { ticks: rawTicks, tickDomain, niceDomain, rawTickCount, fractionDigits, timeInterval: undefined };
    }

    protected abstract prepareGridPathTickData(tickData: _ModuleSupport.TickDatum[]): _ModuleSupport.TickDatum[];
    protected abstract getTickRadius(tickDatum: _ModuleSupport.TickDatum): number;

    protected updateSelections() {
        const { generatedTicks } = this;
        if (!generatedTicks) return;

        const { ticks, labels } = generatedTicks;

        this.gridLineGroupSelection.update(this.gridLength ? ticks : []);
        this.tickLabelGroupSelection.update(labels);
        this.gridPathSelection.update(this.options.gridLine.enabled ? this.prepareGridPathTickData(ticks) : []);

        this.gridLineGroupSelection.cleanup();
        this.tickLabelGroupSelection.cleanup();
        this.gridPathSelection.cleanup();
    }

    // TODO - abstract out
    protected override updateLabels() {
        if (!this.options.label.enabled) return;

        const axisLabelPositionFn = _ModuleSupport.resetAxisLabelSelectionFn();

        // Apply label option values
        this.tickLabelGroupSelection.each((node, datum) => {
            node.fill = datum.color;
            node.text = datum.text;
            node.textBaseline = datum.textBaseline;
            node.textAlign = datum.textAlign ?? 'center';
            node.setFont(datum);
            node.setBoxing(datum);
            node.setProperties(axisLabelPositionFn(node, datum));
        });
    }

    private updateGridLines(): void {
        const { shape, generatedTicks } = this;
        const { style, width } = this.options.gridLine;
        if (!style || !generatedTicks) {
            return;
        }

        const styleCount = style.length;
        const setStyle = (node: _ModuleSupport.Path | _ModuleSupport.Arc, index: number) => {
            const { stroke, lineDash } = style[index % styleCount];
            node.stroke = stroke;
            node.strokeWidth = width;
            node.lineDash = lineDash;
            node.fill = undefined;
        };

        const [startAngle, endAngle] = this.gridRange ?? [0, 2 * Math.PI];
        const isFullCircle = isNumberEqual(endAngle - startAngle, 2 * Math.PI);

        const drawCircleShape = (node: _ModuleSupport.Path, value: any) => {
            const { path } = node;
            path.clear(true);
            const radius = this.getTickRadius(value);
            if (isFullCircle) {
                path.moveTo(radius, 0);
                path.arc(0, 0, radius, 0, 2 * Math.PI);
            } else {
                path.moveTo(radius * Math.cos(startAngle), radius * Math.sin(startAngle));
                path.arc(0, 0, radius, normalizeAngle360(startAngle), normalizeAngle360(endAngle));
            }
            if (isFullCircle) {
                path.closePath();
            }
        };

        const drawPolygonShape = (node: _ModuleSupport.Path, value: any) => {
            const { path } = node;
            const angles = this.gridAngles;
            path.clear(true);
            if (!angles || angles.length < 3) {
                return;
            }

            const radius = this.getTickRadius(value);
            for (const [idx, angle] of angles.entries()) {
                const x = radius * Math.cos(angle);
                const y = radius * Math.sin(angle);
                if (idx === 0) {
                    path.moveTo(x, y);
                } else {
                    path.lineTo(x, y);
                }

                for (const [innerIdx, innerAngle] of angles.entries()) {
                    const x2 = radius * Math.cos(innerAngle);
                    const y2 = radius * Math.sin(innerAngle);
                    if (innerIdx === 0) {
                        path.moveTo(x2, y2);
                    } else {
                        path.lineTo(x2, y2);
                    }
                }
                path.closePath();
            }
            path.closePath();
        };

        const drawFn = shape === 'circle' ? drawCircleShape : drawPolygonShape;
        this.gridPathSelection.each((node, value, index) => {
            setStyle(node, index);
            drawFn(node, value);
        });
    }

    private updateTitle() {
        const identityFormatter = (params: AgAxisCaptionFormatterParams) => params.defaultValue;
        const { caption, range: requestedRange } = this;
        const title = this.options.title;
        const { formatter = identityFormatter } = title;

        caption.enabled = title.enabled;
        caption.fontFamily = title.fontFamily;
        caption.fontSize = title.fontSize;
        caption.fontStyle = title.fontStyle;
        caption.fontWeight = title.fontWeight;
        caption.color = title.color;
        caption.wrapping = title.wrapping;
        caption.truncate = title.truncate;
        caption.maxWidth = title.maxWidth;
        caption.maxHeight = title.maxHeight;

        let titleVisible = false;
        const titleNode = caption.node;
        if (title.enabled) {
            const axisLength = Math.abs(requestedRange[1] - requestedRange[0]);

            titleVisible = true;

            titleNode.rotation = Math.PI / 2;
            titleNode.x = Math.floor((requestedRange[0] + requestedRange[1]) / 2);
            titleNode.y = -title.spacing;
            titleNode.textAlign = 'center';
            titleNode.textBaseline = 'bottom';

            titleNode.text = this.cachedCallWithContext(formatter, this.getTitleFormatterParams(this.scale.domain));
            caption.text = titleNode.text;
            caption.computeTextWrap(axisLength, Infinity);
        }

        titleNode.visible = titleVisible;
    }

    protected override computePolarLayout(): _ModuleSupport.PolarAxisLayout {
        const radius = this.range[0];
        return {
            ...this.calculateRotations(),
            shape: this.shape,
            axisOuterRadius: radius,
            axisInnerRadius: radius * this.innerRadiusRatio,
            gridAngles: this.gridAngles,
        };
    }

    // TODO - abstract out (shared with cartesian axis)
    private getTickLabelProps(
        datum: _ModuleSupport.TickDatum,
        tickGenerationResult: { rotation: number; textAlign: CanvasTextAlign; textBaseline: CanvasTextBaseline }
    ): _ModuleSupport.LabelNodeDatum {
        const label = this.options.label;
        const { rotation, textBaseline, textAlign } = tickGenerationResult;
        const range = this.scale.range;
        const text = datum.tickLabel ?? '';
        const sideFlag = getAxisLabelSideFlag(this.mirrored);
        const labelX = sideFlag * (this.getTickSize() + label.spacing + this.seriesAreaPadding);
        const visible = text !== '';

        return {
            ...this.getLabelStyles({ value: datum.tick, formattedValue: datum.tickLabel }),
            tickId: datum.tickId,
            rotation,
            text,
            textAlign,
            textBaseline,
            visible,
            x: labelX,
            y: datum.translation,
            rotationCenterX: labelX,
            rotationCenterY: datum.translation,
            range,
        };
    }
}
