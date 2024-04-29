import {
    AgCandlestickSeriesBaseFormatterParams,
    AgOhlcSeriesFormatterParams,
    AgOhlcSeriesItemOptions,
    _ModuleSupport,
    _Scene,
} from 'ag-charts-community';

import { CandlestickSeriesBase } from '../candlestick/candlestickSeriesBase';
import { computeCandleFocusBounds, resetCandlestickSelectionsFn } from '../candlestick/candlestickUtil';
import { OhlcGroup } from './ohlcGroup';
import { OhlcSeriesProperties } from './ohlcSeriesProperties';
import type { OhlcNodeDatum } from './ohlcTypes';

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
        super(moduleCtx, resetCandlestickSelectionsFn);
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

    protected computeFocusBounds(opts: _ModuleSupport.PickFocusInputs): _Scene.BBox | undefined {
        return computeCandleFocusBounds(this, opts);
    }
}
