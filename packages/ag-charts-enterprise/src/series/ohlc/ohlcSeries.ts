import {
    AgCandlestickSeriesBaseFormatterParams,
    AgOhlcSeriesFormatterParams,
    AgOhlcSeriesItemOptions,
    _ModuleSupport,
    _Scene,
} from 'ag-charts-community';

import { CandlestickSeriesBase } from '../candlestick/candlestickSeriesBase';
import { GroupTags, OhlcGroup } from './ohlcGroup';
import { OhlcSeriesProperties } from './ohlcSeriesProperties';
import type { OhlcNodeDatum } from './ohlcTypes';
import { prepareOhlcLineAnimationFunctions, resetOhlcSelectionsStartFn } from './ohlcUtil';

const { motion } = _Scene;
const { mergeDefaults } = _ModuleSupport;

export class OhlcSeries extends CandlestickSeriesBase<
    OhlcGroup,
    AgOhlcSeriesItemOptions,
    OhlcSeriesProperties,
    OhlcNodeDatum,
    AgOhlcSeriesFormatterParams<OhlcNodeDatum>
> {
    static readonly className = 'ohlc';
    static readonly type = 'ohlc' as const;

    override properties = new OhlcSeriesProperties();

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx);
    }

    async createNodeData() {
        const baseNodeData = this.createBaseNodeData();

        if (!baseNodeData) {
            return;
        }

        const nodeData = baseNodeData.nodeData.map((datum) => {
            const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = this.getItemConfig(datum.itemId);
            return {
                ...datum,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
            };
        });

        return { ...baseNodeData, nodeData };
    }

    protected override nodeFactory() {
        return new OhlcGroup();
    }

    protected override animateEmptyUpdateReady({
        datumSelection,
    }: _ModuleSupport.CartesianAnimationData<OhlcGroup, OhlcNodeDatum>) {
        this.resetAnimations(datumSelection);
    }

    protected override animateReadyResize({
        datumSelection,
    }: _ModuleSupport.CartesianAnimationData<OhlcGroup, OhlcNodeDatum>) {
        this.resetAnimations(datumSelection);
    }

    protected resetAnimations(datumSelection: _Scene.Selection<OhlcGroup, OhlcNodeDatum>) {
        const highLowLines = datumSelection.selectByTag<_Scene.Line>(GroupTags.Body);
        const openLines = datumSelection.selectByTag<_Scene.Line>(GroupTags.Open);
        const closeLines = datumSelection.selectByTag<_Scene.Line>(GroupTags.Close);

        motion.resetMotion([...highLowLines, ...openLines, ...closeLines], resetOhlcSelectionsStartFn());
    }

    protected override animateWaitingUpdateReady({
        datumSelection,
    }: _ModuleSupport.CartesianAnimationData<OhlcGroup, OhlcNodeDatum>) {
        const { processedData } = this;
        const difference = processedData?.reduced?.diff;
        const highLowLines = datumSelection.selectByTag<_Scene.Line>(GroupTags.Body);
        const openLines = datumSelection.selectByTag<_Scene.Line>(GroupTags.Open);
        const closeLines = datumSelection.selectByTag<_Scene.Line>(GroupTags.Close);

        const bodyAnimationFns = prepareOhlcLineAnimationFunctions();
        motion.fromToMotion(
            this.id,
            'datums',
            this.ctx.animationManager,
            highLowLines,
            bodyAnimationFns,
            (_, datum) => String(datum.xValue),
            difference
        );

        const wickAnimationFns = prepareOhlcLineAnimationFunctions();
        motion.fromToMotion(
            this.id,
            'datums',
            this.ctx.animationManager,
            [...openLines, ...closeLines],
            wickAnimationFns,
            (_, datum) => String(datum.xValue),
            difference
        );
    }

    protected override getFormatterParams(
        params: AgCandlestickSeriesBaseFormatterParams<OhlcNodeDatum>
    ): AgOhlcSeriesFormatterParams<OhlcNodeDatum> {
        return params;
    }

    protected override getSeriesStyles(nodeDatum: OhlcNodeDatum): AgOhlcSeriesItemOptions {
        const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = nodeDatum;

        return {
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
        };
    }

    protected override getActiveStyles(nodeDatum: OhlcNodeDatum, highlighted: boolean) {
        const activeStyles = this.getFormattedStyles(nodeDatum, highlighted);

        return highlighted ? mergeDefaults(this.properties.highlightStyle.item, activeStyles) : activeStyles;
    }
}
