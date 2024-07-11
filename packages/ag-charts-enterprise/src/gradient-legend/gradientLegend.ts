import {
    type AgChartLegendPosition,
    type AgGradientLegendScaleOptions,
    _ModuleSupport,
    _Scene,
    _Util,
} from 'ag-charts-community';

const { BOOLEAN, OBJECT, POSITION, POSITIVE_NUMBER, BaseProperties, FakeAxis, Layers, ProxyProperty, Validate } =
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
    constructor(protected axis: _ModuleSupport.FakeAxis) {}

    @ProxyProperty('axis.label')
    label!: _ModuleSupport.AxisLabel;

    @ProxyProperty('axis.interval')
    interval!: _ModuleSupport.AxisInterval<number>;

    @ProxyProperty('axis.padding')
    padding?: _ModuleSupport.FakeAxis['padding'];
}

export class GradientLegend {
    static readonly className = 'GradientLegend';

    readonly id = createId(this);

    private readonly axis: _ModuleSupport.FakeAxis;
    private readonly highlightManager: _ModuleSupport.HighlightManager;

    private readonly group: _Scene.Group = new Group({ name: 'legend', layer: true, zIndex: Layers.LEGEND_ZINDEX });
    private readonly gradientRect = new Rect();
    private readonly gradientFill = new LinearGradientFill();
    private readonly arrow = new Triangle();

    private readonly axisGroup = new Group({ name: 'legend-axis-group' });
    private readonly destroyFns: Function[] = [];

    @Validate(BOOLEAN)
    enabled = false;

    @Validate(POSITION)
    position: AgChartLegendPosition = 'bottom';

    @Validate(BOOLEAN, { optional: true })
    reverseOrder?: boolean;

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

        this.axis = new FakeAxis();
        this.axis.attachAxis(this.axisGroup);

        this.scale = new GradientLegendScale(this.axis);

        this.group.append([this.gradientFill, this.arrow, this.axisGroup]);

        this.destroyFns.push(
            ctx.highlightManager.addListener('highlight-change', () => this.onChartHoverChange()),
            ctx.layoutService.addListener('start-layout', (e) => this.onStartLayout(e)),
            () => this.group.parent?.removeChild(this.group)
        );
    }

    destroy() {
        this.destroyFns.forEach((f) => f());
    }

    attachLegend(scene: _Scene.Scene) {
        scene.appendChild(this.group);
    }

    private onStartLayout(ctx: _ModuleSupport.LayoutContext) {
        const [data] = this.data;

        if (!this.enabled || !data?.enabled) {
            this.group.visible = false;
            return ctx;
        }

        const { colorRange } = this.normalizeColorArrays(data);

        this.updateGradientRect(ctx.shrinkRect, colorRange);

        const axisBBox = this.updateAxis(data);
        const { left, top } = this.getMeasurements(ctx.shrinkRect, axisBBox);

        this.updateArrow();

        this.group.visible = true;
        this.group.translationX = left;
        this.group.translationY = top;

        return ctx;
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

        gradientRect.x = 0;
        gradientRect.y = 0;

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
    }

    private updateAxis(data: _ModuleSupport.GradientLegendDatum) {
        const { axis } = this;
        const vertical = this.isVertical();
        const positiveAxis = this.reverseOrder !== vertical;
        const { x, y, width, height } = this.gradientRect;

        axis.position = this.position;
        axis.range = vertical ? [0, height] : [0, width];
        axis.translation.x = x + (vertical ? width : 0);
        axis.translation.y = y + (vertical ? 0 : height);
        axis.setDomain(positiveAxis ? data.colorDomain.slice().reverse() : data.colorDomain);

        return axis.calculateLayout();
    }

    private updateArrow() {
        const highlighted = this.highlightManager.getActiveHighlight();
        const { arrow } = this;

        if (highlighted?.colorValue == null) {
            arrow.visible = false;
            return;
        }

        const { scale, label } = this.axis;
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

        arrow.fill = label.color;
        arrow.size = size;
        arrow.translationX = x;
        arrow.translationY = y;
        arrow.rotation = rotation;
        arrow.visible = true;
    }

    private getMeasurements(shrinkRect: _Scene.BBox, axisBox: _Scene.BBox) {
        let { x: left, y: top } = shrinkRect;
        let { width, height } = this.gradientRect;

        if (this.isVertical()) {
            width += axisBox.width;
        } else {
            height += axisBox.height;
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
        if (this.enabled) {
            this.updateArrow();
        }
    }
}
