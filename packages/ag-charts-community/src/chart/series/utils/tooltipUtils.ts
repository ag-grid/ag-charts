import type { LegendSymbolOptions } from '../../legend/legendSymbol';
import type { TooltipContent } from '../../tooltip/tooltip';
import type { ProcessedDataValues, SeriesTooltipContext } from './interfaces';

/**
 * Interface for providing tooltip functionality to series
 */
export interface TooltipProvider {
    /**
     * Get tooltip content for a specific datum
     */
    getTooltipContent(datumIndex: number): TooltipContent | undefined;

    /**
     * Format tooltip with context
     */
    formatTooltipWithContext?(
        tooltip: any,
        content: {
            title?: string;
            symbol?: LegendSymbolOptions;
            data: Array<{ label: string; fallbackLabel: string; value: string }>;
        },
        params: any
    ): TooltipContent | undefined;

    /**
     * Get legend item symbol for tooltip
     */
    legendItemSymbol?(datumIndex: number): LegendSymbolOptions;
}

/**
 * Polar tooltip provider implementation for pie/donut series
 */
export class PolarTooltipProvider implements TooltipProvider {
    constructor(private readonly series: SeriesTooltipContext) {}

    getTooltipContent(datumIndex: number): TooltipContent | undefined {
        const {
            id: seriesId,
            dataModel,
            processedData,
            properties,
            ctx: { formatManager },
        } = this.series;

        const {
            legendItemKey,
            calloutLabelKey,
            calloutLabelName,
            sectorLabelKey,
            sectorLabelName,
            angleKey,
            angleName,
            radiusKey,
            radiusName,
            tooltip,
        } = properties;

        const title = this.series.properties.title?.node.getPlainText();

        if (!dataModel || !processedData) return;

        const datum = processedData.dataSources.get(seriesId)?.[datumIndex];
        const processedDataValues: ProcessedDataValues = this.series.getProcessedDataValues(dataModel, processedData);
        const { angleRawValues } = processedDataValues;
        const angleRawValue = angleRawValues[datumIndex];

        const labelValues = this.series.getLabelContent(datumIndex, datum, processedDataValues);
        const label = labelValues.legendItem ?? labelValues.callout ?? labelValues.sector ?? angleName;

        const domain = dataModel.getDomain(this.series, `angleRaw`, 'value', processedData);
        let angleContent: string = String(angleRawValue);

        // Try to use formatter if available, fallback to simple formatting
        if (this.series.callWithContext && this.series.getFormatterContext) {
            const formattedValue = formatManager.format(this.series.callWithContext.bind(this.series), {
                type: 'number',
                value: angleRawValue,
                datum,
                seriesId,
                legendItemName: undefined,
                key: angleKey,
                source: 'tooltip',
                property: 'angle',
                domain,
                boundSeries: this.series.getFormatterContext('angle'),
                fractionDigits: undefined,
            });
            if (formattedValue) {
                angleContent = formattedValue;
            }
        }

        return this.series.formatTooltipWithContext(
            tooltip,
            {
                title,
                symbol: this.series.legendItemSymbol(datumIndex),
                data: [{ label, fallbackLabel: angleKey, value: angleContent }],
            },
            {
                seriesId,
                datum,
                title: angleName,
                legendItemKey,
                calloutLabelKey,
                calloutLabelName,
                sectorLabelKey,
                sectorLabelName,
                angleKey,
                angleName,
                radiusKey,
                radiusName,
                ...this.series.getItemStyle({ datum, datumIndex }, false),
            }
        );
    }
}
