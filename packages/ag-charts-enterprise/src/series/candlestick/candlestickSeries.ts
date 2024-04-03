import {
    AgCandlestickSeriesBaseFormatterParams,
    AgCandlestickSeriesFormatterParams,
    AgCandlestickSeriesItemOptions,
    _ModuleSupport,
} from 'ag-charts-community';

import { CandlestickGroup } from './candlestickGroup';
import { CandlestickSeriesBase } from './candlestickSeriesBase';
import { CandlestickSeriesProperties } from './candlestickSeriesProperties';
import type { CandlestickNodeDatum } from './candlestickTypes';

const { extractDecoratedProperties, mergeDefaults } = _ModuleSupport;
export class CandlestickSeries extends CandlestickSeriesBase<
    CandlestickGroup,
    AgCandlestickSeriesItemOptions,
    CandlestickSeriesProperties,
    CandlestickNodeDatum,
    AgCandlestickSeriesFormatterParams<CandlestickNodeDatum>
> {
    static readonly className = 'CandleStickSeries';
    static readonly type = 'candlestick' as const;

    override properties = new CandlestickSeriesProperties();

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            directionKeys: {
                x: ['xKey'],
                y: ['lowKey', 'highKey', 'openKey', 'closeKey'],
            },
            directionNames: {
                x: ['xName'],
                y: ['lowName', 'highName', 'openName', 'closeName'],
            },
            pathsPerSeries: 1,
        });
    }

    override async processData(dataController: _ModuleSupport.DataController): Promise<void> {
        if (!this.properties.isValid() || !this.visible) return;

        const { xKey, openKey, closeKey, highKey, lowKey } = this.properties;

        const animationEnabled = !this.ctx.animationManager.isSkipped();

        const xScale = this.getCategoryAxis()?.scale;
        const isContinuousX = ContinuousScale.is(xScale) || OrdinalTimeScale.is(xScale);
        const xValueType = ContinuousScale.is(xScale) ? 'range' : 'category';

        const extraProps = [];
        if (animationEnabled && this.processedData) {
            extraProps.push(diff(this.processedData));
        }
        if (animationEnabled) {
            extraProps.push(animationValidation());
        }

        const { processedData } = await this.requestDataModel(dataController, this.data, {
            props: [
                keyProperty(xKey, isContinuousX, { id: `xValue`, valueType: xValueType }),
                valueProperty(openKey, true, { id: `openValue` }),
                valueProperty(closeKey, true, { id: `closeValue` }),
                valueProperty(highKey, true, { id: `highValue` }),
                valueProperty(lowKey, true, { id: `lowValue` }),
                ...(isContinuousX ? [SMALLEST_KEY_INTERVAL] : []),
                ...extraProps,
            ],
        });

        this.smallestDataInterval = {
            x: processedData.reduced?.smallestKeyInterval ?? Infinity,
            y: Infinity,
        };

        this.animationState.transition('updateData');
    }

    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection) {
        const { processedData, dataModel, smallestDataInterval } = this;
        if (!(processedData && dataModel)) return [];

        if (direction === this.getBarDirection()) {
            const lowValues = dataModel.getDomain(this, `lowValue`, 'value', processedData);
            const highValues = dataModel.getDomain(this, `highValue`, 'value', processedData);
            const openValues = dataModel.getDomain(this, `openValue`, 'value', processedData);
            const closeValues = dataModel.getDomain(this, `closeValue`, 'value', processedData);

            return fixNumericExtent(
                [
                    Math.min(...lowValues, ...highValues, ...openValues, ...closeValues),
                    Math.max(...highValues, ...lowValues, ...openValues, ...closeValues),
                ],
                this.getValueAxis()
            );
        }

        const { index, def } = dataModel.resolveProcessedDataDefById(this, `xValue`);
        const keys = processedData.domain.keys[index];
        if (def.type === 'key' && def.valueType === 'category') {
            return keys;
        }

        const categoryAxis = this.getCategoryAxis();
        const isReversed = categoryAxis?.isReversed();

        const keysExtent = extent(keys) ?? [NaN, NaN];
        const scalePadding = smallestDataInterval && isFinite(smallestDataInterval.x) ? smallestDataInterval.x : 0;

        if (direction === ChartAxisDirection.Y) {
            const d0 = keysExtent[0] + (isReversed ? 0 : -scalePadding);
            const d1 = keysExtent[1] + (isReversed ? scalePadding : 0);
            return fixNumericExtent([d0, d1], categoryAxis);
        }

        const d0 = keysExtent[0] + (isReversed ? -scalePadding : 0);
        const d1 = keysExtent[1] + (isReversed ? 0 : scalePadding);
        return fixNumericExtent([d0, d1], categoryAxis);
    }

    async createNodeData() {
        const baseNodeData = this.createBaseNodeData();

        if (!baseNodeData) {
            return;
        }

        const nodeData = baseNodeData.nodeData.map((datum) => {
            const {
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
                wick,
                cornerRadius,
            } = this.getItemConfig(datum.itemId);
            return {
                ...datum,
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
                wick,
                cornerRadius,
            };
        });

        return { ...baseNodeData, nodeData };
    }

    protected override nodeFactory() {
        return new CandlestickGroup();
    }

    protected override getSeriesStyles(nodeDatum: CandlestickNodeDatum): AgCandlestickSeriesItemOptions {
        const { fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, wick, cornerRadius } =
            nodeDatum;

        return {
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            wick: extractDecoratedProperties(wick),
            cornerRadius,
        };
    }

    protected override getActiveStyles(nodeDatum: CandlestickNodeDatum, highlighted: boolean) {
        let activeStyles = this.getFormattedStyles(nodeDatum, highlighted);

        if (highlighted) {
            activeStyles = mergeDefaults(this.properties.highlightStyle.item, activeStyles);
        }

        const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = activeStyles;

        activeStyles.wick = mergeDefaults(activeStyles.wick, {
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
        });

        return activeStyles;
    }

    protected override getFormatterParams(
        params: AgCandlestickSeriesBaseFormatterParams<CandlestickNodeDatum>
    ): AgCandlestickSeriesFormatterParams<CandlestickNodeDatum> {
        return params;
    }
}
