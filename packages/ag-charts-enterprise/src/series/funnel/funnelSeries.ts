import {
    type AgFunnelSeriesLabelPlacement,
    type AgFunnelSeriesOptions,
    type AgFunnelSeriesStyle,
    _ModuleSupport,
} from 'ag-charts-community';
import type { DynamicContext, RequireOptional } from 'ag-charts-core';
import { ChartAxisDirection, mergeDefaults } from 'ag-charts-core';

import {
    BaseFunnelSeries,
    type BaseFunnelSeriesTypes,
    type FunnelAnimationData,
    type FunnelNodeDatum,
} from './baseFunnelSeries';
import {
    FUNNEL_TO_BAR_PLACEMENT,
    funnelPlacementAxes,
    resolveFunnelPlacements,
    toResolvedFunnelPlacement,
} from './funnelLabelPlacement';
import { FunnelProperties } from './funnelProperties';

const {
    resetBarSelectionsFn,
    prepareBarAnimationFunctions,
    midpointStartingBarPosition,
    createDatumId,
    pickPlacementStyle,
    Rect,
    motion,
} = _ModuleSupport;

/**
 * Consolidated type interface for FunnelSeries.
 */
interface FunnelSeriesTypes extends BaseFunnelSeriesTypes {
    readonly node: _ModuleSupport.Rect<FunnelNodeDatum>;
    readonly options: AgFunnelSeriesOptions;
    readonly properties: FunnelProperties;
}

export class FunnelSeries extends BaseFunnelSeries<FunnelSeriesTypes> {
    static override readonly className = 'FunnelSeries';
    static readonly type = 'funnel' as const;

    override properties = new FunnelProperties();

    constructor(moduleCtx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super({
            moduleCtx,
            animationResetFns: {
                datum: resetBarSelectionsFn,
            },
        });
    }

    override getBandScalePadding() {
        return { inner: this.properties.spacingRatio, outer: 0 };
    }

    protected override connectorEnabled() {
        return this.properties.dropOff.enabled;
    }

    protected override connectorCornerRadius() {
        return this.properties.cornerRadius;
    }

    protected override connectorStyle(index: number): RequireOptional<AgFunnelSeriesStyle> & { opacity: number } {
        return mergeDefaults(this.properties.dropOff.getStyle(), this.properties.getStyle(index));
    }

    protected override nodeFactory(): _ModuleSupport.Rect<FunnelNodeDatum> {
        return new Rect<FunnelNodeDatum>();
    }

    protected override defaultLabelPlacement(): AgFunnelSeriesLabelPlacement {
        return 'inside-center';
    }

    protected override resolveLabelPlacements(barAlongX: boolean) {
        const reportedPlacements = resolveFunnelPlacements(
            this.properties.label.placement,
            this.defaultLabelPlacement()
        );
        return {
            placements: reportedPlacements.map((placement) => FUNNEL_TO_BAR_PLACEMENT[placement]),
            reportedPlacements,
            ...funnelPlacementAxes(barAlongX, this.getCategoryAxis()?.isReversed() === true),
        };
    }

    protected override toBarPlacement(placement: AgFunnelSeriesLabelPlacement | undefined) {
        return FUNNEL_TO_BAR_PLACEMENT[placement ?? this.defaultLabelPlacement()];
    }

    protected override labelPlacementStyle(placement: AgFunnelSeriesLabelPlacement | undefined) {
        const { label } = this.properties;
        return placement == null ? undefined : pickPlacementStyle(label, toResolvedFunnelPlacement(placement));
    }

    protected getItemStyle({ datum, datumIndex }: Pick<FunnelNodeDatum, 'datum' | 'datumIndex'>, isHighlight: boolean) {
        const { id: seriesId, properties } = this;
        const { stageKey, valueKey, itemStyler } = properties;

        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex);
        const selectionStyle = this.getSelectionStyle(datumIndex);
        const baseStyle = mergeDefaults(selectionStyle, highlightStyle, properties.getStyle(datumIndex));
        let style = baseStyle;

        if (itemStyler != null) {
            const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
            const overrides = this.cachedDatumCallback(
                createDatumId(datumIndex, isHighlight ? 'highlight' : 'node'),
                () => {
                    const highlightStateString = this.getHighlightStateString(activeHighlight, isHighlight, datumIndex);
                    return this.ctx.optionsGraphService.resolvePartial(
                        ['series', `${this.declarationOrder}`],
                        this.callWithContext(itemStyler, {
                            seriesId,
                            datum,
                            highlightState: highlightStateString,
                            stageKey,
                            valueKey,
                            ...style,
                        })
                    );
                }
            );

            if (overrides) {
                style = mergeDefaults(overrides, style);
            }
        }

        return style;
    }

    protected override updateDatumNodes({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<FunnelNodeDatum, _ModuleSupport.Rect<FunnelNodeDatum>>;
        isHighlight: boolean;
    }) {
        const { contextNodeData } = this;
        if (!contextNodeData) {
            return;
        }

        const { shadow, cornerRadius } = this.properties;

        const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection.X;
        const crispCentreDirection = this.getCategoryCrispDirection();

        const fillBBox = this.getShapeFillBBox();

        datumSelection.each((rect, datum) => {
            const style = this.getItemStyle(datum, isHighlight);
            rect.setStyleProperties(style, fillBBox);

            rect.visible = categoryAlongX ? datum.width > 0 : datum.height > 0;
            rect.crisp = datum.crisp;
            rect.crispCentreDirection = crispCentreDirection;
            rect.fillShadow = shadow;
            rect.cornerRadius = cornerRadius;
        });
    }

    protected tooltipStyle(datum: unknown, datumIndex: number) {
        return this.getItemStyle({ datum, datumIndex }, false);
    }

    override animateEmptyUpdateReady(params: FunnelAnimationData<_ModuleSupport.Rect<FunnelNodeDatum>>) {
        super.animateEmptyUpdateReady(params);

        const { datumSelection } = params;
        const isVertical = this.isVertical();
        const mode = 'normal';

        const barFns = prepareBarAnimationFunctions(midpointStartingBarPosition(isVertical, mode), 'unknown');
        motion.fromToMotion(this.id, 'datums', this.ctx.animationManager, [datumSelection], barFns);
    }

    override animateWaitingUpdateReady(data: FunnelAnimationData<_ModuleSupport.Rect<FunnelNodeDatum>>) {
        super.animateWaitingUpdateReady(data);
        const { datumSelection: datumSelections } = data;
        const { processedData } = this;
        const dataDiff = processedData?.reduced?.diff?.[this.id];

        const fns = prepareBarAnimationFunctions(midpointStartingBarPosition(this.isVertical(), 'fade'), 'added');
        motion.fromToMotion(
            this.id,
            'datums',
            this.ctx.animationManager,
            [datumSelections],
            fns,
            // eslint-disable-next-line sonarjs/deprecation
            (node) => node.unsafeDatum.xValue,
            dataDiff
        );
    }

    protected override hasItemStylers(): boolean {
        return (
            this.properties.selection.enabled ||
            this.properties.itemStyler != null ||
            this.properties.label.itemStyler != null
        );
    }
}
