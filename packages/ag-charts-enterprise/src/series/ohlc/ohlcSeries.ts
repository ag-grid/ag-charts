import { _ModuleSupport } from 'ag-charts-community';
import type { FillStrokeMorph, Normalised, NormalisedOhlcSeriesOwnOptions } from 'ag-charts-core';

import { OhlcNode } from './ohlcNode';
import { type OhlcNodeDatum, OhlcSeriesBase, type OhlcSeriesBaseTypes } from './ohlcSeriesBase';

/** Post-resolution style: colour refs are resolved to concrete colours before reaching the scene node. */
type NormalisedOhlcStyle = Normalised<NonNullable<OhlcNodeDatum['style']>, never, FillStrokeMorph>;

/**
 * Consolidated type interface for OhlcSeries.
 */
interface OhlcSeriesTypes extends OhlcSeriesBaseTypes {
    readonly node: OhlcNode<OhlcNodeDatum>;
    readonly options: NormalisedOhlcSeriesOwnOptions;
}

export class OhlcSeries extends OhlcSeriesBase<OhlcSeriesTypes> {
    static override readonly className = 'ohlc';
    static readonly type = 'ohlc' as const;

    protected override nodeFactory() {
        const node = new OhlcNode<OhlcNodeDatum>();
        node.lineCap = 'square';
        return node;
    }

    protected override updateDatumStyles({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<OhlcNodeDatum, OhlcSeriesTypes['node']>;
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
        datumSelection: _ModuleSupport.Selection<OhlcNodeDatum, OhlcSeriesTypes['node']>;
        isHighlight: boolean;
    }) {
        const { contextNodeData, options } = this;
        if (!contextNodeData) {
            return;
        }
        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();
        const { up, down } = options.item;

        const series = this;
        datumSelection.each(function updateOhlcNode(node, datum) {
            const { centerX, width, y, height, yOpen, yClose, crisp } = datum;
            const baseStyle = datum.isRising ? up : down;

            node.setStaticProperties(centerX, width, y, height, yOpen, yClose, crisp);

            const style = (datum.style ??
                contextNodeData.styles[datum.itemType][
                    series.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex)
                ]) as NormalisedOhlcStyle;

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
        } = this.options;

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
                enabled: visible && (legendManager?.getItemEnabled({ seriesId: id, itemId: id }) ?? true),
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
                hideInLegend: showInLegend === false,
            },
        ];
    }

    protected override hasItemStylers(): boolean {
        return this.isSelectionEnabled() || this.options.itemStyler != null;
    }
}
