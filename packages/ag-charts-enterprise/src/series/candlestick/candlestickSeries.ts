import { type AgCandlestickSeriesItemOptions, type AgGradientFill, _ModuleSupport } from 'ag-charts-community';

import { type OhlcNodeDatum, OhlcSeriesBase } from '../ohlc/ohlcSeriesBase';
import { CandlestickNode } from './candlestickNode';
import { CandlestickSeriesProperties } from './candlestickSeriesProperties';

const { createDatumId, isGradientFill, BBox } = _ModuleSupport;

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
            defaultColorRange: upDefaultColorRange,
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
            defaultColorRange: downDefaultColorRange,
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

            let style: AgCandlestickSeriesItemOptions | undefined;
            if (itemStyler != null) {
                const { fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = isRising
                    ? up
                    : down;
                style = this.cachedDatumCallback(
                    createDatumId(this.getDatumId(datum), isHighlight ? 'highlight' : 'node'),
                    () =>
                        this.callWithContext(itemStyler, {
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

            const upFillBBox = this.getFillBBox(upFill, node);
            const downFillBBox = this.getFillBBox(downFill, node);

            node.fillBBox = isRising ? upFillBBox : downFillBBox;
            node.defaultColorRange = isRising ? upDefaultColorRange : downDefaultColorRange;
            node.fill = highlightStyle?.fill ?? style?.fill ?? (isRising ? upFill : downFill);
            node.fillOpacity =
                highlightStyle?.fillOpacity ?? style?.fillOpacity ?? (isRising ? upFillOpacity : downFillOpacity);
            node.stroke = highlightStyle?.stroke ?? style?.stroke ?? (isRising ? upStroke : downStroke);
            node.strokeWidth =
                highlightStyle?.strokeWidth ?? style?.strokeWidth ?? (isRising ? upStrokeWidth : downStrokeWidth);
            node.strokeOpacity =
                highlightStyle?.strokeOpacity ??
                style?.strokeOpacity ??
                (isRising ? upStrokeOpacity : downStrokeOpacity);
            node.lineDash = highlightStyle?.lineDash ?? style?.lineDash ?? (isRising ? upLineDash : downLineDash);
            node.lineDashOffset =
                highlightStyle?.lineDashOffset ??
                style?.lineDashOffset ??
                (isRising ? upLineDashOffset : downLineDashOffset);

            const styleWick = style?.wick;
            node.wickStroke = highlightStyle?.stroke ?? styleWick?.stroke ?? (isRising ? upWickStroke : downWickStroke);
            node.wickStrokeWidth =
                highlightStyle?.strokeWidth ??
                styleWick?.strokeWidth ??
                (isRising ? upWickStrokeWidth : downWickStrokeWidth);
            node.wickStrokeOpacity =
                highlightStyle?.strokeOpacity ??
                styleWick?.strokeOpacity ??
                (isRising ? upWickStrokeOpacity : downWickStrokeOpacity);
            node.wickLineDash =
                highlightStyle?.lineDash ?? styleWick?.lineDash ?? (isRising ? upWickLineDash : downWickLineDash);
            node.wickLineDashOffset =
                highlightStyle?.lineDashOffset ??
                styleWick?.lineDashOffset ??
                (isRising ? upWickLineDashOffset : downWickLineDashOffset);

            // Ignore highlight style
            node.strokeAlignment = (style?.strokeWidth ?? (isRising ? upStrokeWidth : downStrokeWidth)) / 2;
        });
    }

    protected override getFillBBox(fill?: AgGradientFill | string | undefined, candlestickNode?: CandlestickNode) {
        if (!isGradientFill(fill) || !candlestickNode) {
            return;
        }

        const { bounds = 'item' } = fill;

        if (bounds !== 'item') {
            return super.getFillBBox(fill);
        }

        const { width, centerX, yOpen, yClose } = candlestickNode;

        const boxTop = Math.min(yOpen, yClose);
        const boxBottom = Math.max(yOpen, yClose);
        const rectHeight = boxBottom - boxTop;

        const x0 = centerX - width / 2;
        let x1 = centerX + width / 2;

        return new BBox(x0, boxTop, x1 - x0, rectHeight);
    }

    private legendItemSymbol(): _ModuleSupport.LegendSymbolOptions {
        const { up, down } = this.properties.item;

        const upFill = isGradientFill(up.fill) ? up.stroke : up.fill;
        const downFill = isGradientFill(down.fill) ? down.stroke : down.fill;

        const fill = new _ModuleSupport.LinearGradient(
            'rgb',
            [
                { color: upFill, offset: 0 },
                { color: upFill, offset: 0.5 },
                { color: downFill, offset: 0.5 },
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
                lineDash: up.lineDash,
                lineDashOffset: up.lineDashOffset,
                defaultColorRange: up.defaultColorRange,
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
