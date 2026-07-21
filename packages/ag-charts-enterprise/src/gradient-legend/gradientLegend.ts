import { _ModuleSupport } from 'ag-charts-community';
import {
    AbstractModuleInstance,
    ChartUpdateType,
    type DynamicContext,
    type GradientColorStop,
    type NormalisedGradientLegendOptions,
    ZIndexMap,
    createId,
    expandLegendPosition,
} from 'ag-charts-core';
import type { CssColor } from 'ag-charts-types';

import { AxisTicks } from './axisTicks';

const { LayoutElement, Group, Rect, Marker, TranslatableGroup, Selection, BBox } = _ModuleSupport;

const ITEM_SPACING = 16;

export class GradientLegend extends AbstractModuleInstance {
    readonly id = createId(this);

    private readonly legendGroup = new TranslatableGroup({ name: 'legend', zIndex: ZIndexMap.LEGEND });
    private readonly containerNode = this.legendGroup.appendChild(new Rect({ name: 'legend-container' }));
    private readonly gradientRectSelection = Selection.select(this.legendGroup, Rect);
    private readonly arrowSelection = Selection.select(this.legendGroup, () => new Marker({ shape: 'triangle' }));
    private readonly ticksGroupSelection = Selection.select(
        this.legendGroup,
        () => new Group({ name: 'legend-axis-group' })
    );

    private readonly axisTicks: AxisTicks[] = [];
    private enabledData: _ModuleSupport.GradientLegendDatum[] = [];

    data: _ModuleSupport.GradientLegendDatum[] = [];

    // GradientLegend is only created when the `gradientLegend` subtree is configured,
    // so assert presence here and rely on the module's themeTemplate (which spreads
    // LEGEND_CONTAINER_THEME) for field-level defaults.
    private get opts(): NormalisedGradientLegendOptions {
        return this.ctx.chartState.getValue('options', 'gradientLegend')!;
    }

    get enabled(): boolean {
        return this.opts.enabled;
    }

    private isVertical(): boolean {
        const { placement } = expandLegendPosition(this.opts.position);
        return placement.startsWith('right') || placement.startsWith('left');
    }

    constructor(readonly ctx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super();

        this.cleanup.register(
            ctx.chartState.observe((get) => {
                const highlighted = get('highlight');
                if (this.enabled) {
                    this.updateArrows(highlighted);
                }
            }),
            ctx.layoutManager.registerElement(LayoutElement.Legend, (e) => this.onStartLayout(e)),
            // When node highlighting is suppressed the series-update path is skipped, so nothing
            // flushes the highlight observer. Request a render so the arrow tracks the hovered node
            // regardless of the series' highlight.enabled setting.
            ctx.eventsHub.on('highlight:change', (event) => {
                if (event.highlightSuppressed) {
                    ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.SCENE_RENDER });
                }
            }),
            () => this.legendGroup.remove()
        );
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

            const gradientRectBBox = this.updateGradientRect(gradientRect, layoutBox, data.colorStops);
            const axisBBox = this.updateAxis(axisTicks, data, gradientRectBBox) ?? new BBox(0, 0, 0, 0);
            const localBBox = BBox.merge([gradientRectBBox, axisBBox]);

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
        const { thickness, preferredLength } = this.opts.gradient;
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
        const opts = this.opts;
        const scale = opts.scale;
        const scalePadding = scale.padding;
        const gradientThickness = opts.gradient.thickness;

        axisTicks.labelOptions = scale.label;
        axisTicks.intervalOptions = scale.interval;
        axisTicks.padding = scalePadding;
        const { placement } = expandLegendPosition(opts.position);
        const vertical = placement.startsWith('right') || placement.startsWith('left');
        const positiveAxis = opts.reverseOrder !== vertical;

        axisTicks.placement = placement;
        axisTicks.boundSeries = data.series;
        const tickOffset = gradientThickness + scalePadding;
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

            const [dMin, dMax] = data.axisDomain;
            if (
                highlighted?.colorValue == null ||
                (highlightSeriesId != null && data.seriesId !== highlightSeriesId) ||
                highlighted.colorValue < dMin ||
                highlighted.colorValue > dMax
            ) {
                arrow.visible = false;
                continue;
            }

            const { scale, labelOptions } = axisTicks;
            const size = labelOptions?.fontSize ?? 0;
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
            arrow.fill = labelOptions?.color;
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

        const opts = this.opts;
        const spacing = opts.spacing;
        let { x: left, y: top } = shrinkRect;
        const { width, height } = legendBBox;
        const { placement, floating, xOffset, yOffset } = expandLegendPosition(opts.position);

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
                    shrinkRect.shrink(width + spacing, 'left');
                    break;
                case 'right':
                case 'right-top':
                case 'right-bottom':
                    shrinkRect.shrink(width + spacing, 'right');
                    break;
                case 'top':
                case 'top-left':
                case 'top-right':
                    shrinkRect.shrink(height + spacing, 'top');
                    break;
                case 'bottom':
                case 'bottom-left':
                case 'bottom-right':
                    shrinkRect.shrink(height + spacing, 'bottom');
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
        const opts = this.opts;
        const { enabled: borderEnabled, strokeOpacity, strokeWidth } = opts.border;
        // Colour refs are resolved during theme-merge, so the value is a concrete colour by render.
        const stroke = opts.border.stroke as CssColor | undefined;
        const cornerRadius = opts.cornerRadius;
        const fill = opts.fill as string | undefined;
        const fillOpacity = opts.fillOpacity;
        const padding = opts.padding;
        const isPaddingNumber = typeof padding === 'number';

        return {
            cornerRadius,
            fill,
            fillOpacity,
            padding: {
                top: isPaddingNumber ? padding : (padding.top ?? 0),
                right: isPaddingNumber ? padding : (padding.right ?? 0),
                bottom: isPaddingNumber ? padding : (padding.bottom ?? 0),
                left: isPaddingNumber ? padding : (padding.left ?? 0),
            },
            stroke,
            strokeOpacity,
            strokeWidth: borderEnabled ? strokeWidth : 0,
        };
    }
}
