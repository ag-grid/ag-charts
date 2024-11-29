import { type AgOhlcSeriesItemOptions, _ModuleSupport } from 'ag-charts-community';

import { OhlcNode } from './ohlcNode';
import { OhlcSeriesBase } from './ohlcSeriesBase';
import type { OhlcNodeDatum } from './ohlcSeriesBase';
import { OhlcSeriesProperties } from './ohlcSeriesProperties';

const { createDatumId } = _ModuleSupport;

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
        const highlightStyle = isHighlight ? properties.highlightStyle.item : undefined;

        datumSelection.each((node, datum) => {
            const { isRising, centerX, width, y, height, yOpen, yClose, crisp } = datum;

            let format: AgOhlcSeriesItemOptions | undefined;
            if (itemStyler != null) {
                const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = isRising ? up : down;
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

            // Ignore highlight style
            node.strokeAlignment = (format?.strokeWidth ?? (isRising ? upStrokeWidth : downStrokeWidth)) / 2;
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

        const stroke = new _ModuleSupport.LinearGradient(
            'rgb',
            [
                { color: up.stroke, offset: 0 },
                { color: up.stroke, offset: 0.5 },
                { color: down.stroke, offset: 0.5 },
            ],
            90
        );

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
                        fill: undefined,
                        fillOpacity: 1,
                        stroke,
                        strokeWidth: up.strokeWidth ?? 1,
                        strokeOpacity: up.strokeOpacity ?? 1,
                    },
                },
                legendItemName,
                hideInLegend: !showInLegend,
            },
        ];
    }
}
