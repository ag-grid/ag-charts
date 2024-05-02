import type { AgAngleAxisLabelOrientation, _Scale } from 'ag-charts-community';
import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { AngleCrossLine } from '../polar-crosslines/angleCrossLine';

const {
    AND,
    assignJsonApplyConstructedArray,
    ChartAxisDirection,
    GREATER_THAN,
    NUMBER,
    UNION,
    ProxyOnWrite,
    Validate,
} = _ModuleSupport;
const { Path, Text } = _Scene;
const { angleBetween, isNumberEqual, toRadians, normalizeAngle360 } = _Util;

export interface AngleAxisLabelDatum {
    text: string;
    x: number;
    y: number;
    hidden: boolean;
    rotation: number;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    box: _Scene.BBox | undefined;
}

interface AngleAxisTickDatum<TDatum> {
    value: TDatum;
    visible: boolean;
}

class AngleAxisLabel extends _ModuleSupport.AxisLabel {
    @Validate(UNION(['fixed', 'parallel', 'perpendicular'], 'a label orientation'))
    orientation: AgAngleAxisLabelOrientation = 'fixed';
}

export abstract class AngleAxis<
    TDomain,
    TScale extends _Scale.Scale<TDomain, any>,
> extends _ModuleSupport.PolarAxis<TScale> {
    @ProxyOnWrite('rotation')
    @Validate(NUMBER.restrict({ min: 0, max: 360 }))
    startAngle: number = 0;

    @Validate(AND(NUMBER.restrict({ min: 0, max: 720 }), GREATER_THAN('startAngle')), { optional: true })
    endAngle: number | undefined = undefined;

    protected labelData: AngleAxisLabelDatum[] = [];
    protected tickData: AngleAxisTickDatum<TDomain>[] = [];
    protected radiusLine: _Scene.Path = this.axisGroup.appendChild(new Path());

    constructor(moduleCtx: _ModuleSupport.ModuleContext, scale: TScale) {
        super(moduleCtx, scale);
        this.includeInvisibleDomains = true;
    }

    get direction() {
        return ChartAxisDirection.X;
    }

    protected assignCrossLineArrayConstructor(crossLines: _ModuleSupport.CrossLine[]) {
        assignJsonApplyConstructedArray(crossLines, AngleCrossLine);
    }

    protected override createLabel() {
        return new AngleAxisLabel();
    }

    override update() {
        this.updateScale();
        this.updatePosition();
        this.updateGridLines();
        this.updateTickLines();
        this.updateLabels();
        this.updateRadiusLine();
        this.updateCrossLines();
        return this.tickData.length;
    }

    override computeRange = () => {
        const startAngle = normalizeAngle360(-Math.PI / 2 + toRadians(this.startAngle));
        let endAngle = this.endAngle == null ? startAngle + Math.PI * 2 : -Math.PI / 2 + toRadians(this.endAngle);
        if (endAngle < startAngle) {
            endAngle += 2 * Math.PI;
        }
        this.range = [startAngle, endAngle];
    };

    protected override calculateAvailableRange(): number {
        const { range, gridLength: radius } = this;
        return angleBetween(range[0], range[1]) * radius;
    }

    protected abstract generateAngleTicks(): AngleAxisTickDatum<TDomain>[];

    override updatePosition() {
        const { translation, axisGroup, gridGroup, crossLineGroup } = this;
        const translationX = Math.floor(translation.x);
        const translationY = Math.floor(translation.y);

        axisGroup.translationX = translationX;
        axisGroup.translationY = translationY;

        gridGroup.translationX = translationX;
        gridGroup.translationY = translationY;

        crossLineGroup.translationX = translationX;
        crossLineGroup.translationY = translationY;
    }

    protected updateRadiusLine() {
        const node = this.radiusLine;
        const { path } = node;

        path.clear(true);

        const { points, closePath } = this.getAxisLinePoints();

        points.forEach(({ x, y, moveTo, arc, radius = 0, startAngle = 0, endAngle = 0 }) => {
            if (arc) {
                path.arc(x, y, radius, startAngle, endAngle);
            } else if (moveTo) {
                path.moveTo(x, y);
            } else {
                path.lineTo(x, y);
            }
        });

        if (closePath) {
            path.closePath();
        }

        node.visible = this.line.enabled;
        node.stroke = this.line.color;
        node.strokeWidth = this.line.width;
        node.fill = undefined;
    }

    override getAxisLinePoints() {
        const { scale, shape, gridLength: radius } = this;

        const [startAngle, endAngle] = this.range;
        const isFullCircle = isNumberEqual(endAngle - startAngle, 2 * Math.PI);

        const points = [];
        if (shape === 'circle') {
            if (isFullCircle) {
                points.push({ x: radius, y: 0, moveTo: true });
                points.push({
                    x: 0,
                    y: 0,
                    radius,
                    startAngle: 0,
                    endAngle: 2 * Math.PI,
                    arc: true,
                    moveTo: false,
                });
            } else {
                points.push({
                    x: radius * Math.cos(startAngle),
                    y: radius * Math.sin(startAngle),
                    moveTo: true,
                });
                points.push({
                    x: 0,
                    y: 0,
                    radius,
                    startAngle: normalizeAngle360(startAngle),
                    endAngle: normalizeAngle360(endAngle),
                    arc: true,
                    moveTo: false,
                });
            }
        } else if (shape === 'polygon') {
            const angles = (scale.ticks?.() ?? []).map((value) => scale.convert(value));
            if (angles.length > 2) {
                angles.forEach((angle, i) => {
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);
                    const moveTo = i === 0;
                    points.push({ x, y, moveTo });
                });
            }
        }

        return { points, closePath: isFullCircle };
    }

    protected override updateGridLines() {
        const {
            scale,
            gridLength: radius,
            gridLine: { enabled, style, width },
            innerRadiusRatio,
        } = this;
        if (!(style && radius > 0)) {
            return;
        }

        const ticks = this.tickData;
        const innerRadius = radius * innerRadiusRatio;
        const styleCount = style.length;
        const idFn = (datum: AngleAxisTickDatum<any>) => datum.value;
        this.gridLineGroupSelection.update(enabled ? ticks : [], undefined, idFn).each((line, datum, index) => {
            const { value } = datum;
            const { stroke, lineDash } = style[index % styleCount];
            const angle = scale.convert(value);
            line.x1 = innerRadius * Math.cos(angle);
            line.y1 = innerRadius * Math.sin(angle);
            line.x2 = radius * Math.cos(angle);
            line.y2 = radius * Math.sin(angle);
            line.stroke = stroke;
            line.strokeWidth = width;
            line.lineDash = lineDash;
            line.fill = undefined;
        });
        this.gridLineGroupSelection.cleanup();
    }

    protected override updateLabels() {
        const { label, tickLabelGroupSelection } = this;

        const ticks = this.tickData;
        tickLabelGroupSelection.update(label.enabled ? (ticks as any[]) : []).each((node, _, index) => {
            const labelDatum = this.labelData[index];
            if (!labelDatum || labelDatum.hidden) {
                node.visible = false;
                return;
            }

            node.text = labelDatum.text;
            node.setFont(label);
            node.fill = label.color;
            node.x = labelDatum.x;
            node.y = labelDatum.y;
            node.textAlign = labelDatum.textAlign;
            node.textBaseline = labelDatum.textBaseline;
            node.visible = true;
            if (labelDatum.rotation) {
                node.rotation = labelDatum.rotation;
                node.rotationCenterX = labelDatum.x;
                node.rotationCenterY = labelDatum.y;
            } else {
                node.rotation = 0;
            }
        });
    }

    protected override updateTickLines() {
        const { scale, gridLength: radius, tick, tickLineGroupSelection } = this;

        const ticks = this.tickData;
        tickLineGroupSelection.update(tick.enabled ? ticks : []).each((line, datum) => {
            const { value } = datum;
            const angle = scale.convert(value);
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            line.x1 = radius * cos;
            line.y1 = radius * sin;
            line.x2 = (radius + tick.size) * cos;
            line.y2 = (radius + tick.size) * sin;
            line.stroke = tick.color;
            line.strokeWidth = tick.width;
        });
    }

    protected createLabelNodeData(
        ticks: any[],
        options: { hideWhenNecessary: boolean },
        seriesRect: _Scene.BBox
    ): AngleAxisLabelDatum[] {
        const { label, gridLength: radius, scale, tick } = this;
        if (!label.enabled) {
            return [];
        }

        const tempText = new Text();

        const seriesLeft = seriesRect.x - this.translation.x;
        const seriesRight = seriesRect.x + seriesRect.width - this.translation.x;

        const labelData: AngleAxisLabelDatum[] = ticks.map((datum, index) => {
            const { value } = datum;
            const distance = radius + label.padding + tick.size;
            const angle = scale.convert(value);
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const x = distance * cos;
            const y = distance * sin;
            const { textAlign, textBaseline } = this.getLabelAlign(angle);

            // Hide the last tick when it appears over the first
            const isLastTickOverFirst =
                index === ticks.length - 1 &&
                value !== ticks[0] &&
                isNumberEqual(normalizeAngle360(angle), normalizeAngle360(scale.convert(ticks[0])));

            const rotation = this.getLabelRotation(angle);

            let text = String(value);
            if (label.formatter) {
                const { callbackCache } = this.moduleCtx;
                text = callbackCache.call(label.formatter, { value, index }) ?? '';
            }

            tempText.text = text;
            tempText.x = x;
            tempText.y = y;
            tempText.setFont(label);
            tempText.textAlign = textAlign;
            tempText.textBaseline = textBaseline;
            tempText.rotation = rotation;
            if (rotation) {
                tempText.rotationCenterX = x;
                tempText.rotationCenterY = y;
            }

            let box: _Scene.BBox | undefined = rotation ? tempText.computeTransformedBBox() : tempText.computeBBox();
            if (box && options.hideWhenNecessary && !rotation) {
                const overflowLeft = seriesLeft - box.x;
                const overflowRight = box.x + box.width - seriesRight;
                const pixelError = 1;
                if (overflowLeft > pixelError || overflowRight > pixelError) {
                    const availWidth = box.width - Math.max(overflowLeft, overflowRight);
                    text = Text.wrap(text, availWidth, Infinity, label, 'never');
                    if (text === '\u2026') {
                        text = '';
                        box = undefined;
                    }
                    tempText.text = text;
                    box = tempText.computeBBox();
                }
            }

            return {
                text,
                x,
                y,
                textAlign,
                textBaseline,
                hidden: text === '' || datum.hidden || isLastTickOverFirst,
                rotation,
                box,
            };
        });

        if (label.avoidCollisions) {
            this.avoidLabelCollisions(labelData);
        }

        return labelData;
    }

    protected abstract avoidLabelCollisions(labelData: AngleAxisLabelDatum[]): void;

    override computeLabelsBBox(options: { hideWhenNecessary: boolean }, seriesRect: _Scene.BBox) {
        this.tickData = this.generateAngleTicks();
        this.labelData = this.createLabelNodeData(this.tickData, options, seriesRect);

        const textBoxes = this.labelData.map(({ box }) => box).filter((box): box is _Scene.BBox => box != null);

        if (!this.label.enabled || textBoxes.length === 0) {
            return null;
        }

        return _Scene.BBox.merge(textBoxes);
    }

    protected getLabelOrientation(): AgAngleAxisLabelOrientation {
        const { label } = this;
        return label instanceof AngleAxisLabel ? label.orientation : 'fixed';
    }

    protected getLabelRotation(tickAngle: number) {
        let rotation = toRadians(this.label.rotation ?? 0);
        tickAngle = normalizeAngle360(tickAngle);

        const orientation = this.getLabelOrientation();
        if (orientation === 'parallel') {
            rotation += tickAngle;
            if (tickAngle >= 0 && tickAngle < Math.PI) {
                rotation -= Math.PI / 2;
            } else {
                rotation += Math.PI / 2;
            }
        } else if (orientation === 'perpendicular') {
            rotation += tickAngle;
            if (tickAngle >= Math.PI / 2 && tickAngle < 1.5 * Math.PI) {
                rotation += Math.PI;
            }
        }

        return rotation;
    }

    protected getLabelAlign(tickAngle: number) {
        const cos = Math.cos(tickAngle);
        const sin = Math.sin(tickAngle);

        let textAlign: CanvasTextAlign;
        let textBaseline: CanvasTextBaseline;

        const orientation = this.getLabelOrientation();
        const isCos0 = isNumberEqual(cos, 0);
        const isSin0 = isNumberEqual(sin, 0);
        const isCos1 = isNumberEqual(cos, 1);
        const isSinMinus1 = isNumberEqual(sin, -1);
        const isCosPositive = cos > 0 && !isCos0;
        const isSinPositive = sin > 0 && !isSin0;

        if (orientation === 'parallel') {
            textAlign = 'center';
            textBaseline = (isCos1 && isSin0) || isSinPositive ? 'top' : 'bottom';
        } else if (orientation === 'perpendicular') {
            textAlign = isSinMinus1 || isCosPositive ? 'left' : 'right';
            textBaseline = 'middle';
        } else {
            textAlign = 'right';
            if (isCos0) {
                textAlign = 'center';
            } else if (isCosPositive) {
                textAlign = 'left';
            }

            textBaseline = 'bottom';
            if (isSin0) {
                textBaseline = 'middle';
            } else if (isSinPositive) {
                textBaseline = 'top';
            }
        }

        return { textAlign, textBaseline };
    }

    protected override updateCrossLines() {
        this.crossLines?.forEach((crossLine) => {
            if (crossLine instanceof AngleCrossLine) {
                const { shape, gridLength: radius, innerRadiusRatio } = this;
                crossLine.shape = shape;
                crossLine.axisOuterRadius = radius;
                crossLine.axisInnerRadius = radius * innerRadiusRatio;
            }
        });
        super.updateCrossLines({ rotation: 0, parallelFlipRotation: 0, regularFlipRotation: 0 });
    }
}
