import { type AgCandlestickSeriesItemOptions, _ModuleSupport } from 'ag-charts-community';

import { type OhlcNodeDatum, OhlcSeriesBase } from '../ohlc/ohlcSeriesBase';
import { CandlestickNode } from './candlestickNode';
import { CandlestickSeriesProperties } from './candlestickSeriesProperties';

const { sanitizeHtml, createDatumId } = _ModuleSupport;

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

            let format: AgCandlestickSeriesItemOptions | undefined;
            if (itemStyler != null) {
                const { fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = isRising
                    ? up
                    : down;
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

            node.fill = highlightStyle?.fill ?? format?.fill ?? (isRising ? upFill : downFill);
            node.fillOpacity =
                highlightStyle?.fillOpacity ?? format?.fillOpacity ?? (isRising ? upFillOpacity : downFillOpacity);
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

            const formatWick = format?.wick;
            node.wickStroke =
                highlightStyle?.stroke ?? formatWick?.stroke ?? (isRising ? upWickStroke : downWickStroke);
            node.wickStrokeWidth =
                highlightStyle?.strokeWidth ??
                formatWick?.strokeWidth ??
                (isRising ? upWickStrokeWidth : downWickStrokeWidth);
            node.wickStrokeOpacity =
                highlightStyle?.strokeOpacity ??
                formatWick?.strokeOpacity ??
                (isRising ? upWickStrokeOpacity : downWickStrokeOpacity);
            node.wickLineDash =
                highlightStyle?.lineDash ?? formatWick?.lineDash ?? (isRising ? upWickLineDash : downWickLineDash);
            node.wickLineDashOffset =
                highlightStyle?.lineDashOffset ??
                formatWick?.lineDashOffset ??
                (isRising ? upWickLineDashOffset : downWickLineDashOffset);

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
        let format: AgCandlestickSeriesItemOptions | undefined;
        if (itemStyler != null) {
            const { fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = item;
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
                    fill,
                    fillOpacity,
                    strokeOpacity,
                    stroke,
                    strokeWidth,
                    lineDash,
                    lineDashOffset,
                    highlighted: false,
                })
            );
        }

        const fill = format?.fill ?? item.fill;
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
                fill,
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
                            fill: up.fill,
                            fillOpacity: up.fillOpacity,
                            stroke: up.stroke,
                            strokeWidth: up.strokeWidth ?? 1,
                            strokeOpacity: up.strokeOpacity ?? 1,
                            padding: 0,
                        },
                    },
                    {
                        marker: {
                            fill: down.fill,
                            fillOpacity: down.fillOpacity,
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
