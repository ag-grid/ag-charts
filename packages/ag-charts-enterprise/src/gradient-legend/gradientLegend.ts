import type {
    AgChartLegendPosition,
    AgChartLegendLabelFormatterParams,
    AgChartLegendOrientation,
    FontStyle,
    FontWeight,
} from 'ag-charts-community';
import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';
import type { GradientLegendDatum } from './gradientLegendDatum';

const {
    Layers,
    Validate,
    BOOLEAN,
    COLOR_STRING,
    NUMBER,
    OPT_BOOLEAN,
    OPT_NUMBER,
    OPT_FUNCTION,
    OPT_FONT_STYLE,
    OPT_FONT_WEIGHT,
    POSITION,
    STRING,
} = _ModuleSupport;
const { BBox, Group, Rect, Selection, Text, Triangle } = _Scene;
const { createId, tickFormat } = _Util;

class GradientLegendLabel {
    @Validate(OPT_NUMBER(0))
    maxLength?: number = undefined;

    @Validate(COLOR_STRING)
    color: string = 'black';

    @Validate(OPT_FONT_STYLE)
    fontStyle?: FontStyle = undefined;

    @Validate(OPT_FONT_WEIGHT)
    fontWeight?: FontWeight = undefined;

    @Validate(NUMBER(0))
    fontSize: number = 12;

    @Validate(STRING)
    fontFamily: string = 'Verdana, sans-serif';

    @Validate(OPT_FUNCTION)
    formatter?: (params: AgChartLegendLabelFormatterParams) => string = undefined;
}

class GradientLegendStop {
    readonly label = new GradientLegendLabel();
    @Validate(NUMBER(0))
    padding = 8;
}

class GradientBar {
    thickness = 16;
    preferredLength = 100;
}

export class GradientLegend {
    static className = 'GradientLegend';

    readonly id = createId(this);

    private readonly group: _Scene.Group = new Group({ name: 'legend', layer: true, zIndex: Layers.LEGEND_ZINDEX });
    private readonly gradientRect: _Scene.Rect;
    private readonly textSelection: _Scene.Selection<_Scene.Text, number>;
    private readonly arrow: _Scene.Triangle;

    @Validate(BOOLEAN)
    enabled = false;

    @Validate(POSITION)
    position: AgChartLegendPosition = 'bottom';

    @Validate(OPT_BOOLEAN)
    reverseOrder?: boolean = undefined;

    // Placeholder
    pagination?: any = undefined;

    private getOrientation(): AgChartLegendOrientation {
        switch (this.position) {
            case 'right':
            case 'left':
                return 'vertical';
            case 'bottom':
            case 'top':
                return 'horizontal';
        }
    }

    /**
     * Spacing between the legend and the edge of the chart's element.
     */
    @Validate(NUMBER(0))
    spacing = 20;

    private gradient = new GradientBar();

    readonly stop = new GradientLegendStop();

    data: GradientLegendDatum[] = [];

    listeners: any = {};

    private destroyFns: Function[] = [];

    private readonly layoutService: _ModuleSupport.ModuleContext['layoutService'];
    private readonly highlightManager: _ModuleSupport.HighlightManager;

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        this.layoutService = ctx.layoutService;
        const layoutListener = this.layoutService.addListener('start-layout', (e) => this.update(e.shrinkRect));
        this.destroyFns.push(() => this.layoutService.removeListener(layoutListener));

        this.highlightManager = ctx.highlightManager;
        const highlightListener = this.highlightManager.addListener('highlight-change', () =>
            this.onChartHoverChange()
        );
        this.destroyFns.push(() => this.highlightManager.removeListener(highlightListener));

        this.gradientRect = new Rect();
        this.group.append(this.gradientRect);
        this.arrow = new Triangle();
        this.group.append(this.arrow);
        const textContainer = new Group();
        this.group.append(textContainer);
        this.textSelection = Selection.select(textContainer, Text);

        this.destroyFns.push(() => this.detachLegend());
    }

    destroy() {
        this.destroyFns.forEach((f) => f());
    }

    attachLegend(node: _Scene.Node) {
        node.append(this.group);
    }

    detachLegend() {
        this.group.parent?.removeChild(this.group);
    }

    private latestGradientBox: _Scene.BBox | undefined;
    private latestColorDomain: number[] | undefined;

    private update(shrinkRect: _Scene.BBox) {
        const data = this.data[0];

        if (!this.enabled || !data || !data.enabled) {
            this.group.visible = false;
            return { shrinkRect: shrinkRect.clone() };
        }

        const { colorDomain, colorRange } = this.normalizeColorArrays(data);

        const { gradientBox, newShrinkRect, translateX, translateY } = this.getMeasurements(colorDomain, shrinkRect);
        this.updateGradientRect(colorRange, gradientBox);
        this.updateText(colorDomain, gradientBox);
        this.updateArrow(colorDomain, gradientBox);

        this.group.visible = true;
        this.group.translationX = translateX;
        this.group.translationY = translateY;

        this.latestGradientBox = gradientBox;
        this.latestColorDomain = colorDomain;

        return { shrinkRect: newShrinkRect };
    }

    private normalizeColorArrays(data: GradientLegendDatum) {
        let colorDomain = data.colorDomain.slice();
        const colorRange = data.colorRange.slice();

        if (colorDomain.length === colorRange.length) {
            return { colorDomain, colorRange };
        }

        if (colorDomain.length === 2) {
            const count = colorRange.length;
            colorDomain = colorRange.map((_, i) => {
                const [d0, d1] = colorDomain;
                if (i === 0) return d0;
                if (i === count - 1) return d1;
                return d0 + ((d1 - d0) * i) / (count - 1);
            });
        } else if (colorDomain.length > colorRange.length) {
            colorDomain.splice(colorRange.length);
        } else {
            colorRange.splice(colorDomain.length);
        }
        return { colorDomain, colorRange };
    }

    private getMeasurements(colorDomain: number[], shrinkRect: _Scene.BBox) {
        const { preferredLength: gradientLength, thickness } = this.gradient;
        const { padding } = this.stop;
        const [textWidth, textHeight] = this.measureMaxText(colorDomain);

        let width: number;
        let height: number;
        const gradientBox = new BBox(0, 0, 0, 0);
        const orientation = this.getOrientation();
        if (orientation === 'vertical') {
            width = thickness + padding + textWidth;
            height = gradientLength + textHeight;
            gradientBox.x = 0;
            gradientBox.y = textHeight / 2;
            gradientBox.width = thickness;
            gradientBox.height = gradientLength;
        } else {
            const maxWidth = shrinkRect.width;
            const preferredWidth = gradientLength + textWidth;
            const fitTextWidth = textWidth * colorDomain.length;
            width = Math.min(maxWidth, Math.max(preferredWidth, fitTextWidth));
            height = thickness + padding + textHeight;
            gradientBox.x = textWidth / 2;
            gradientBox.y = 0;
            gradientBox.width = width - textWidth;
            gradientBox.height = thickness;
        }

        const { spacing } = this;
        const newShrinkRect = shrinkRect.clone();
        let left: number;
        let top: number;

        if (this.position === 'left') {
            left = shrinkRect.x;
            top = shrinkRect.y + shrinkRect.height / 2 - height / 2;
            newShrinkRect.shrink(width + spacing, 'left');
        } else if (this.position === 'right') {
            left = shrinkRect.x + shrinkRect.width - width;
            top = shrinkRect.y + shrinkRect.height / 2 - height / 2;
            newShrinkRect.shrink(width + spacing, 'right');
        } else if (this.position === 'top') {
            left = shrinkRect.x + shrinkRect.width / 2 - width / 2;
            top = shrinkRect.y;
            newShrinkRect.shrink(height + spacing, 'top');
        } else {
            left = shrinkRect.x + shrinkRect.width / 2 - width / 2;
            top = shrinkRect.y + shrinkRect.height - height;
            newShrinkRect.shrink(height + spacing, 'bottom');
        }

        return {
            translateX: left,
            translateY: top,
            gradientBox,
            newShrinkRect,
        };
    }

    private updateGradientRect(colorRange: string[], gradientBox: _Scene.BBox) {
        if (this.reverseOrder) {
            colorRange = colorRange.slice().reverse();
        }
        const colorsString = colorRange.join(', ');
        const orientation = this.getOrientation();
        const rotation = orientation === 'vertical' ? 0 : 90;
        this.gradientRect.fill = `linear-gradient(${rotation}deg, ${colorsString})`;

        this.gradientRect.x = gradientBox.x;
        this.gradientRect.y = gradientBox.y;
        this.gradientRect.width = gradientBox.width;
        this.gradientRect.height = gradientBox.height;
    }

    private updateText(colorDomain: number[], gradientBox: _Scene.BBox) {
        const { label, padding } = this.stop;
        const orientation = this.getOrientation();
        if (this.reverseOrder) {
            colorDomain = colorDomain.slice().reverse();
        }

        const format = this.formatDomain(colorDomain);

        const setTextPosition = (node: _Scene.Text, index: number) => {
            const t = index / (colorDomain.length - 1);
            if (orientation === 'vertical') {
                node.textAlign = 'start';
                node.textBaseline = 'middle';
                node.x = gradientBox.width + padding;
                node.y = gradientBox.y + gradientBox.height * (1 - t);
            } else {
                node.textAlign = 'center';
                node.textBaseline = 'top';
                node.x = gradientBox.x + gradientBox.width * t;
                node.y = gradientBox.height + padding;
            }
        };

        const tempText = new Text();
        tempText.fontFamily = label.fontFamily;
        tempText.fontSize = label.fontSize;
        tempText.fontStyle = label.fontStyle;
        tempText.fontWeight = label.fontWeight;
        const boxes = colorDomain.map((n, i) => {
            tempText.text = format(n);
            setTextPosition(tempText, i);
            return tempText.computeBBox();
        });
        const textsCollide = boxes.some((box) => {
            return boxes.some((other) => {
                return box !== other && box.collidesBBox(other);
            });
        });

        this.textSelection.update(colorDomain).each((node, datum, i) => {
            const t = i / (colorDomain.length - 1);
            if (textsCollide && t > 0 && t < 1) {
                node.visible = false;
                return;
            }

            node.visible = true;
            node.text = format(datum);
            node.fill = label.color;
            node.fontFamily = label.fontFamily;
            node.fontSize = label.fontSize;
            node.fontStyle = label.fontStyle;
            node.fontWeight = label.fontWeight;

            setTextPosition(node, i);
        });
    }

    private updateArrow(colorDomain: number[], gradientBox: _Scene.BBox) {
        const { arrow, reverseOrder } = this;

        const highlighted = this.highlightManager.getActiveHighlight();
        if (!highlighted) {
            arrow.visible = false;
            return;
        }

        let t: number;
        const colorValue = highlighted.colorValue ?? 0;
        const i = colorDomain.findIndex((d) => colorValue < d);
        if (i === 0) {
            t = 0;
        } else if (i < 0) {
            t = 1;
        } else {
            const d0 = colorDomain[i - 1];
            const d1 = colorDomain[i];
            t = (i - 1 + (colorValue - d0) / (d1 - d0)) / (colorDomain.length - 1);
        }
        if (reverseOrder) {
            t = 1 - t;
        }

        const orientation = this.getOrientation();
        const size = this.stop.label.fontSize;
        let x: number;
        let y: number;
        let rotation: number;
        if (orientation === 'horizontal') {
            x = gradientBox.x + gradientBox.width * t;
            y = gradientBox.y - size / 2;
            rotation = Math.PI;
        } else {
            x = gradientBox.x - size / 2;
            y = gradientBox.y + gradientBox.height * (1 - t);
            rotation = Math.PI / 2;
        }

        arrow.fill = this.stop.label.color;
        arrow.size = size;
        arrow.translationX = x;
        arrow.translationY = y;
        arrow.rotation = rotation;
        arrow.visible = true;
    }

    private formatDomain(domain: number[]) {
        const formatter = this.stop.label.formatter;
        if (formatter) {
            return (d: number) => this.ctx.callbackCache.call(formatter, { value: d } as any);
        }
        return tickFormat(domain, ',.2g');
    }

    private measureMaxText(colorDomain: number[]) {
        const { label } = this.stop;
        const tempText = new Text();
        const format = this.formatDomain(colorDomain);
        const boxes: _Scene.BBox[] = colorDomain.map((d) => {
            const text = format(d);
            tempText.text = text;
            tempText.fill = label.color;
            tempText.fontFamily = label.fontFamily;
            tempText.fontSize = label.fontSize;
            tempText.fontStyle = label.fontStyle;
            tempText.fontWeight = label.fontWeight;
            return tempText.computeBBox();
        });
        const maxWidth = Math.max(...boxes.map((b) => b.width));
        const maxHeight = Math.max(...boxes.map((b) => b.height));
        return [maxWidth, maxHeight];
    }

    computeBBox(): _Scene.BBox {
        return this.group.computeBBox();
    }

    private onChartHoverChange() {
        if (this.enabled && this.latestGradientBox && this.latestColorDomain) {
            this.updateArrow(this.latestColorDomain, this.latestGradientBox);
        }
    }
}
