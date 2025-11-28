import { type AgCandlestickSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type InternalAgGradientColor, isGradientFill, isImageFill, isPatternFill } from 'ag-charts-core';

import { type OhlcNodeDatum, OhlcSeriesBase } from '../ohlc/ohlcSeriesBase';
import { CandlestickNode } from './candlestickNode';
import { CandlestickSeriesProperties } from './candlestickSeriesProperties';

export class CandlestickSeries extends OhlcSeriesBase<
    CandlestickNode,
    AgCandlestickSeriesOptions,
    CandlestickSeriesProperties<AgCandlestickSeriesOptions>
> {
    static readonly className = 'CandleStickSeries';
    static readonly type = 'candlestick' as const;

    override properties = new CandlestickSeriesProperties<AgCandlestickSeriesOptions>();

    protected override nodeFactory() {
        const node = new CandlestickNode();
        node.lineCap = 'butt';
        return node;
    }

    protected override updateDatumStyles({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<CandlestickNode, OhlcNodeDatum>;
        isHighlight: boolean;
    }) {
        datumSelection.each((_, datum) => {
            datum.style = this.getItemStyle(datum.datumIndex, isHighlight, undefined, datum.itemType);
        });
    }

    protected override updateDatumNodes({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<CandlestickNode, OhlcNodeDatum>;
        isHighlight: boolean;
    }) {
        const { contextNodeData, properties } = this;
        if (!contextNodeData) {
            return;
        }
        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();
        const { up, down } = properties.item;

        datumSelection.each((node, datum) => {
            const { centerX, width, y, height, yOpen, yClose, crisp } = datum;
            const baseStyle = datum.isRising ? up : down;
            const style =
                datum.style ??
                contextNodeData.styles[datum.itemType][
                    this.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex)
                ];

            node.setStaticProperties(centerX, width, y, height, yOpen, yClose, crisp);

            node.setStyleProperties(style, this.getShapeFillBBox());

            const styleWick = style?.wick;
            node.setWickProperties(
                styleWick?.stroke,
                styleWick?.strokeWidth,
                styleWick?.strokeOpacity,
                styleWick?.lineDash,
                styleWick?.lineDashOffset
            );

            node.wickStrokeAlignment = baseStyle.wick.strokeWidth ?? baseStyle.strokeWidth;
        });
    }

    private legendItemSymbol(): _ModuleSupport.LegendSymbolOptions {
        const { up, down } = this.properties.item;

        const upColorStops = isGradientFill(up.fill)
            ? up.fill.colorStops!.map((c) =>
                  typeof c === 'string' ? c : { color: c.color, stop: c.stop == null ? undefined : c.stop * 0.5 }
              )
            : [
                  { color: isPatternFill(up.fill) || isImageFill(up.fill) ? up.stroke : up.fill, stop: 0 },
                  { color: isPatternFill(up.fill) || isImageFill(up.fill) ? up.stroke : up.fill, stop: 0.5 },
              ];

        const downColorStops = isGradientFill(down.fill)
            ? down.fill.colorStops!.map((c) =>
                  typeof c === 'string' ? c : { color: c.color, stop: c.stop == null ? undefined : c.stop * 0.5 }
              )
            : [{ color: isPatternFill(down.fill) || isImageFill(down.fill) ? down.stroke : down.fill, stop: 0.5 }];

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

        if (!data?.data.length || !xKey || legendType !== 'category') {
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

    protected override hasItemStylers(): boolean {
        return this.properties.itemStyler != null;
    }
}
