import { type AgCandlestickSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { InternalAgGradientColor } from 'ag-charts-core';

import { type OhlcNodeDatum, OhlcSeriesBase } from '../ohlc/ohlcSeriesBase';
import { CandlestickNode } from './candlestickNode';
import { CandlestickSeriesProperties } from './candlestickSeriesProperties';

const { isGradientFill, isPatternFill, isImageFill, getShapeFill, applyShapeStyle } = _ModuleSupport;

export class CandlestickSeries extends OhlcSeriesBase<
    CandlestickNode,
    AgCandlestickSeriesOptions,
    CandlestickSeriesProperties<AgCandlestickSeriesOptions>
> {
    static readonly className = 'CandleStickSeries';
    static readonly type = 'candlestick' as const;

    override properties = new CandlestickSeriesProperties<AgCandlestickSeriesOptions>();

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
        const { item } = this.properties;
        const { up, down } = item;
        const { strokeWidth: upStrokeWidth } = up;
        const { strokeWidth: downStrokeWidth } = down;

        datumSelection.each((node, datum) => {
            const { isRising, centerX, width, y, height, yOpen, yClose, crisp } = datum;

            const style = this.getItemStyle(datum, isHighlight);

            node.centerX = centerX;
            node.width = width;
            node.y = y;
            node.height = height;
            node.yOpen = yOpen;
            node.yClose = yClose;
            node.crisp = crisp;

            applyShapeStyle(node, style, this.getShapeFillBBox());

            const styleWick = style?.wick;
            node.wickStroke = styleWick?.stroke;
            node.wickStrokeWidth = styleWick?.strokeWidth;
            node.wickStrokeOpacity = styleWick?.strokeOpacity;
            node.wickLineDash = styleWick?.lineDash;
            node.wickLineDashOffset = styleWick?.lineDashOffset;

            // Ignore highlight style
            node.strokeAlignment = (isRising ? upStrokeWidth : downStrokeWidth) / 2;
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
