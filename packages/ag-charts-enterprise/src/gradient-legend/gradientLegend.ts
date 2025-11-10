import {
    type AgChartLegendPosition,
    type AgGradientLegendOptions,
    type AgGradientLegendScaleOptions,
    type Padding,
    _ModuleSupport,
} from 'ag-charts-community';
import { BaseProperties, CleanupRegistry, Property, createId } from 'ag-charts-core';

import { AxisTicks } from './axisTicks';

const { ZIndexMap, ProxyProperty, LayoutElement, Group, Rect, Marker, TranslatableGroup, BBox, expandLegendPosition } = _ModuleSupport;
class GradientBar extends BaseProperties {
    @Property
    thickness = 16;

    @Property
    preferredLength = 100;
}

class GradientLegendScale
    extends BaseProperties<AgGradientLegendScaleOptions>
    implements Omit<AgGradientLegendScaleOptions, 'label'>
{
    constructor(protected axisTicks: AxisTicks) {
        super();
    }

    @ProxyProperty('axisTicks.label')
    label!: _ModuleSupport.AxisLabel;

    @ProxyProperty('axisTicks.interval')
    interval!: _ModuleSupport.AxisInterval<number>;

    @ProxyProperty('axisTicks.padding')
    padding?: AxisTicks['padding'];
}

export class GradientLegend extends BaseProperties<AgGradientLegendOptions> {
    static readonly className = 'GradientLegend';

    readonly id = createId(this);

    private readonly axisTicks: AxisTicks;
    private readonly highlightManager: _ModuleSupport.HighlightManager;

    private readonly legendGroup = new TranslatableGroup({ name: 'legend', zIndex: ZIndexMap.LEGEND });
    private readonly containerNode = this.legendGroup.appendChild(new Rect({ name: 'legend-container' }));
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
        const { placement } = expandLegendPosition(this.position);
        return placement.startsWith('right') || placement.startsWith('left');
    }

    /**
     * Spacing between the legend and the edge of the chart's element.
     */
    @Property
    spacing = 20;

    @Property
    border = new _ModuleSupport.Border(this.containerNode);

    @Property
    cornerRadius: number = 0;

    @Property
    fill?: string;

    @Property
    fillOpacity: number = 1;

    @Property
    padding: Padding = 4;

    @Property
    scale: GradientLegendScale;

    data: _ModuleSupport.GradientLegendDatum[] = [];

    constructor(readonly ctx: _ModuleSupport.ModuleContext) {
        super();
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

    private onStartLayout({ layoutBox }: _ModuleSupport.LayoutContext) {
        const [data] = this.data;

        if (!this.enabled || !data?.enabled || data.legendType !== 'gradient') {
            this.legendGroup.visible = false;
            return;
        }

        const { colorRange } = this.normalizeColorArrays(data);
        const { strokeWidth, padding } = this.getContainerStyles();
        const gradientRectBBox = this.updateGradientRect(layoutBox, colorRange);
        const axisBBox = this.updateAxis(data, gradientRectBBox) ?? new BBox(0, 0, 0, 0);
        const legendBBox = BBox.merge([gradientRectBBox, axisBBox]);

        legendBBox.grow(padding).grow(strokeWidth);

        const { left, top } = this.getMeasurements(layoutBox, legendBBox);

        this.updateContainer(legendBBox);
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
        const gradientRectBBox = new BBox(0, 0, 0, 0);
        const colorCount = Math.max(colorRange.length - 1, 1);

        let angle: number;
        if (this.isVertical()) {
            angle = 0;
            gradientRectBBox.width = thickness;
            gradientRectBBox.height = Math.min(shrinkRect.height, preferredLength);
        } else {
            angle = 90;
            gradientRectBBox.width = Math.min(shrinkRect.width, preferredLength);
            gradientRectBBox.height = thickness;
        }

        gradientRect.x = gradientRectBBox.x;
        gradientRect.y = gradientRectBBox.y;
        gradientRect.width = gradientRectBBox.width;
        gradientRect.height = gradientRectBBox.height;

        gradientRect.fill = {
            type: 'gradient',
            gradient: 'linear',
            colorSpace: 'oklch',
            colorStops: colorRange.map((color, i) => ({
                stop: i / colorCount,
                color,
            })),
            rotation: angle,
        };

        return gradientRectBBox;
    }

    private updateAxis(data: _ModuleSupport.GradientLegendDatum, gradientRectBBox: _ModuleSupport.BBox) {
        const { axisTicks, gradient, scale } = this;
        const { placement } = expandLegendPosition(this.position);
        const vertical = this.isVertical();
        const positiveAxis = this.reverseOrder !== vertical;

        axisTicks.placement = placement;
        const offset = gradient.thickness + (scale.padding ?? 0);
        axisTicks.translationX = vertical ? offset : gradientRectBBox.x;
        axisTicks.translationY = vertical ? gradientRectBBox.y : offset;
        axisTicks.scale.domain = positiveAxis ? data.colorDomain.slice().reverse() : data.colorDomain;
        axisTicks.scale.range = vertical
            ? [gradientRectBBox.x, gradientRectBBox.height]
            : [gradientRectBBox.y, gradientRectBBox.width];

        return axisTicks.calculateLayout();
    }

    private updateContainer(bbox: _ModuleSupport.BBox) {
        const containerStyles = this.getContainerStyles();

        _ModuleSupport.applyShapeStyle(this.containerNode, containerStyles);
        this.containerNode.cornerRadius = containerStyles.cornerRadius;

        this.containerNode.x = bbox.x;
        this.containerNode.y = bbox.y;
        this.containerNode.width = bbox.width;
        this.containerNode.height = bbox.height;
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

    private getMeasurements(shrinkRect: _ModuleSupport.BBox, legendBBox: _ModuleSupport.BBox) {
        function unreachable(_a: never): never {
            return undefined as never;
        }

        let { x: left, y: top } = shrinkRect;
        const { width, height } = legendBBox;
        const { placement, floating, xOffset, yOffset } = expandLegendPosition(this.position);

        const containerStyles = this.getContainerStyles();

        left += containerStyles.strokeWidth + containerStyles.padding.left;
        top += containerStyles.strokeWidth + containerStyles.padding.top;

        switch (placement) {
            case 'left':
                top += shrinkRect.height / 2 - height / 2;
                break;
            case 'right':
                left += shrinkRect.width - width;
                top += shrinkRect.height / 2 - height / 2;
                break;
            case 'top':
                left += shrinkRect.width / 2 - width / 2;
                break;
            case 'bottom':
                left += shrinkRect.width / 2 - width / 2;
                top += shrinkRect.height - height;
                break;
            case 'right-top':
            case 'top-right':
                left += shrinkRect.width - width;
                break;
            case 'right-bottom':
            case 'bottom-right':
                left += shrinkRect.width - width;
                top += shrinkRect.height - height;
                break;
            case 'left-bottom':
            case 'bottom-left':
                top += shrinkRect.height - height;
                break;
            case 'left-top':
            case 'top-left':
                break;
            default:
                unreachable(placement);
        }

        if (!floating) {
            switch (placement) {
                case 'left':
                case 'left-top':
                case 'left-bottom':
                    shrinkRect.shrink(width + this.spacing, 'left');
                    break;
                case 'right':
                case 'right-top':
                case 'right-bottom':
                    shrinkRect.shrink(width + this.spacing, 'right');
                    break;
                case 'top':
                case 'top-left':
                case 'top-right':
                    shrinkRect.shrink(height + this.spacing, 'top');
                    break;
                case 'bottom':
                case 'bottom-left':
                case 'bottom-right':
                    shrinkRect.shrink(height + this.spacing, 'bottom');
                    break;
                default:
                    unreachable(placement);
            }
        }

        left += xOffset;
        top += yOffset;
        return { top, left };
    }

    private getContainerStyles() {
        const { stroke, strokeOpacity, strokeWidth } = this.border;
        const { cornerRadius, fill, fillOpacity, padding } = this;
        const isPaddingNumber = typeof padding === 'number';

        return {
            cornerRadius,
            fill,
            fillOpacity,
            padding: {
                top: isPaddingNumber ? padding : padding.top ?? 0,
                right: isPaddingNumber ? padding : padding.right ?? 0,
                bottom: isPaddingNumber ? padding : padding.bottom ?? 0,
                left: isPaddingNumber ? padding : padding.left ?? 0,
            },
            stroke,
            strokeOpacity,
            strokeWidth: this.border.enabled ? strokeWidth : 0,
        };
    }

    private onChartHoverChange() {
        if (!this.enabled) return;
        this.updateArrow();
    }
}
