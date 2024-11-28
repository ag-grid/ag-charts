import { type AgCandlestickSeriesItemOptions, _ModuleSupport } from 'ag-charts-community';

import { type OhlcNodeDatum, OhlcSeriesBase } from '../ohlc/ohlcSeriesBase';
import { CandlestickNode } from './candlestickNode';
import { CandlestickSeriesProperties } from './candlestickSeriesProperties';

const { createDatumId } = _ModuleSupport;

export class CandlestickSeries extends OhlcSeriesBase<CandlestickNode, CandlestickSeriesProperties<any>> {
    static readonly className = 'CandleStickSeries';
    static readonly type = 'candlestick' as const;

    override properties = new CandlestickSeriesProperties();

    protected override nodeFactory() {
        return new CandlestickNode();
    }

    protected override updateDatumNodes({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<CandlestickNode, OhlcNodeDatum>;
        isHighlight: boolean;
    }) {
        const { id: seriesId, properties } = this;
        const { xKey, highKey, lowKey, openKey, closeKey, item, itemStyler } = properties;
        const { up, down } = item;
        const {
            fill: upFill,
            fillOpacity: upFillOpacity,
            stroke: upStroke,
            strokeWidth: upStrokeWidth,
            strokeOpacity: upStrokeOpacity,
            lineDash: upLineDash,
            lineDashOffset: upLineDashOffset,
        } = up;
        const {
            stroke: upWickStroke,
            strokeWidth: upWickStrokeWidth,
            strokeOpacity: upWickStrokeOpacity,
            lineDash: upWickLineDash,
            lineDashOffset: upWickLineDashOffset,
        } = up.wick;
        const {
            fill: downFill,
            fillOpacity: downFillOpacity,
            stroke: downStroke,
            strokeWidth: downStrokeWidth,
            strokeOpacity: downStrokeOpacity,
            lineDash: downLineDash,
            lineDashOffset: downLineDashOffset,
        } = down;
        const {
            stroke: downWickStroke,
            strokeWidth: downWickStrokeWidth,
            strokeOpacity: downWickStrokeOpacity,
            lineDash: downWickLineDash,
            lineDashOffset: downWickLineDashOffset,
        } = down.wick;
        const highlightStyle = isHighlight ? properties.highlightStyle.item : undefined;

        datumSelection.each((node, datum) => {
            const { isRising, centerX, width, y, height, yOpen, yClose, crisp } = datum;

            let format: AgCandlestickSeriesItemOptions | undefined;
            if (itemStyler != null) {
                const { fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = isRising
                    ? up
                    : down;
                format = this.cachedDatumCallback(
                    createDatumId(this.getDatumId(datum), isHighlight ? 'highlight' : 'node'),
                    () =>
                        itemStyler({
                            seriesId,
                            itemId: datum.itemId,
                            xKey,
                            highKey,
                            lowKey,
                            openKey,
                            closeKey,
                            datum: datum.datum,
                            fill,
                            fillOpacity,
                            strokeOpacity,
                            stroke,
                            strokeWidth,
                            lineDash,
                            lineDashOffset,
                            highlighted: isHighlight,
                        })
                );
            }

            node.centerX = centerX;
            node.width = width;
            node.y = y;
            node.height = height;
            node.yOpen = yOpen;
            node.yClose = yClose;
            node.crisp = crisp;

            node.fill = highlightStyle?.fill ?? format?.fill ?? (isRising ? upFill : downFill);
            node.fillOpacity =
                highlightStyle?.fillOpacity ?? format?.fillOpacity ?? (isRising ? upFillOpacity : downFillOpacity);
            node.stroke = highlightStyle?.stroke ?? format?.stroke ?? (isRising ? upStroke : downStroke);
            node.strokeWidth =
                highlightStyle?.strokeWidth ?? format?.strokeWidth ?? (isRising ? upStrokeWidth : downStrokeWidth);
            node.strokeOpacity =
                highlightStyle?.strokeOpacity ??
                format?.strokeOpacity ??
                (isRising ? upStrokeOpacity : downStrokeOpacity);
            node.lineDash = highlightStyle?.lineDash ?? format?.lineDash ?? (isRising ? upLineDash : downLineDash);
            node.lineDashOffset =
                highlightStyle?.lineDashOffset ??
                format?.lineDashOffset ??
                (isRising ? upLineDashOffset : downLineDashOffset);

            const formatWick = format?.wick;
            node.wickStroke =
                highlightStyle?.stroke ?? formatWick?.stroke ?? (isRising ? upWickStroke : downWickStroke);
            node.wickStrokeWidth =
                highlightStyle?.strokeWidth ??
                formatWick?.strokeWidth ??
                (isRising ? upWickStrokeWidth : downWickStrokeWidth);
            node.wickStrokeOpacity =
                highlightStyle?.strokeOpacity ??
                formatWick?.strokeOpacity ??
                (isRising ? upWickStrokeOpacity : downWickStrokeOpacity);
            node.wickLineDash =
                highlightStyle?.lineDash ?? formatWick?.lineDash ?? (isRising ? upWickLineDash : downWickLineDash);
            node.wickLineDashOffset =
                highlightStyle?.lineDashOffset ??
                formatWick?.lineDashOffset ??
                (isRising ? upWickLineDashOffset : downWickLineDashOffset);

            // Ignore highlight style
            node.strokeAlignment = (format?.strokeWidth ?? (isRising ? upStrokeWidth : downStrokeWidth)) / 2;
        });
    }

    private legendItemSymbol(): _ModuleSupport.LegendSymbolOptions {
        const { up, down } = this.properties.item;

        const fill = new _ModuleSupport.LinearGradient(
            'rgb',
            [
                { color: up.fill, offset: 0 },
                { color: up.fill, offset: 0.5 },
                { color: down.fill, offset: 0.5 },
            ],
            90
        );

        const stroke = new _ModuleSupport.LinearGradient(
            'rgb',
            [
                { color: up.stroke, offset: 0 },
                { color: up.stroke, offset: 0.5 },
                { color: down.stroke, offset: 0.5 },
            ],
            90
        );

        return {
            marker: {
                fill,
                fillOpacity: up.fillOpacity,
                stroke: stroke,
                strokeWidth: up.strokeWidth ?? 1,
                strokeOpacity: up.strokeOpacity ?? 1,
            },
        };
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        const {
            id,
            data,
            visible,
            ctx: { legendManager },
        } = this;
        const { xKey, yName, showInLegend, legendItemName } = this.properties;

        if (!data?.length || !xKey || legendType !== 'category') {
            return [];
        }

        return [
            {
                legendType: 'category',
                id,
                itemId: id,
                seriesId: id,
                enabled: visible && legendManager.getItemEnabled({ seriesId: id, itemId: id }),
                label: {
                    text: legendItemName ?? yName ?? id,
                },
                symbol: this.legendItemSymbol(),
                legendItemName,
                hideInLegend: !showInLegend,
            },
        ];
    }
}
