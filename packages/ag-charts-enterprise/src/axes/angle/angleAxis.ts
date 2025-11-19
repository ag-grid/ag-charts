import type { AgAngleAxisLabelOrientation, TextOrSegments } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import {
    Property,
    type Scale,
    type ScaleTickParams,
    type WrapOptions,
    countFractionDigits,
    isNumberEqual,
    normalizeAngle360,
    normalizeAngle360Inclusive,
    toRadians,
    wrapTextOrSegments,
} from 'ag-charts-core';

import { AngleCrossLine } from '../polar-crosslines/angleCrossLine';

const { ChartAxisDirection, Path, RotatableText, Transformable, BBox, Selection, Line } = _ModuleSupport;
export interface AngleAxisLabelDatum {
    text: TextOrSegments;
    x: number;
    y: number;
    hidden: boolean;
    rotation: number;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    box: _ModuleSupport.BBox | undefined;
}

interface AngleAxisTickDatum<TDatum> {
    value: TDatum;
    visible: boolean;
}

class AngleAxisLabel extends _ModuleSupport.AxisLabel {
    @Property
    orientation: AgAngleAxisLabelOrientation = 'fixed';
}

export abstract class AngleAxis<TDomain, TScale extends Scale<TDomain, any>> extends _ModuleSupport.PolarAxis<TScale> {
    protected static override CrossLineConstructor: new () => _ModuleSupport.CrossLine<any> = AngleCrossLine;

    @Property
    startAngle: number = 0;

    @Property
    endAngle: number | undefined = undefined;

    protected tickLineGroupSelection = Selection.select<_ModuleSupport.Line, AngleAxisTickDatum<TDomain>>(
        this.tickLineGroup,
        Line,
        false
    );
    protected gridLineGroupSelection = Selection.select<_ModuleSupport.Line, AngleAxisTickDatum<TDomain>>(
        this.gridLineGroup,
        Line,
        false
    );

    protected labelData: AngleAxisLabelDatum[] = [];
    protected tickData: AngleAxisTickDatum<TDomain>[] = [];

    protected radiusLineGroup = this.axisGroup.appendChild(new _ModuleSupport.TransformableGroup());
    protected radiusLine: _ModuleSupport.Path = this.radiusLineGroup.appendChild(new Path());

    constructor(moduleCtx: _ModuleSupport.ModuleContext, scale: TScale) {
        super(moduleCtx, scale);
        this.includeInvisibleDomains = true;
    }

    get direction() {
        return ChartAxisDirection.Angle;
    }

    protected override createLabel() {
        return new AngleAxisLabel();
    }

    calculateRotations() {
        const rotation = toRadians(this.startAngle);
        // When labels are parallel to the axis line, the `parallelFlipFlag` is used to
        // flip the labels to avoid upside-down text, when the axis is rotated
        // such that it is in the right hemisphere, i.e. the angle of rotation
        // is in the [0, π] interval.
        // The rotation angle is normalized, so that we have an easier time checking
        // if it's in the said interval. Since the axis is always rendered vertically
        // and then rotated, zero rotation means 12 (not 3) o-clock.
        // -1 = flip
        //  1 = don't flip (default)
        const parallelFlipRotation = normalizeAngle360(rotation);
        const regularFlipRotation = normalizeAngle360(rotation - Math.PI / 2);
        return { rotation, parallelFlipRotation, regularFlipRotation };
    }

    override calculateTickLayout(domain: TDomain[]): {
        niceDomain: any[];
        tickDomain: TDomain[];
        ticks: TDomain[];
        rawTickCount: number | undefined;
        fractionDigits: number;
        timeInterval: undefined;
        bbox: _ModuleSupport.BBox;
    } {
        const { nice, scale } = this;

        const ticksParams: ScaleTickParams<any> = {
            nice: [nice, nice],
            interval: undefined,
            tickCount: undefined,
            minTickCount: 0,
            maxTickCount: Infinity,
        };

        const niceDomain = nice ? scale.niceDomain(ticksParams, domain) : domain;

        const tickData = this.generateAngleTicks(niceDomain);
        this.tickData = tickData;

        const ticks = tickData.map((t) => t.value);

        const fractionDigits = ticks.reduce(
            (f, t) => Math.max(typeof t === 'number' ? countFractionDigits(t) : 0, f),
            0
        );

        return {
            niceDomain,
            tickDomain: niceDomain,
            ticks,
            rawTickCount: undefined,
            fractionDigits,
            timeInterval: undefined,
            bbox: this.getBBox(),
        };
    }

    override update() {
        super.update();
        this.updateRadiusLine();
        this.updateGridLines();
        this.updateTickLines();
    }

    private normalizedAngles(): [number, number] {
        const startAngle = normalizeAngle360(-Math.PI / 2 + toRadians(this.startAngle));
        const sweep =
            this.endAngle == null
                ? 2 * Math.PI
                : normalizeAngle360Inclusive(toRadians(this.endAngle) - toRadians(this.startAngle));
        const endAngle = startAngle + sweep;
        return [startAngle, endAngle];
    }

    override computeRange() {
        this.range = this.normalizedAngles();
    }

    protected abstract generateAngleTicks(domain: TDomain[]): AngleAxisTickDatum<TDomain>[];

    protected updateSelections() {
        const data = this.tickData;

        this.gridLineGroupSelection.update(this.gridLength && this.gridLine.enabled ? data : []);
        this.tickLineGroupSelection.update(this.tick.enabled ? data : []);
        this.tickLabelGroupSelection.update(this.label.enabled ? (data as any) : []);

        this.gridLineGroupSelection.cleanup();
        this.tickLineGroupSelection.cleanup();
        this.tickLabelGroupSelection.cleanup();
    }

    override updatePosition() {
        super.updatePosition();
        const { translation, radiusLineGroup } = this;
        const translationX = Math.floor(translation.x);
        const translationY = Math.floor(translation.y);

        radiusLineGroup.translationX = translationX;
        radiusLineGroup.translationY = translationY;
    }

    protected updateRadiusLine() {
        const node = this.radiusLine;
        const { path } = node;

        path.clear(true);

        const { points, closePath } = this.getAxisLinePoints();

        for (const { x, y, moveTo, arc, radius = 0, startAngle = 0, endAngle = 0 } of points) {
            if (arc) {
                path.arc(x, y, radius, startAngle, endAngle);
            } else if (moveTo) {
                path.moveTo(x, y);
            } else {
                path.lineTo(x, y);
            }
        }

        if (closePath) {
            path.closePath();
        }

        node.visible = this.line.enabled;
        node.stroke = this.line.stroke;
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
                points.push(
                    { x: radius, y: 0, moveTo: true },
                    {
                        x: 0,
                        y: 0,
                        radius,
                        startAngle: 0,
                        endAngle: 2 * Math.PI,
                        arc: true,
                        moveTo: false,
                    }
                );
            } else {
                points.push(
                    {
                        x: radius * Math.cos(startAngle),
                        y: radius * Math.sin(startAngle),
                        moveTo: true,
                    },
                    {
                        x: 0,
                        y: 0,
                        radius,
                        startAngle: normalizeAngle360(startAngle),
                        endAngle: normalizeAngle360(endAngle),
                        arc: true,
                        moveTo: false,
                    }
                );
            }
        } else if (shape === 'polygon') {
            const angles = scale
                .ticks({
                    nice: [this.nice, this.nice],
                    interval: undefined,
                    tickCount: undefined,
                    minTickCount: 0,
                    maxTickCount: Infinity,
                })
                ?.ticks?.map((value) => scale.convert(value));
            if (angles && angles.length > 2) {
                for (const [i, angle] of angles.entries()) {
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);
                    const moveTo = i === 0;
                    points.push({ x, y, moveTo });
                }
            }
        }

        return { points, closePath: isFullCircle };
    }

    private updateGridLines() {
        const {
            scale,
            gridLength: radius,
            gridLine: { style, width },
            innerRadiusRatio,
        } = this;
        if (!(style && radius > 0)) {
            return;
        }

        const innerRadius = radius * innerRadiusRatio;
        const styleCount = style.length;
        this.gridLineGroupSelection.each((line, datum, index) => {
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

        tickLabelGroupSelection.each((node, _, index) => {
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
            node.setAlign(labelDatum);
            node.setBoxing(label);
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

    private updateTickLines() {
        const { scale, gridLength: radius, tick, tickLineGroupSelection } = this;

        tickLineGroupSelection.each((line, datum) => {
            const { value } = datum;
            const angle = scale.convert(value);
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            line.x1 = radius * cos;
            line.y1 = radius * sin;
            line.x2 = (radius + tick.size) * cos;
            line.y2 = (radius + tick.size) * sin;
            line.stroke = tick.stroke;
            line.strokeWidth = tick.width;
        });
    }

    protected createLabelNodeData(
        ticks: any[],
        options: { hideWhenNecessary: boolean },
        seriesRect: _ModuleSupport.BBox
    ): AngleAxisLabelDatum[] {
        const { label, gridLength: radius, scale, tick } = this;
        if (!label.enabled) {
            return [];
        }

        const tempText = new RotatableText();

        const seriesLeft = seriesRect.x - this.translation.x;
        const seriesRight = seriesRect.x + seriesRect.width - this.translation.x;

        const { fractionDigits } = this.layout.label;
        const axisTickFormatter = this.tickFormatter(this.scale.domain, this.tickData, false, fractionDigits);

        const labelData: AngleAxisLabelDatum[] = ticks.map((datum, index) => {
            const { value } = datum;
            const distance = radius + label.spacing + tick.size;
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

            let text = axisTickFormatter(value, index);

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

            let box: _ModuleSupport.BBox | undefined = rotation ? Transformable.toCanvas(tempText) : tempText.getBBox();
            if (box && options.hideWhenNecessary && !rotation) {
                const overflowLeft = seriesLeft - box.x;
                const overflowRight = box.x + box.width - seriesRight;
                const pixelError = 1;
                if (overflowLeft > pixelError || overflowRight > pixelError) {
                    const availWidth = box.width - Math.max(overflowLeft, overflowRight);
                    const wrapOptions: WrapOptions = { maxWidth: availWidth, font: label, textWrap: 'never' };
                    text = wrapTextOrSegments(text, wrapOptions);
                    tempText.text = text;
                    box = tempText.getBBox();
                }
            }

            return {
                text,
                x,
                y,
                textAlign,
                textBaseline,
                hidden: text === '' || (datum.hidden ?? isLastTickOverFirst),
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

    override computeLabelsBBox(options: { hideWhenNecessary: boolean }, seriesRect: _ModuleSupport.BBox) {
        this.labelData = this.createLabelNodeData(this.tickData, options, seriesRect);

        const textBoxes = this.labelData.map(({ box }) => box).filter((box): box is _ModuleSupport.BBox => box != null);

        if (!this.label.enabled || textBoxes.length === 0) {
            return null;
        }

        return BBox.merge(textBoxes);
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
        const { shape, gridLength: radius, innerRadiusRatio } = this;
        for (const crossLine of this.crossLines) {
            if (crossLine instanceof AngleCrossLine) {
                crossLine.ticks = this.tickData.map((t) => t.value);
                crossLine.shape = shape;
                crossLine.axisOuterRadius = radius;
                crossLine.axisInnerRadius = radius * innerRadiusRatio;
            }
        }
        super.updateCrossLines();
    }
}
