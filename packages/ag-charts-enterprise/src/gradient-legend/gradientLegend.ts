import {
    type AgChartLegendPosition,
    type AgGradientLegendOptions,
    type AgGradientLegendScaleOptions,
    type Padding,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    BaseProperties,
    Border,
    CleanupRegistry,
    type GradientColorStop,
    Property,
    ProxyProperty,
    ZIndexMap,
    createId,
    expandLegendPosition,
} from 'ag-charts-core';

import { AxisTicks } from './axisTicks';

const { AxisInterval, AxisLabel, LayoutElement, Group, Rect, Marker, TranslatableGroup, Selection, BBox } =
    _ModuleSupport;

const ITEM_SPACING = 16;

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
    constructor(
        protected config: {
            label: _ModuleSupport.AxisLabel;
            interval: _ModuleSupport.AxisInterval<number>;
            padding: number;
        }
    ) {
        super();
    }

    @ProxyProperty('config.label')
    label!: _ModuleSupport.AxisLabel;

    @ProxyProperty('config.interval')
    interval!: _ModuleSupport.AxisInterval<number>;

    @ProxyProperty('config.padding')
    padding?: number;
}

export class GradientLegend extends BaseProperties<AgGradientLegendOptions> {
    static readonly className = 'GradientLegend';

    readonly id = createId(this);

    private readonly legendGroup = new TranslatableGroup({ name: 'legend', zIndex: ZIndexMap.LEGEND });
    private readonly containerNode = this.legendGroup.appendChild(new Rect({ name: 'legend-container' }));
    private readonly gradientRectSelection = Selection.select(this.legendGroup, Rect);
    private readonly arrowSelection = Selection.select(this.legendGroup, () => new Marker({ shape: 'triangle' }));
    private readonly ticksGroupSelection = Selection.select(
        this.legendGroup,
        () => new Group({ name: 'legend-axis-group' })
    );

    private readonly scaleConfig = {
        label: new AxisLabel(),
        interval: new AxisInterval(),
        padding: 0,
    };
    private readonly axisTicks: AxisTicks[] = [];
    private enabledData: _ModuleSupport.GradientLegendDatum[] = [];

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
    border = new Border(this.containerNode);

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

        this.scale = new GradientLegendScale(this.scaleConfig);

        this.cleanup.register(
            ctx.chartState.observe((get) => {
                const highlighted = get('highlight');
                if (!this.enabled) return;
                this.updateArrows(highlighted);
            }),
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
        const allEnabled = this.data.filter((d) => d.enabled && d.legendType === 'gradient');
        this.enabledData = allEnabled.filter((d, i) => i === 0 || d.showSeparately === true);

        if (!this.enabled || this.enabledData.length === 0) {
            this.legendGroup.visible = false;
            return;
        }

        this.gradientRectSelection.update(this.enabledData);
        this.arrowSelection.update(this.enabledData);
        this.ticksGroupSelection.update(this.enabledData, (group) => {
            const axisTicks = new AxisTicks(this.ctx);
            axisTicks.attachAxis(group);
            this.axisTicks.push(axisTicks);
        });
        this.axisTicks.length = this.enabledData.length;

        const vertical = this.isVertical();
        const { strokeWidth, padding } = this.getContainerStyles();
        const itemBBoxes: _ModuleSupport.BBox[] = [];

        let offset = 0;
        for (let i = 0; i < this.enabledData.length; i++) {
            const data = this.enabledData[i];
            const gradientRect = this.gradientRectSelection.at(i)!;
            const axisTicks = this.axisTicks[i];

            // Layout in local coordinates (origin at 0,0).
            const gradientRectBBox = this.updateGradientRect(gradientRect, layoutBox, data.colorStops);
            const axisBBox = this.updateAxis(axisTicks, data, gradientRectBBox) ?? new BBox(0, 0, 0, 0);
            const localBBox = BBox.merge([gradientRectBBox, axisBBox]);

            // Shift nodes by the accumulated offset.
            const dx = vertical ? 0 : offset;
            const dy = vertical ? offset : 0;
            gradientRect.x += dx;
            gradientRect.y += dy;
            axisTicks.applyOffset(dx, dy);

            itemBBoxes.push(localBBox.translate(dx, dy));
            offset += (vertical ? localBBox.height : localBBox.width) + ITEM_SPACING;
        }

        const legendBBox = BBox.merge(itemBBoxes);
        legendBBox.grow(padding).grow(strokeWidth);

        const { left, top } = this.getMeasurements(layoutBox, legendBBox);

        this.updateContainer(legendBBox);
        this.updateArrows(this.ctx.chartState.getValue('highlight'));

        this.legendGroup.visible = true;
        this.legendGroup.translationX = left;
        this.legendGroup.translationY = top;
    }

    private updateGradientRect(
        gradientRect: InstanceType<typeof Rect>,
        shrinkRect: _ModuleSupport.BBox,
        colorStops: GradientColorStop[]
    ) {
        const { preferredLength, thickness } = this.gradient;
        const gradientRectBBox = new BBox(0, 0, 0, 0);

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
            colorStops,
            rotation: angle,
        };

        return gradientRectBBox;
    }

    private updateAxis(
        axisTicks: AxisTicks,
        data: _ModuleSupport.GradientLegendDatum,
        gradientRectBBox: _ModuleSupport.BBox
    ) {
        const { scaleConfig, gradient, scale } = this;

        const mainLabel = scaleConfig.label;
        axisTicks.label.fontFamily = mainLabel.fontFamily;
        axisTicks.label.fontSize = mainLabel.fontSize;
        axisTicks.label.fontStyle = mainLabel.fontStyle;
        axisTicks.label.fontWeight = mainLabel.fontWeight;
        axisTicks.label.color = mainLabel.color;
        axisTicks.label.formatter = mainLabel.formatter;
        axisTicks.interval.step = scaleConfig.interval.step;
        axisTicks.interval.minSpacing = scaleConfig.interval.minSpacing;
        axisTicks.interval.maxSpacing = scaleConfig.interval.maxSpacing;
        axisTicks.padding = scaleConfig.padding;
        const { placement } = expandLegendPosition(this.position);
        const vertical = this.isVertical();
        const positiveAxis = this.reverseOrder !== vertical;

        axisTicks.placement = placement;
        axisTicks.boundSeries = data.series;
        const tickOffset = gradient.thickness + (scale.padding ?? 0);
        axisTicks.translationX = vertical ? tickOffset : gradientRectBBox.x;
        axisTicks.translationY = vertical ? gradientRectBBox.y : tickOffset;
        axisTicks.namedLabels = data.namedLabels;
        const [dMin, dMax] = data.axisDomain;
        axisTicks.scale.domain = positiveAxis ? [dMax, dMin] : [dMin, dMax];
        axisTicks.scale.range = vertical
            ? [gradientRectBBox.x, gradientRectBBox.height]
            : [gradientRectBBox.y, gradientRectBBox.width];

        return axisTicks.calculateLayout();
    }

    private updateContainer(bbox: _ModuleSupport.BBox) {
        const containerStyles = this.getContainerStyles();

        this.containerNode.setStyleProperties(containerStyles);
        this.containerNode.cornerRadius = containerStyles.cornerRadius;

        this.containerNode.x = bbox.x;
        this.containerNode.y = bbox.y;
        this.containerNode.width = bbox.width;
        this.containerNode.height = bbox.height;
    }

    private updateArrows(highlighted: _ModuleSupport.HighlightNodeDatum | undefined) {
        const highlightSeriesId = highlighted?.series?.id;

        for (let i = 0; i < this.enabledData.length; i++) {
            const arrow = this.arrowSelection.at(i)!;
            const axisTicks = this.axisTicks[i];
            const gradientRect = this.gradientRectSelection.at(i)!;
            const data = this.enabledData[i];

            if (
                highlighted?.colorValue == null ||
                highlighted.series?.isHighlightEnabled() === false ||
                (highlightSeriesId != null && data?.seriesId !== highlightSeriesId)
            ) {
                arrow.visible = false;
                continue;
            }

            const { scale, label } = axisTicks;
            const size = label.fontSize ?? 0;
            const t = scale.convert(highlighted.colorValue);
            let { x, y } = gradientRect;
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
    }

    private getMeasurements(shrinkRect: _ModuleSupport.BBox, legendBBox: _ModuleSupport.BBox) {
        const unreachable = (_a: never): never => {
            return undefined as never;
        };

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
}
