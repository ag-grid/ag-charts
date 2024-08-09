import {
    type AgChartLegendPosition,
    type AgGradientLegendScaleOptions,
    _ModuleSupport,
    _Scene,
    _Util,
} from 'ag-charts-community';

const { BOOLEAN, OBJECT, POSITION, POSITIVE_NUMBER, BaseProperties, AxisTicks, Layers, ProxyProperty, Validate } =
    _ModuleSupport;
const { Group, Rect, LinearGradientFill, Triangle } = _Scene;
const { createId } = _Util;

class GradientBar extends BaseProperties {
    @Validate(POSITIVE_NUMBER)
    thickness = 16;

    @Validate(POSITIVE_NUMBER)
    preferredLength = 100;
}

class GradientLegendScale implements AgGradientLegendScaleOptions {
    constructor(protected axisTicks: _ModuleSupport.AxisTicks) {}

    @ProxyProperty('axisTicks.label')
    label!: _ModuleSupport.AxisLabel;

    @ProxyProperty('axisTicks.interval')
    interval!: _ModuleSupport.AxisInterval<number>;

    @ProxyProperty('axisTicks.padding')
    padding?: _ModuleSupport.AxisTicks['padding'];
}

export class GradientLegend {
    static readonly className = 'GradientLegend';

    readonly id = createId(this);

    private readonly axisTicks: _ModuleSupport.AxisTicks;
    private readonly highlightManager: _ModuleSupport.HighlightManager;

    private readonly legendGroup = new Group({
        name: 'legend',
        layer: true,
        zIndex: Layers.LEGEND_ZINDEX,
    });
    private readonly gradientRect = new Rect();
    private readonly gradientFill = new LinearGradientFill();
    private readonly arrow = new Triangle();

    private readonly ticksGroup = new Group({ name: 'legend-axis-group' });
    private readonly destroyFns: Function[] = [];

    @Validate(BOOLEAN)
    enabled = false;

    @Validate(POSITION)
    position: AgChartLegendPosition = 'bottom';

    @Validate(BOOLEAN)
    reverseOrder: boolean = false;

    @Validate(OBJECT)
    readonly gradient = new GradientBar();

    private isVertical(): boolean {
        return this.position === 'right' || this.position === 'left';
    }

    /**
     * Spacing between the legend and the edge of the chart's element.
     */
    @Validate(POSITIVE_NUMBER)
    spacing = 20;

    scale: GradientLegendScale;

    data: _ModuleSupport.GradientLegendDatum[] = [];

    constructor(readonly ctx: _ModuleSupport.ModuleContext) {
        this.highlightManager = ctx.highlightManager;

        this.gradientFill.mask = this.gradientRect;

        this.axisTicks = new AxisTicks();
        this.axisTicks.attachAxis(this.ticksGroup);

        this.scale = new GradientLegendScale(this.axisTicks);

        this.legendGroup.append([this.gradientFill, this.arrow, this.ticksGroup]);

        this.destroyFns.push(
            ctx.highlightManager.addListener('highlight-change', () => this.onChartHoverChange()),
            ctx.layoutService.on('start-layout', (e) => this.onStartLayout(e)),
            () => this.legendGroup.parent?.removeChild(this.legendGroup)
        );
    }

    destroy() {
        this.destroyFns.forEach((f) => f());
    }

    attachLegend(scene: _Scene.Scene) {
        scene.appendChild(this.legendGroup);
    }

    private onStartLayout(ctx: _ModuleSupport.LayoutContext) {
        const [data] = this.data;

        if (!this.enabled || !data?.enabled) {
            this.legendGroup.visible = false;
            return;
        }

        const { colorRange } = this.normalizeColorArrays(data);

        this.updateGradientRect(ctx.shrinkRect, colorRange);

        const axisBBox = this.updateAxis(data);
        const { left, top } = this.getMeasurements(ctx.shrinkRect, axisBBox);

        this.updateArrow();

        this.legendGroup.visible = true;
        this.legendGroup.translationX = left;
        this.legendGroup.translationY = top;
    }

    private normalizeColorArrays(data: _ModuleSupport.GradientLegendDatum) {
        let colorDomain = data.colorDomain.slice();
        const colorRange = data.colorRange.slice();

        if (colorDomain.length === colorRange.length) {
            return { colorDomain, colorRange };
        }

        if (colorDomain.length > colorRange.length) {
            colorRange.splice(colorDomain.length);
        }

        const [d0, d1] = colorDomain;
        const count = colorRange.length;
        colorDomain = colorRange.map((_, i) => {
            if (i === 0) {
                return d0;
            } else if (i === count - 1) {
                return d1;
            }
            return d0 + ((d1 - d0) * i) / (count - 1);
        });

        return { colorDomain, colorRange };
    }

    private updateGradientRect(shrinkRect: _Scene.BBox, colorRange: string[]) {
        const { reverseOrder, gradientFill, gradientRect } = this;
        const { preferredLength, thickness } = this.gradient;

        gradientFill.stops = colorRange;

        if (this.isVertical()) {
            gradientRect.width = thickness;
            gradientRect.height = Math.min(shrinkRect.height, preferredLength);
            gradientFill.direction = reverseOrder ? 'to-bottom' : 'to-top';
        } else {
            gradientRect.width = Math.min(shrinkRect.width, preferredLength);
            gradientRect.height = thickness;
            gradientFill.direction = reverseOrder ? 'to-left' : 'to-right';
        }

        gradientRect.markDirty(gradientRect);
    }

    private updateAxis(data: _ModuleSupport.GradientLegendDatum) {
        const { axisTicks } = this;
        const vertical = this.isVertical();
        const positiveAxis = this.reverseOrder !== vertical;

        axisTicks.position = this.position;
        axisTicks.translationX = vertical ? this.gradient.thickness : 0;
        axisTicks.translationY = vertical ? 0 : this.gradient.thickness;
        axisTicks.scale.domain = positiveAxis ? data.colorDomain.slice().reverse() : data.colorDomain;
        axisTicks.scale.range = vertical ? [0, this.gradientRect.height] : [0, this.gradientRect.width];

        return axisTicks.calculateLayout();
    }

    private updateArrow() {
        const highlighted = this.highlightManager.getActiveHighlight();
        const { arrow } = this;

        if (highlighted?.colorValue == null) {
            arrow.visible = false;
            return;
        }

        const { scale, label } = this.axisTicks;
        const size = label.fontSize ?? 0;
        const t = scale.convert(highlighted.colorValue);
        let { x, y } = this.gradientRect;
        let rotation = Math.PI;

        if (this.isVertical()) {
            x -= size / 2;
            y += t;
            rotation /= 2;
        } else {
            x += t;
            y -= size / 2;
        }

        arrow.visible = true;
        arrow.fill = label.color;
        arrow.rotation = rotation;
        arrow.size = size;
        arrow.translationX = x;
        arrow.translationY = y;
    }

    private getMeasurements(shrinkRect: _Scene.BBox, axisBox: _Scene.BBox) {
        let { x: left, y: top } = shrinkRect;
        let { width, height } = this.gradientRect;

        // Because of the rotation technique used by axes rendering labels are padded 5px off,
        // which need to be account for in these calculations to make sure labels aren't being clipped.
        // This will become obsolete only once axes rotation technique would be removed.
        if (this.isVertical()) {
            width += axisBox.width + 5;
        } else {
            height += axisBox.height + 5;
        }

        switch (this.position) {
            case 'left':
                top += shrinkRect.height / 2 - height / 2;
                shrinkRect.shrink(width + this.spacing, 'left');
                break;

            case 'right':
                left += shrinkRect.width - width;
                top += shrinkRect.height / 2 - height / 2;
                shrinkRect.shrink(width + this.spacing, 'right');
                break;

            case 'top':
                left += shrinkRect.width / 2 - width / 2;
                shrinkRect.shrink(height + this.spacing, 'top');
                break;

            case 'bottom':
                left += shrinkRect.width / 2 - width / 2;
                top += shrinkRect.height - height;
                shrinkRect.shrink(height + this.spacing, 'bottom');
        }

        return { top, left };
    }

    private onChartHoverChange() {
        if (!this.enabled) return;
        this.updateArrow();
    }
}
