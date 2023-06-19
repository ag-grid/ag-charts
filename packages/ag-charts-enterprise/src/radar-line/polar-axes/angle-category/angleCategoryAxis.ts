import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

const { ChartAxisDirection } = _ModuleSupport;
const { BandScale } = _Scale;
const { Text } = _Scene;
const { isNumberEqual } = _Util;

interface AngleCategoryAxisLabelDatum {
    text: string;
    x: number;
    y: number;
    hidden: boolean;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
}

export class AngleCategoryAxis extends _ModuleSupport.PolarAxis {
    static className = 'AngleCategoryAxis';
    static type = 'polar-angle-category' as const;

    protected labelData: AngleCategoryAxisLabelDatum[] = [];

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx, new BandScale());
    }

    get direction() {
        return ChartAxisDirection.X;
    }

    update() {
        this.updateScale();
        const ticks = this.scale.domain;
        this.updatePosition();
        this.updateGridLines();
        this.updateTickLines();
        this.updateLabels();
        return ticks.length;
    }

    updatePosition() {
        const { translation, axisGroup, gridGroup } = this;
        const translationX = Math.floor(translation.x);
        const translationY = Math.floor(translation.y);

        axisGroup.translationX = translationX;
        axisGroup.translationY = translationY;

        gridGroup.translationX = translationX;
        gridGroup.translationY = translationY;
    }

    protected updateGridLines() {
        const { scale, gridLength: radius, gridStyle, tick } = this;
        if (!(gridStyle && radius > 0)) {
            return;
        }

        const ticks = scale.ticks?.() ?? [];
        this.gridLineGroupSelection.update(ticks).each((line, value, index) => {
            const style = gridStyle[index % gridStyle.length];
            const angle = scale.convert(value);
            line.x1 = 0;
            line.y1 = 0;
            line.x2 = radius * Math.cos(angle);
            line.y2 = radius * Math.sin(angle);
            line.stroke = style.stroke;
            line.strokeWidth = tick.width;
            line.lineDash = style.lineDash;
            line.fill = undefined;
        });
    }

    protected updateLabels() {
        const { label, tickLabelGroupSelection, scale } = this;

        const ticks = scale.ticks?.() || [];
        tickLabelGroupSelection.update(ticks).each((node, _, index) => {
            const labelDatum = this.labelData[index];
            node.text = labelDatum.text;
            node.setFont(label);
            node.fill = label.color;
            node.x = labelDatum.x;
            node.y = labelDatum.y;
            node.textAlign = labelDatum.textAlign;
            node.textBaseline = labelDatum.textBaseline;
        });
    }

    protected updateTickLines() {
        const { scale, gridLength: radius, tick, tickLineGroupSelection } = this;

        const ticks = scale.ticks?.() || [];
        tickLineGroupSelection.update(ticks).each((line, value) => {
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

    computeLabelsBBox(options: { hideWhenNecessary: boolean }, seriesRect: _Scene.BBox) {
        this.labelData = [];

        const { label, gridLength: radius, scale, tick } = this;
        if (!label.enabled) {
            return null;
        }

        const ticks = scale.ticks?.() || [];

        const tempText = new Text();
        const textBoxes: _Scene.BBox[] = [];

        const seriesLeft = seriesRect.x - this.translation.x;
        const seriesRight = seriesRect.x + seriesRect.width - this.translation.x;

        ticks.forEach((value) => {
            const distance = radius + label.padding + tick.size;
            const angle = scale.convert(value);
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const x = distance * cos;
            const y = distance * sin;
            const textAlign = isNumberEqual(cos, 0) ? 'center' : cos > 0 ? 'left' : 'right';
            const textBaseline = isNumberEqual(sin, 0) ? 'middle' : sin > 0 ? 'top' : 'bottom';

            let text = String(value);
            tempText.text = text;
            tempText.x = x;
            tempText.y = y;
            tempText.setFont(label);
            tempText.textAlign = textAlign;
            tempText.textBaseline = textBaseline;

            let box: _Scene.BBox | null = tempText.computeBBox();
            if (options.hideWhenNecessary) {
                const overflowLeft = seriesLeft - box.x;
                const overflowRight = box.x + box.width - seriesRight;
                const pixelError = 1;
                if (overflowLeft > pixelError || overflowRight > pixelError) {
                    const availWidth = box.width - Math.max(overflowLeft, overflowRight);
                    text = Text.wrap(text, availWidth, Infinity, label, 'never');
                    if (text === '\u2026') {
                        text = '';
                        box = null;
                    }
                    tempText.text = text;
                    box = tempText.computeBBox();
                }
            }

            this.labelData.push({
                text,
                x,
                y,
                textAlign,
                textBaseline,
                hidden: text === '',
            });

            box && textBoxes.push(box);
        });

        if (textBoxes.length === 0) {
            return null;
        }

        return _Scene.BBox.merge(textBoxes);
    }
}
