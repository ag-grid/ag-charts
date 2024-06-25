import { type AgCandlestickSeriesItemOptions, _ModuleSupport, _Scene } from 'ag-charts-community';

import { OhlcSeriesBase } from '../ohlc/ohlcSeriesBase';
import { CandlestickGroup } from './candlestickGroup';
import { CandlestickSeriesProperties } from './candlestickSeriesProperties';
import type { CandlestickNodeDatum } from './candlestickTypes';
import { computeCandleFocusBounds, resetCandlestickSelectionsFn } from './candlestickUtil';

const { extractDecoratedProperties, mergeDefaults } = _ModuleSupport;
export class CandlestickSeries extends OhlcSeriesBase<
    CandlestickGroup,
    AgCandlestickSeriesItemOptions,
    CandlestickSeriesProperties<any>,
    CandlestickNodeDatum
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

    getFormattedStyles(nodeDatum: CandlestickNodeDatum, highlighted = false) {
        const {
            id: seriesId,
            ctx: { callbackCache },
        } = this;
        const { xKey, openKey, closeKey, highKey, lowKey, itemStyler } = this.properties;
        const { fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = this.getItemConfig(
            nodeDatum.itemId
        );

        if (itemStyler) {
            const formatStyles = callbackCache.call(itemStyler, {
                datum: nodeDatum.datum,
                itemId: nodeDatum.itemId,
                seriesId,
                highlighted,
                xKey,
                openKey,
                closeKey,
                highKey,
                lowKey,
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
            });
            if (formatStyles) {
                return mergeDefaults(formatStyles, this.getSeriesStyles(nodeDatum));
            }
        }
        return this.getSeriesStyles(nodeDatum);
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

    protected override computeFocusBounds(opts: _ModuleSupport.PickFocusInputs): _Scene.BBox | undefined {
        return computeCandleFocusBounds(this, opts);
    }
}
