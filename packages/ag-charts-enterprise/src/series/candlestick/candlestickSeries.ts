import {
    AgCandlestickSeriesBaseFormatterParams,
    AgCandlestickSeriesFormatterParams,
    AgCandlestickSeriesItemOptions,
    _ModuleSupport,
    _Scene,
} from 'ag-charts-community';

import { CandlestickGroup } from './candlestickGroup';
import { CandlestickSeriesBase } from './candlestickSeriesBase';
import { CandlestickSeriesProperties } from './candlestickSeriesProperties';
import type { CandlestickNodeDatum } from './candlestickTypes';
import { computeCandleFocusBounds, resetCandlestickSelectionsFn } from './candlestickUtil';

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
        super(moduleCtx, resetCandlestickSelectionsFn);
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

    protected override computeFocusBounds(opts: _ModuleSupport.PickFocusInputs): _Scene.BBox | undefined {
        return computeCandleFocusBounds(this, opts);
    }
}
