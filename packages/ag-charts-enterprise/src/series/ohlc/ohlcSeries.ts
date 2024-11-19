import { type AgOhlcSeriesItemOptions, _ModuleSupport } from 'ag-charts-community';

import { OhlcNode } from './ohlcNode';
import { OhlcSeriesBase } from './ohlcSeriesBase';
import type { OhlcNodeDatum } from './ohlcSeriesBase';
import { OhlcSeriesProperties } from './ohlcSeriesProperties';

const { sanitizeHtml, createDatumId } = _ModuleSupport;

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

    getTooltipHtml(nodeDatum: OhlcNodeDatum): _ModuleSupport.TooltipContent {
        const { id: seriesId, properties } = this;
        const {
            xKey,
            openKey,
            closeKey,
            highKey,
            lowKey,
            xName,
            yName,
            openName,
            closeName,
            highName,
            lowName,
            tooltip,
            item: { up, down },
            itemStyler,
        } = properties;
        const { datum, itemId, isRising } = nodeDatum;

        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!xAxis || !yAxis || !this.properties.isValid()) return _ModuleSupport.EMPTY_TOOLTIP_CONTENT;

        const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.substring(1);

        const title = sanitizeHtml(yName);
        const contentData: [string, string | undefined, _ModuleSupport.ChartAxis][] = [
            [xKey, xName, xAxis],
            [openKey, openName, yAxis],
            [highKey, highName, yAxis],
            [lowKey, lowName, yAxis],
            [closeKey, closeName, yAxis],
        ];

        const content = contentData
            .map(([key, name, axis]) => sanitizeHtml(`${name ?? capitalise(key)}: ${axis.formatDatum(datum[key])}`))
            .join('<br/>');

        const item = isRising ? up : down;
        let format: AgOhlcSeriesItemOptions | undefined;
        if (itemStyler != null) {
            const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = item;
            format = this.cachedDatumCallback(createDatumId(this.getDatumId(datum), 'tooltip'), () =>
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
                    highlighted: false,
                })
            );
        }

        const stroke = format?.stroke ?? item.stroke;

        return tooltip.toTooltipHtml(
            { title, content, backgroundColor: stroke },
            {
                seriesId: this.id,
                itemId,
                highlighted: false,
                datum,
                xKey,
                openKey,
                closeKey,
                highKey,
                lowKey,
                xName,
                yName,
                openName,
                closeName,
                highName,
                lowName,
                stroke,
            }
        );
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        const { id, data } = this;
        const {
            xKey,
            yName,
            item: { up, down },
            showInLegend,
            legendItemName,
            visible,
        } = this.properties;

        if (!data?.length || !xKey || legendType !== 'category') {
            return [];
        }

        return [
            {
                legendType: 'category',
                id,
                itemId: id,
                seriesId: id,
                enabled: visible,
                label: {
                    text: legendItemName ?? yName ?? id,
                },
                symbols: [
                    {
                        marker: {
                            fill: undefined,
                            fillOpacity: 1,
                            stroke: up.stroke,
                            strokeWidth: up.strokeWidth ?? 1,
                            strokeOpacity: up.strokeOpacity ?? 1,
                            padding: 0,
                        },
                    },
                    {
                        marker: {
                            fill: undefined,
                            fillOpacity: 1,
                            stroke: down.stroke,
                            strokeWidth: down.strokeWidth ?? 1,
                            strokeOpacity: down.strokeOpacity ?? 1,
                        },
                    },
                ],
                legendItemName,
                hideInLegend: !showInLegend,
            },
        ];
    }
}
