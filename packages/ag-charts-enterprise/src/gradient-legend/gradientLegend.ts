import { type AgChartLegendPosition, type AgGradientLegendScaleOptions, _ModuleSupport } from 'ag-charts-community';
import { CleanupRegistry, createId } from 'ag-charts-core';

import { AxisTicks } from './axisTicks';

const {
    BaseProperties,
    ZIndexMap,
    ProxyProperty,
    Property,
    LayoutElement,
    Group,
    Rect,
    Marker,
    TranslatableGroup,
    BBox,
} = _ModuleSupport;

class GradientBar extends BaseProperties {
    @Property
    thickness = 16;

    @Property
    preferredLength = 100;
}

class GradientLegendScale implements Omit<AgGradientLegendScaleOptions, 'label'> {
    constructor(protected axisTicks: AxisTicks) {}

    @ProxyProperty('axisTicks.label')
    label!: _ModuleSupport.AxisLabel;

    @ProxyProperty('axisTicks.interval')
    interval!: _ModuleSupport.AxisInterval<number>;

    @ProxyProperty('axisTicks.padding')
    padding?: AxisTicks['padding'];
}

export class GradientLegend {
    static readonly className = 'GradientLegend';

    readonly id = createId(this);

    private readonly axisTicks: AxisTicks;
    private readonly highlightManager: _ModuleSupport.HighlightManager;

    private readonly legendGroup = new TranslatableGroup({ name: 'legend', zIndex: ZIndexMap.LEGEND });
    private readonly gradientRect = new Rect();
    private readonly arrow = new Marker({ shape: 'triangle' });

    private readonly ticksGroup = new Group({ name: 'legend-axis-group' });
    private readonly cleanup = new CleanupRegistry();

    @Property
    enabled = false;

    @Property
    position: AgChartLegendPosition = 'bottom';

    @Property
    reverseOrder: boolean = false;

    @Property
    readonly gradient = new GradientBar();

    private isVertical(): boolean {
        return this.position === 'right' || this.position === 'left';
    }

    /**
     * Spacing between the legend and the edge of the chart's element.
     */
    @Property
    spacing = 20;

    scale: GradientLegendScale;

    data: _ModuleSupport.GradientLegendDatum[] = [];

    constructor(readonly ctx: _ModuleSupport.ModuleContext) {
        this.highlightManager = ctx.highlightManager;

        this.axisTicks = new AxisTicks(ctx, this);
        this.axisTicks.attachAxis(this.ticksGroup);

        this.scale = new GradientLegendScale(this.axisTicks);

        this.legendGroup.append([this.gradientRect, this.arrow, this.ticksGroup]);

        this.cleanup.register(
            ctx.eventsHub.on('highlight:change', () => this.onChartHoverChange()),
            ctx.layoutManager.registerElement(LayoutElement.Legend, (e) => this.onStartLayout(e)),
            () => this.legendGroup.remove()
        );
    }

    destroy() {
        this.cleanup.flush();
    }

    attachLegend(scene: _ModuleSupport.Scene) {
        scene.appendChild(this.legendGroup);
    }

    private onStartLayout(ctx: _ModuleSupport.LayoutContext) {
        const [data] = this.data;

        if (!this.enabled || !data?.enabled || data.legendType !== 'gradient') {
            this.legendGroup.visible = false;
            return;
        }

        const { colorRange } = this.normalizeColorArrays(data);

        this.updateGradientRect(ctx.layoutBox, colorRange);

        const axisBBox = this.updateAxis(data) ?? new BBox(0, 0, 0, 0);
        const { left, top } = this.getMeasurements(ctx.layoutBox, axisBBox);

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

    private updateGradientRect(shrinkRect: _ModuleSupport.BBox, colorRange: string[]) {
        const { gradientRect, gradient } = this;
        const { preferredLength, thickness } = gradient;

        let angle: number;
        if (this.isVertical()) {
            angle = 0;
            gradientRect.width = thickness;
            gradientRect.height = Math.min(shrinkRect.height, preferredLength);
        } else {
            angle = 90;
            gradientRect.width = Math.min(shrinkRect.width, preferredLength);
            gradientRect.height = thickness;
        }

        gradientRect.fill = {
            type: 'gradient',
            gradient: 'linear',
            colorSpace: 'oklch',
            colorStops: colorRange.map((color, i) => ({
                stop: i / (colorRange.length - 1),
                color,
            })),
            rotation: angle,
        };
    }

    private updateAxis(data: _ModuleSupport.GradientLegendDatum) {
        const { position, axisTicks, gradient, scale, gradientRect } = this;
        const vertical = this.isVertical();
        const positiveAxis = this.reverseOrder !== vertical;

        axisTicks.position = position;
        const offset = gradient.thickness + (scale.padding ?? 0);
        axisTicks.translationX = vertical ? offset : 0;
        axisTicks.translationY = vertical ? 0 : offset;
        axisTicks.scale.domain = positiveAxis ? data.colorDomain.slice().reverse() : data.colorDomain;
        axisTicks.scale.range = vertical ? [0, gradientRect.height] : [0, gradientRect.width];

        let bbox = new BBox(0, 0, gradientRect.width, gradientRect.height);
        const axisBbox = axisTicks.calculateLayout();
        if (axisBbox) {
            bbox = BBox.merge([bbox, axisBbox]);
        }

        return bbox;
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

    private getMeasurements(shrinkRect: _ModuleSupport.BBox, axisBox: _ModuleSupport.BBox) {
        let { x: left, y: top } = shrinkRect;
        const { width, height } = axisBox;

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
                break;

            default:
                this.position satisfies never;
        }

        return { top, left };
    }

    private onChartHoverChange() {
        if (!this.enabled) return;
        this.updateArrow();
    }
}
