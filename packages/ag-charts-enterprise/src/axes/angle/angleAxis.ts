import type { AgAngleAxisLabelOrientation, _Scale } from 'ag-charts-community';
import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { AngleCrossLine } from '../polar-crosslines/angleCrossLine';

const {
    AND,
    assignJsonApplyConstructedArray,
    ChartAxisDirection,
    GREATER_THAN,
    NUMBER,
    OPT_NUMBER,
    predicateWithMessage,
    ProxyOnWrite,
    Validate,
} = _ModuleSupport;
const { Path, Text } = _Scene;
const { isNumberEqual, toRadians, normalizeAngle360 } = _Util;

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

const ANGLE_LABEL_ORIENTATIONS: AgAngleAxisLabelOrientation[] = ['fixed', 'parallel', 'perpendicular'];

const ANGLE_LABEL_ORIENTATION = predicateWithMessage(
    (v: any) => ANGLE_LABEL_ORIENTATIONS.includes(v),
    `expecting a label orientation keyword such as 'fixed', 'parallel' or 'perpendicular'`
);

class AngleAxisLabel extends _ModuleSupport.AxisLabel {
    @Validate(ANGLE_LABEL_ORIENTATION)
    orientation: AgAngleAxisLabelOrientation = 'fixed';
}

export abstract class AngleAxis<
    TDomain,
    TScale extends _Scale.Scale<TDomain, any>,
> extends _ModuleSupport.PolarAxis<TScale> {
    @ProxyOnWrite('rotation')
    @Validate(NUMBER(0, 360))
    startAngle: number = 0;

    @Validate(AND(OPT_NUMBER(0, 720), GREATER_THAN('startAngle')))
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
        const startAngle = -Math.PI / 2 + toRadians(this.startAngle);
        const endAngle =
            this.endAngle == undefined ? startAngle + Math.PI * 2 : -Math.PI / 2 + toRadians(this.endAngle);
        this.range = [startAngle, endAngle];
    };

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
        const { scale, shape } = this;
        const node = this.radiusLine;
        const radius = this.gridLength;

        const { path } = node;
        path.clear({ trackChanges: true });
        if (shape === 'circle') {
            path.moveTo(radius, 0);
            path.arc(0, 0, radius, 0, 2 * Math.PI);
        } else if (shape === 'polygon') {
            const angles = (scale.ticks?.() || []).map((value) => scale.convert(value));
            if (angles.length > 2) {
                angles.forEach((angle, i) => {
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);
                    if (i === 0) {
                        path.moveTo(x, y);
                    } else {
                        path.lineTo(x, y);
                    }
                });
            }
        }
        path.closePath();

        node.stroke = this.line.color;
        node.strokeWidth = this.line.width;
        node.fill = undefined;
    }

    protected override updateGridLines() {
        const {
            scale,
            gridLength: radius,
            gridLine: { style, width },
            tick,
            innerRadiusRatio,
        } = this;
        if (!(style && radius > 0)) {
            return;
        }

        const ticks = this.tickData;
        const innerRadius = radius * innerRadiusRatio;
        const styleCount = style.length;
        this.gridLineGroupSelection.update(tick.enabled ? ticks : []).each((line, datum, index) => {
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
    }

    protected override updateLabels() {
        const { label, tickLabelGroupSelection } = this;

        const ticks = this.tickData;
        tickLabelGroupSelection.update(label.enabled ? ticks : []).each((node, _, index) => {
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
            if (tickAngle >= Math.PI / 2 && tickAngle < (3 * Math.PI) / 2) {
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
            textAlign = isCos0 ? 'center' : isCosPositive ? 'left' : 'right';
            textBaseline = isSin0 ? 'middle' : isSinPositive ? 'top' : 'bottom';
        }

        return { textAlign, textBaseline };
    }

    protected override updateCrossLines() {
        this.crossLines?.forEach((crossLine) => {
            if (crossLine instanceof AngleCrossLine) {
                const { shape, gridLength: radius, innerRadiusRatio } = this;
                crossLine.shape = shape;
                crossLine.outerRadius = radius;
                crossLine.innerRadius = radius * innerRadiusRatio;
            }
        });
        super.updateCrossLines({ rotation: 0, parallelFlipRotation: 0, regularFlipRotation: 0, sideFlag: -1 });
    }
}
