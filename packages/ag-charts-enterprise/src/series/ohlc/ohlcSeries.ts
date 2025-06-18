import { type AgOhlcSeriesItemOptions, _ModuleSupport } from 'ag-charts-community';

import { OhlcNode } from './ohlcNode';
import { OhlcSeriesBase } from './ohlcSeriesBase';
import type { OhlcNodeDatum } from './ohlcSeriesBase';
import { OhlcSeriesProperties } from './ohlcSeriesProperties';

const { createDatumId, applyShapeStyle } = _ModuleSupport;

export class OhlcSeries extends OhlcSeriesBase<OhlcNode, OhlcSeriesProperties> {
    static readonly className = 'ohlc';
    static readonly type = 'ohlc' as const;

    override properties = new OhlcSeriesProperties();

    protected override nodeFactory() {
        return new OhlcNode();
    }

    protected override updateDatumNodes({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<OhlcNode, OhlcNodeDatum>;
        isHighlight: boolean;
    }) {
        const { id: seriesId, properties } = this;
        const { xKey, highKey, lowKey, openKey, closeKey, item, itemStyler } = properties;
        const { up, down } = item;
        const {
            stroke: upStroke,
            strokeWidth: upStrokeWidth,
            strokeOpacity: upStrokeOpacity,
            lineDash: upLineDash,
            lineDashOffset: upLineDashOffset,
        } = up;
        const {
            stroke: downStroke,
            strokeWidth: downStrokeWidth,
            strokeOpacity: downStrokeOpacity,
            lineDash: downLineDash,
            lineDashOffset: downLineDashOffset,
        } = down;

        datumSelection.each((node, datum) => {
            const { isRising, centerX, width, y, height, yOpen, yClose, crisp } = datum;

            let style: AgOhlcSeriesItemOptions | undefined;
            if (itemStyler != null) {
                const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = isRising ? up : down;
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

            const highlightStyle = this.getHighlightStyle(isHighlight, datum.datumIndex);

            applyShapeStyle(node, {
                stroke: highlightStyle?.stroke ?? style?.stroke ?? (isRising ? upStroke : downStroke),
                strokeWidth:
                    highlightStyle?.strokeWidth ?? style?.strokeWidth ?? (isRising ? upStrokeWidth : downStrokeWidth),
                strokeOpacity:
                    highlightStyle?.strokeOpacity ??
                    style?.strokeOpacity ??
                    (isRising ? upStrokeOpacity : downStrokeOpacity),
                lineDash: highlightStyle?.lineDash ?? style?.lineDash ?? (isRising ? upLineDash : downLineDash),
                lineDashOffset:
                    highlightStyle?.lineDashOffset ??
                    style?.lineDashOffset ??
                    (isRising ? upLineDashOffset : downLineDashOffset),
                opacity: highlightStyle?.opacity ?? 1,
            });

            // Ignore highlight style
            node.strokeAlignment = (style?.strokeWidth ?? (isRising ? upStrokeWidth : downStrokeWidth)) / 2;
        });
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        const {
            id,
            data,
            ctx: { legendManager },
            visible,
        } = this;
        const {
            xKey,
            yName,
            item: { up, down },
            showInLegend,
            legendItemName,
        } = this.properties;

        if (!data?.length || !xKey || legendType !== 'category') {
            return [];
        }

        const fill: _ModuleSupport.ShapeColor = {
            type: 'gradient',
            gradient: 'linear',
            colorSpace: 'rgb',
            colorStops: [
                { color: up.stroke, stop: 0 },
                { color: up.stroke, stop: 0.5 },
                { color: down.stroke, stop: 0.5 },
            ],
            rotation: 90,
        };

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
                symbol: {
                    marker: {
                        fill: fill,
                        fillOpacity: up.strokeOpacity,
                        stroke: undefined,
                        strokeWidth: 0,
                        strokeOpacity: 1,
                        lineDash: [0],
                        lineDashOffset: 0,
                    },
                },
                legendItemName,
                hideInLegend: !showInLegend,
            },
        ];
    }
}
