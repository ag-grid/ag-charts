import { type AgOhlcSeriesOptions, _ModuleSupport } from 'ag-charts-community';

import { OhlcNode } from './ohlcNode';
import { type OhlcNodeDatum, OhlcSeriesBase } from './ohlcSeriesBase';
import { OhlcSeriesProperties } from './ohlcSeriesProperties';

export class OhlcSeries extends OhlcSeriesBase<OhlcNode, AgOhlcSeriesOptions, OhlcSeriesProperties> {
    static override readonly className = 'ohlc';
    static readonly type = 'ohlc' as const;

    override properties = new OhlcSeriesProperties();

    protected override nodeFactory() {
        const node = new OhlcNode();
        node.lineCap = 'square';
        return node;
    }

    protected override updateDatumStyles({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<OhlcNode, OhlcNodeDatum>;
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
        datumSelection: _ModuleSupport.Selection<OhlcNode, OhlcNodeDatum>;
        isHighlight: boolean;
    }) {
        const { contextNodeData, properties } = this;
        if (!contextNodeData) {
            return;
        }
        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();
        const { up, down } = properties.item;

        const series = this;
        datumSelection.each(function updateOhlcNode(node, datum) {
            const { centerX, width, y, height, yOpen, yClose, crisp } = datum;
            const baseStyle = datum.isRising ? up : down;

            node.setStaticProperties(centerX, width, y, height, yOpen, yClose, crisp);

            const style =
                datum.style ??
                contextNodeData.styles[datum.itemType][
                    series.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex)
                ];

            node.setStyleProperties(style);

            node.strokeAlignment = baseStyle.strokeWidth;
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

        if (!data?.data.length || !xKey || legendType !== 'category') {
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
