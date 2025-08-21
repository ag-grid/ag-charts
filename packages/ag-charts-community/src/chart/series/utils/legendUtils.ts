import type { CategoryLegendDatum, ChartLegendType } from '../../legend/legendDatum';
import type { LegendSymbolOptions } from '../../legend/legendSymbol';
import type { ProcessedDataValues, SeriesLegendContext } from './interfaces';

/**
 * Interface for providing legend functionality to series
 */
export interface LegendProvider {
    /**
     * Get legend data for the series
     */
    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[];

    /**
     * Get category-specific legend data
     */
    getCategoryLegendData?(): CategoryLegendDatum[];

    /**
     * Get legend symbol for a specific datum
     */
    getLegendSymbol?(datumIndex: number): LegendSymbolOptions;
}

/**
 * Category legend provider implementation for pie/donut series
 */
export class CategoryLegendProvider implements LegendProvider {
    constructor(private readonly series: SeriesLegendContext) {}

    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] {
        const {
            visible,
            processedData,
            dataModel,
            id: seriesId,
            ctx: { legendManager },
        } = this.series;

        if (!dataModel || !processedData || legendType !== 'category') {
            return [];
        }

        const { angleKey, calloutLabelKey, sectorLabelKey, legendItemKey, showInLegend } = this.series.properties;

        if (
            !legendItemKey &&
            (!calloutLabelKey || calloutLabelKey === angleKey) &&
            (!sectorLabelKey || sectorLabelKey === angleKey)
        ) {
            return [];
        }

        const processedDataValues: ProcessedDataValues = this.series.getProcessedDataValues(dataModel, processedData);
        const { angleRawValues } = processedDataValues;

        const titleText = this.series.properties.title?.showInLegend && this.series.properties.title.text;
        const legendData: CategoryLegendDatum[] = [];

        const hideZeros = this.series.properties.hideZeroValueSectorsInLegend;
        const rawData = processedData.dataSources.get(seriesId);
        const invalidData = processedData.invalidData?.get(seriesId);

        for (let datumIndex = 0; datumIndex < processedData.input.count; datumIndex++) {
            const datum = rawData?.[datumIndex] as any;
            const angleRawValue = angleRawValues[datumIndex];

            if (invalidData?.[datumIndex] === true || (hideZeros && angleRawValue === 0)) {
                continue;
            }

            const labelParts = [];
            if (titleText) {
                labelParts.push(titleText);
            }
            const labels = this.series.getLabelContent(datumIndex, datum, processedDataValues);

            if (legendItemKey && labels.legendItem !== undefined) {
                labelParts.push(labels.legendItem);
            } else if (calloutLabelKey && calloutLabelKey !== angleKey && labels.callout !== undefined) {
                labelParts.push(labels.callout);
            } else if (sectorLabelKey && sectorLabelKey !== angleKey && labels.sector !== undefined) {
                labelParts.push(labels.sector);
            }

            if (labelParts.length === 0) continue;

            legendData.push({
                legendType: 'category',
                id: seriesId,
                datum,
                itemId: datumIndex,
                seriesId,
                hideToggleOtherSeries: true,
                enabled: visible && legendManager.getItemEnabled({ seriesId, itemId: datumIndex }),
                label: {
                    text: labelParts.join(' - '),
                },
                symbol: this.series.legendItemSymbol(datumIndex),
                legendItemName: legendItemKey != null ? datum[legendItemKey] : undefined,
                hideInLegend: !showInLegend,
            });
        }

        return legendData;
    }

    getCategoryLegendData(): CategoryLegendDatum[] {
        return this.getLegendData('category');
    }

    getLegendSymbol(datumIndex: number): LegendSymbolOptions {
        return this.series.legendItemSymbol(datumIndex);
    }
}
