import { type AgCandlestickSeriesItemOptions, _ModuleSupport } from 'ag-charts-community';
import type { InternalAgGradientColor } from 'ag-charts-core';

import { type OhlcNodeDatum, OhlcSeriesBase } from '../ohlc/ohlcSeriesBase';
import { CandlestickNode } from './candlestickNode';
import { CandlestickSeriesProperties } from './candlestickSeriesProperties';

const { createDatumId, isGradientFill, isPatternFill, isImageFill, getShapeFill, applyShapeStyle, getShapeStyle } =
    _ModuleSupport;

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
        const upStyle = getShapeStyle(
            {
                fill: up.fill,
                fillOpacity: up.fillOpacity,
                stroke: up.stroke,
                strokeWidth: up.strokeWidth,
                strokeOpacity: up.strokeOpacity,
                lineDash: up.lineDash,
                lineDashOffset: up.lineDashOffset,
            },
            up.fillGradientDefaults,
            up.fillPatternDefaults,
            up.fillImageDefaults
        );
        const downStyle = getShapeStyle(
            {
                fill: down.fill,
                fillOpacity: down.fillOpacity,
                stroke: down.stroke,
                strokeWidth: down.strokeWidth,
                strokeOpacity: down.strokeOpacity,
                lineDash: down.lineDash,
                lineDashOffset: down.lineDashOffset,
            },
            down.fillGradientDefaults,
            down.fillPatternDefaults,
            down.fillImageDefaults
        );

        datumSelection.each((node, datum) => {
            const { isRising, centerX, width, y, height, yOpen, yClose, crisp } = datum;

            let style: AgCandlestickSeriesItemOptions | undefined;
            if (itemStyler != null) {
                const { fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = isRising
                    ? upStyle
                    : downStyle;
                style = getShapeStyle(
                    this.cachedDatumCallback(
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
                    ),
                    isRising ? up.fillGradientDefaults : down.fillGradientDefaults,
                    isRising ? up.fillPatternDefaults : down.fillPatternDefaults,
                    isRising ? up.fillImageDefaults : down.fillImageDefaults
                );
            }

            node.centerX = centerX;
            node.width = width;
            node.y = y;
            node.height = height;
            node.yOpen = yOpen;
            node.yClose = yClose;
            node.crisp = crisp;

            const risingStyle = isRising ? upStyle : downStyle;
            const risingWickStyle = isRising ? up.wick : down.wick;

            const highlightStyle = this.getHighlightStyle(isHighlight, datum.datumIndex);

            applyShapeStyle(
                node,
                {
                    fill: highlightStyle?.fill ?? style?.fill ?? risingStyle.fill,
                    fillOpacity: highlightStyle?.fillOpacity ?? style?.fillOpacity ?? risingStyle.fillOpacity,
                    stroke: highlightStyle?.stroke ?? style?.stroke ?? risingStyle.stroke,
                    strokeWidth: highlightStyle?.strokeWidth ?? style?.strokeWidth ?? risingStyle.strokeWidth,
                    strokeOpacity: highlightStyle?.strokeOpacity ?? style?.strokeOpacity ?? risingStyle.strokeOpacity,
                    lineDash: highlightStyle?.lineDash ?? style?.lineDash ?? risingStyle.lineDash,
                    lineDashOffset:
                        highlightStyle?.lineDashOffset ?? style?.lineDashOffset ?? risingStyle.lineDashOffset,
                    opacity: highlightStyle.opacity ?? 1,
                },
                undefined,
                this.getShapeFillBBox()
            );

            const styleWick = style?.wick;
            node.wickStroke = highlightStyle?.stroke ?? styleWick?.stroke ?? risingWickStyle.stroke;
            node.wickStrokeWidth = highlightStyle?.strokeWidth ?? styleWick?.strokeWidth ?? risingWickStyle.strokeWidth;
            node.wickStrokeOpacity =
                highlightStyle?.strokeOpacity ?? styleWick?.strokeOpacity ?? risingWickStyle.strokeOpacity;
            node.wickLineDash = highlightStyle?.lineDash ?? styleWick?.lineDash ?? risingWickStyle.lineDash;
            node.wickLineDashOffset =
                highlightStyle?.lineDashOffset ?? styleWick?.lineDashOffset ?? risingWickStyle.lineDashOffset;

            // Ignore highlight style
            node.strokeAlignment = (style?.strokeWidth ?? risingStyle.strokeWidth) / 2;
        });
    }

    private legendItemSymbol(): _ModuleSupport.LegendSymbolOptions {
        const { up, down } = this.properties.item;

        const upFill = getShapeFill(up.fill, up.fillGradientDefaults, up.fillPatternDefaults, up.fillImageDefaults);
        const upColorStops = isGradientFill(upFill)
            ? upFill.colorStops.map((c) =>
                  typeof c === 'string' ? c : { color: c.color, stop: c.stop != null ? c.stop * 0.5 : undefined }
              )
            : [
                  { color: isPatternFill(upFill) || isImageFill(upFill) ? up.stroke : upFill, stop: 0 },
                  { color: isPatternFill(upFill) || isImageFill(upFill) ? up.stroke : upFill, stop: 0.5 },
              ];

        const downFill = getShapeFill(
            down.fill,
            down.fillGradientDefaults,
            down.fillPatternDefaults,
            down.fillImageDefaults
        );
        const downColorStops = isGradientFill(downFill)
            ? downFill.colorStops.map((c) =>
                  typeof c === 'string' ? c : { color: c.color, stop: c.stop != null ? c.stop * 0.5 : undefined }
              )
            : [{ color: isPatternFill(downFill) || isImageFill(downFill) ? down.stroke : downFill, stop: 0.5 }];

        const fill: InternalAgGradientColor = {
            type: 'gradient',
            gradient: 'linear',
            rotation: 90,
            colorStops: [...upColorStops, ...downColorStops],
            reverse: false,
        };

        const stroke: InternalAgGradientColor = {
            type: 'gradient',
            gradient: 'linear',
            rotation: 90,
            colorStops: [
                { color: up.stroke, stop: 0 },
                { color: up.stroke, stop: 0.5 },
                { color: down.stroke, stop: 0.5 },
            ],
            reverse: false,
        };

        return {
            marker: {
                fill,
                fillOpacity: up.fillOpacity,
                stroke,
                strokeWidth: up.strokeWidth ?? 1,
                strokeOpacity: up.strokeOpacity ?? 1,
                lineDash: up.lineDash,
                lineDashOffset: up.lineDashOffset,
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
