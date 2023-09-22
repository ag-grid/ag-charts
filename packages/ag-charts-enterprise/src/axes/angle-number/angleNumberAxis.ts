import type { AgAngleAxisLabelOrientation, _Scale } from 'ag-charts-community';
import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';
import { AngleCrossLine } from './angleCrossLine';
import { PolarLinearScale } from '../polarLinearScale';

const { assignJsonApplyConstructedArray, ChartAxisDirection, NUMBER, ProxyOnWrite, Validate, predicateWithMessage } =
    _ModuleSupport;
const { Path, Text } = _Scene;
const { isNumberEqual, toRadians, normalizeAngle360 } = _Util;

interface AngleNumberAxisLabelDatum {
    text: string;
    x: number;
    y: number;
    hidden: boolean;
    rotation: number;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    box: _Scene.BBox | undefined;
}

interface AngleNumberAxisTickDatum {
    value: number;
    visible: boolean;
}

function loopSymmetrically<T>(items: T[], step: number, iterator: (prev: T, next: T) => any) {
    const loop = (start: number, end: number, step: number, iterator: (prev: T, next: T) => any) => {
        let prev = items[0];
        for (let i = start; step > 0 ? i <= end : i > end; i += step) {
            const curr = items[i];
            if (iterator(prev, curr)) return true;
            prev = curr;
        }
    };

    const midIndex = Math.floor(items.length / 2);

    if (loop(step, midIndex, step, iterator)) return true;
    return loop(items.length - step, midIndex, -step, iterator);
}

const ANGLE_LABEL_ORIENTATIONS: AgAngleAxisLabelOrientation[] = ['fixed', 'parallel', 'perpendicular'];

const ANGLE_LABEL_ORIENTATION = predicateWithMessage(
    (v: any) => ANGLE_LABEL_ORIENTATIONS.includes(v),
    `expecting a label orientation keyword such as 'fixed', 'parallel' or 'perpendicular'`
);

class AngleCategoryAxisLabel extends _ModuleSupport.AxisLabel {
    @Validate(ANGLE_LABEL_ORIENTATION)
    orientation: AgAngleAxisLabelOrientation = 'fixed';
}

export class AngleNumberAxis extends _ModuleSupport.PolarAxis<_Scale.LinearScale> {
    static className = 'AngleNumberAxis';
    static type = 'angle-number' as const;

    shape = 'circle' as const;

    @ProxyOnWrite('rotation')
    @Validate(NUMBER())
    startAngle: number = 0;

    protected labelData: AngleNumberAxisLabelDatum[] = [];
    protected tickData: AngleNumberAxisTickDatum[] = [];
    protected radiusLine: _Scene.Path = this.axisGroup.appendChild(new Path());

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx, new PolarLinearScale());
        this.includeInvisibleDomains = true;
    }

    get direction() {
        return ChartAxisDirection.X;
    }

    protected assignCrossLineArrayConstructor(crossLines: _ModuleSupport.CrossLine[]) {
        assignJsonApplyConstructedArray(crossLines, AngleCrossLine);
    }

    protected createLabel() {
        return new AngleCategoryAxisLabel();
    }

    update() {
        this.updateScale();
        this.updatePosition();
        this.updateGridLines();
        this.updateTickLines();
        this.updateLabels();
        this.updateRadiusLine();
        this.updateCrossLines();
        return this.scale.ticks().length;
    }

    updatePosition() {
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
        const radius = this.gridLength;

        const { path } = node;
        path.clear({ trackChanges: true });
        path.moveTo(radius, 0);
        path.arc(0, 0, radius, 0, 2 * Math.PI);
        path.closePath();

        node.stroke = this.line.color;
        node.strokeWidth = this.line.width;
        node.fill = undefined;
    }

    protected createTickVisibilityData() {
        const { scale, tick, gridLength: radius } = this;
        const ticks = tick.values ?? scale.ticks?.() ?? [];
        if (ticks.length < 2 || isNaN(tick.minSpacing)) {
            return ticks.map((value) => {
                return { value, visible: true };
            });
        }

        const startTick = ticks[0];
        const startAngle = scale.convert(startTick);
        const startX = radius * Math.cos(startAngle);
        const startY = radius * Math.sin(startAngle);

        for (let step = 1; step < ticks.length - 1; step++) {
            const nextTick = ticks[step];
            const nextAngle = scale.convert(nextTick);
            if (nextAngle - startAngle > Math.PI) {
                // The tick spacing will not grow on the next step
                break;
            }
            const nextX = radius * Math.cos(nextAngle);
            const nextY = radius * Math.sin(nextAngle);
            const spacing = Math.sqrt((nextX - startX) ** 2 + (nextY - startY) ** 2);
            if (spacing > tick.minSpacing) {
                // Filter ticks by step
                const visibleTicks = new Set([startTick]);
                loopSymmetrically(ticks, step, (_, next) => {
                    visibleTicks.add(next);
                });
                return ticks.map((value) => {
                    const visible = visibleTicks.has(value);
                    return { value, visible };
                });
            }
        }

        // If there is no matching step, return a single tick
        return [{ value: startTick, visible: true }];
    }

    protected getVisibleTicks() {
        return this.tickData.filter((tick) => tick.visible).map(({ value }) => value);
    }

    protected updateGridLines() {
        const { scale, gridLength: radius, gridStyle, tick, innerRadiusRatio } = this;
        if (!(gridStyle && radius > 0)) {
            return;
        }

        const ticks = this.getVisibleTicks();
        const innerRadius = radius * innerRadiusRatio;
        this.gridLineGroupSelection.update(tick.enabled ? ticks : []).each((line, value, index) => {
            const style = gridStyle[index % gridStyle.length];
            const angle = scale.convert(value);
            line.x1 = innerRadius * Math.cos(angle);
            line.y1 = innerRadius * Math.sin(angle);
            line.x2 = radius * Math.cos(angle);
            line.y2 = radius * Math.sin(angle);
            line.stroke = style.stroke;
            line.strokeWidth = tick.width;
            line.lineDash = style.lineDash;
            line.fill = undefined;
        });
    }

    protected updateLabels() {
        const { label, tickLabelGroupSelection } = this;

        const ticks = this.getVisibleTicks();
        tickLabelGroupSelection.update(label.enabled ? ticks : []).each((node, _, index) => {
            const labelDatum = this.labelData[index];
            if (labelDatum.hidden) {
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

    protected updateTickLines() {
        const { scale, gridLength: radius, tick, tickLineGroupSelection } = this;

        const ticks = this.getVisibleTicks();
        tickLineGroupSelection.update(tick.enabled ? ticks : []).each((line, value) => {
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
        options: { hideWhenNecessary: boolean },
        seriesRect: _Scene.BBox
    ): AngleNumberAxisLabelDatum[] {
        const { label, gridLength: radius, scale, tick } = this;
        if (!label.enabled) {
            return [];
        }

        const ticks = this.getVisibleTicks();

        const tempText = new Text();

        const seriesLeft = seriesRect.x - this.translation.x;
        const seriesRight = seriesRect.x + seriesRect.width - this.translation.x;

        const labelData: AngleNumberAxisLabelDatum[] = ticks.map((value, index) => {
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
                hidden: text === '' || isLastTickOverFirst,
                rotation,
                box,
            };
        });

        if (label.avoidCollisions) {
            this.avoidLabelCollisions(labelData);
        }

        return labelData;
    }

    private avoidLabelCollisions(labelData: AngleNumberAxisLabelDatum[]) {
        let { minSpacing } = this.label;
        if (!Number.isFinite(minSpacing)) {
            minSpacing = 0;
        }

        if (labelData.length < 3) {
            return;
        }

        const labelsCollide = (prev: AngleNumberAxisLabelDatum, next: AngleNumberAxisLabelDatum) => {
            if (prev.hidden || next.hidden) {
                return false;
            }
            const prevBox = prev.box!.clone().grow(minSpacing / 2);
            const nextBox = next.box!.clone().grow(minSpacing / 2);
            return prevBox.collidesBBox(nextBox);
        };

        const visibleLabels = new Set<AngleNumberAxisLabelDatum>(labelData.slice(0, 1));
        const maxStep = Math.floor(labelData.length / 2);
        for (let step = 1; step <= maxStep; step++) {
            const collisionDetected = loopSymmetrically(labelData, step, labelsCollide);
            if (!collisionDetected) {
                loopSymmetrically(labelData, step, (_, next) => {
                    visibleLabels.add(next);
                });
                break;
            }
        }
        labelData.forEach((datum) => {
            if (!visibleLabels.has(datum)) {
                datum.hidden = true;
                datum.box = undefined;
            }
        });
    }

    computeLabelsBBox(options: { hideWhenNecessary: boolean }, seriesRect: _Scene.BBox) {
        this.tickData = this.createTickVisibilityData();
        this.labelData = this.createLabelNodeData(options, seriesRect);

        const textBoxes = this.labelData.map(({ box }) => box).filter((box): box is _Scene.BBox => box != null);

        if (!this.label.enabled || textBoxes.length === 0) {
            return null;
        }

        return _Scene.BBox.merge(textBoxes);
    }

    protected getLabelOrientation(): AgAngleAxisLabelOrientation {
        const { label } = this;
        return label instanceof AngleCategoryAxisLabel ? label.orientation : 'fixed';
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

    protected updateCrossLines() {
        this.crossLines?.forEach((crossLine) => {
            if (crossLine instanceof AngleCrossLine) {
                crossLine.shape = this.shape;
            }
        });
        super.updateCrossLines({ rotation: 0, parallelFlipRotation: 0, regularFlipRotation: 0, sideFlag: -1 });
    }
}
