import { type AgOhlcSeriesItemOptions, _ModuleSupport, _Scene } from 'ag-charts-community';

import { computeCandleFocusBounds, resetCandlestickSelectionsFn } from '../candlestick/candlestickUtil';
import { OhlcGroup } from './ohlcGroup';
import { OhlcSeriesBase } from './ohlcSeriesBase';
import { OhlcSeriesProperties } from './ohlcSeriesProperties';
import type { OhlcNodeDatum } from './ohlcTypes';

const { mergeDefaults } = _ModuleSupport;

export class OhlcSeries extends OhlcSeriesBase<
    OhlcGroup,
    AgOhlcSeriesItemOptions,
    OhlcSeriesProperties,
    OhlcNodeDatum
> {
    static readonly className = 'ohlc';
    static readonly type = 'ohlc' as const;

    override properties = new OhlcSeriesProperties();

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx, resetCandlestickSelectionsFn);
    }

    async createNodeData() {
        const baseNodeData = this.createBaseNodeData();

        if (!baseNodeData) {
            return;
        }

        const nodeData = baseNodeData.nodeData.map((datum) => {
            const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = this.getItemConfig(datum.itemId);
            return {
                ...datum,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
            };
        });

        return { ...baseNodeData, nodeData };
    }

    getFormattedStyles(nodeDatum: OhlcNodeDatum, highlighted = false) {
        const {
            id: seriesId,
            ctx: { callbackCache },
        } = this;
        const { xKey, openKey, closeKey, highKey, lowKey, itemStyler } = this.properties;
        const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = this.getItemConfig(nodeDatum.itemId);

        if (itemStyler) {
            const formatStyles = callbackCache.call(itemStyler, {
                datum: nodeDatum.datum,
                itemId: nodeDatum.itemId,
                seriesId,
                highlighted,
                xKey,
                openKey,
                closeKey,
                highKey,
                lowKey,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
            });
            if (formatStyles) {
                return mergeDefaults(formatStyles, this.getSeriesStyles(nodeDatum));
            }
        }
        return this.getSeriesStyles(nodeDatum);
    }

    protected override nodeFactory() {
        return new OhlcGroup();
    }

    protected override getSeriesStyles(nodeDatum: OhlcNodeDatum): AgOhlcSeriesItemOptions {
        const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = nodeDatum;

        return {
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
        };
    }

    protected override getActiveStyles(nodeDatum: OhlcNodeDatum, highlighted: boolean) {
        const activeStyles = this.getFormattedStyles(nodeDatum, highlighted);

        return highlighted ? mergeDefaults(this.properties.highlightStyle.item, activeStyles) : activeStyles;
    }

    protected computeFocusBounds(opts: _ModuleSupport.PickFocusInputs): _Scene.BBox | undefined {
        return computeCandleFocusBounds(this, opts);
    }
}
