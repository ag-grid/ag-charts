import { type AgOhlcSeriesOptions, _ModuleSupport } from 'ag-charts-community';

import { OhlcNode } from './ohlcNode';
import { OhlcSeriesBase } from './ohlcSeriesBase';
import type { OhlcNodeDatum } from './ohlcSeriesBase';
import { OhlcSeriesProperties } from './ohlcSeriesProperties';

const { applyShapeStyle } = _ModuleSupport;

export class OhlcSeries extends OhlcSeriesBase<OhlcNode, AgOhlcSeriesOptions, OhlcSeriesProperties> {
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
        const { item } = this.properties;
        const { up, down } = item;
        const { strokeWidth: upStrokeWidth } = up;
        const { strokeWidth: downStrokeWidth } = down;

        datumSelection.each((node, datum) => {
            const { isRising, centerX, width, y, height, yOpen, yClose, crisp } = datum;

            node.centerX = centerX;
            node.width = width;
            node.y = y;
            node.height = height;
            node.yOpen = yOpen;
            node.yClose = yClose;
            node.crisp = crisp;

            const style = this.getItemStyle(datum, isHighlight);
            applyShapeStyle(node, style);

            // Ignore highlight style
            node.strokeAlignment = (isRising ? upStrokeWidth : downStrokeWidth) / 2;
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

    protected override hasItemStylers(): boolean {
        return this.properties.itemStyler != null;
    }
}
