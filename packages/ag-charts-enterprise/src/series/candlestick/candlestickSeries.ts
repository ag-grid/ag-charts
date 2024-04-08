import {
    AgCandlestickSeriesBaseFormatterParams,
    AgCandlestickSeriesFormatterParams,
    AgCandlestickSeriesItemOptions,
    _ModuleSupport,
    _Scene,
} from 'ag-charts-community';

import { CandlestickGroup, GroupTags } from './candlestickGroup';
import { CandlestickSeriesBase } from './candlestickSeriesBase';
import { CandlestickSeriesProperties } from './candlestickSeriesProperties';
import type { CandlestickNodeDatum } from './candlestickTypes';
import {
    prepareCandlestickBodyAnimationFunctions,
    prepareCandlestickWickAnimationFunctions,
    resetCandlestickSelectionsStartFn,
    resetCandlestickWickSelectionsStartFn,
} from './candlestickUtil';

const { motion } = _Scene;

const { extractDecoratedProperties, mergeDefaults } = _ModuleSupport;
export class CandlestickSeries extends CandlestickSeriesBase<
    CandlestickGroup,
    AgCandlestickSeriesItemOptions,
    CandlestickSeriesProperties,
    CandlestickNodeDatum,
    AgCandlestickSeriesFormatterParams<CandlestickNodeDatum>
> {
    static readonly className = 'CandleStickSeries';
    static readonly type = 'candlestick' as const;

    override properties = new CandlestickSeriesProperties();

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx);
    }

    async createNodeData() {
        const baseNodeData = this.createBaseNodeData();

        if (!baseNodeData) {
            return;
        }

        const nodeData = baseNodeData.nodeData.map((datum) => {
            const {
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
                wick,
                cornerRadius,
            } = this.getItemConfig(datum.itemId);
            return {
                ...datum,
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
                wick,
                cornerRadius,
            };
        });

        return { ...baseNodeData, nodeData };
    }

    protected override nodeFactory() {
        return new CandlestickGroup();
    }

    protected override animateEmptyUpdateReady({
        datumSelection,
    }: _ModuleSupport.CartesianAnimationData<CandlestickGroup, CandlestickNodeDatum>) {
        this.resetAnimations(datumSelection);
    }

    protected override animateReadyResize({
        datumSelection,
    }: _ModuleSupport.CartesianAnimationData<CandlestickGroup, CandlestickNodeDatum>) {
        this.resetAnimations(datumSelection);
    }

    protected resetAnimations(datumSelection: _Scene.Selection<CandlestickGroup, CandlestickNodeDatum>) {
        const rects = datumSelection.selectByTag<_Scene.Rect>(GroupTags.Body);
        const wicks = datumSelection.selectByClass<_Scene.Line>(_Scene.Line);

        motion.resetMotion(rects, resetCandlestickSelectionsStartFn());
        motion.resetMotion(wicks, resetCandlestickWickSelectionsStartFn());
    }

    protected override animateWaitingUpdateReady({
        datumSelection,
    }: _ModuleSupport.CartesianAnimationData<CandlestickGroup, CandlestickNodeDatum>) {
        const { processedData } = this;
        const difference = processedData?.reduced?.diff;
        const rects = datumSelection.selectByTag<_Scene.Rect>(GroupTags.Body);
        const wicks = datumSelection.selectByClass<_Scene.Line>(_Scene.Line);

        const bodyAnimationFns = prepareCandlestickBodyAnimationFunctions();
        motion.fromToMotion(
            this.id,
            'datums',
            this.ctx.animationManager,
            rects,
            bodyAnimationFns,
            (_, datum) => String(datum.xValue),
            difference
        );

        const wickAnimationFns = prepareCandlestickWickAnimationFunctions();
        motion.fromToMotion(
            this.id,
            'datums',
            this.ctx.animationManager,
            wicks,
            wickAnimationFns,
            (_, datum) => String(datum.xValue),
            difference
        );
    }

    protected override getSeriesStyles(nodeDatum: CandlestickNodeDatum): AgCandlestickSeriesItemOptions {
        const { fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, wick, cornerRadius } =
            nodeDatum;

        return {
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            wick: extractDecoratedProperties(wick),
            cornerRadius,
        };
    }

    protected override getActiveStyles(nodeDatum: CandlestickNodeDatum, highlighted: boolean) {
        let activeStyles = this.getFormattedStyles(nodeDatum, highlighted);

        if (highlighted) {
            activeStyles = mergeDefaults(this.properties.highlightStyle.item, activeStyles);
        }

        const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = activeStyles;

        activeStyles.wick = mergeDefaults(activeStyles.wick, {
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
        });

        return activeStyles;
    }

    protected override getFormatterParams(
        params: AgCandlestickSeriesBaseFormatterParams<CandlestickNodeDatum>
    ): AgCandlestickSeriesFormatterParams<CandlestickNodeDatum> {
        return params;
    }
}
