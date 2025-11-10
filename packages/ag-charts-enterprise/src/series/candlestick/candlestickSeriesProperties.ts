import type {
    AgCandlestickSeriesItemOptions,
    AgCandlestickSeriesItemStylerParams,
    AgCandlestickSeriesTooltipRendererParams,
    AgOhlcSeriesBaseOptions,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import { Property, BaseProperties} from 'ag-charts-core';
import type { InternalAgColorType } from 'ag-charts-core';

import { OhlcSeriesBaseProperties } from '../ohlc/ohlcSeriesProperties';

const { makeSeriesTooltip } = _ModuleSupport;
class CandlestickSeriesWick extends BaseProperties {
    @Property
    stroke?: string;

    @Property
    strokeWidth?: number;

    @Property
    strokeOpacity?: number;

    @Property
    lineDash?: number[];

    @Property
    lineDashOffset?: number;
}

class CandlestickSeriesItem extends BaseProperties {
    @Property
    fill: InternalAgColorType = '#c16068';

    @Property
    fillOpacity = 1;

    @Property
    stroke: string = '#333';

    @Property
    strokeWidth: number = 1;

    @Property
    strokeOpacity = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    @Property
    cornerRadius: number = 0;

    @Property
    readonly wick = new CandlestickSeriesWick();
}

class CandlestickSeriesItems extends BaseProperties {
    @Property
    readonly up = new CandlestickSeriesItem();

    @Property
    readonly down = new CandlestickSeriesItem();
}

export class CandlestickSeriesProperties<T extends AgOhlcSeriesBaseOptions> extends OhlcSeriesBaseProperties<T> {
    @Property
    readonly item = new CandlestickSeriesItems();

    @Property
    override readonly tooltip = makeSeriesTooltip<AgCandlestickSeriesTooltipRendererParams<any>>();

    @Property
    itemStyler?: Styler<AgCandlestickSeriesItemStylerParams<unknown>, AgCandlestickSeriesItemOptions>;

    getStyle(itemId: 'up' | 'down'): Required<AgCandlestickSeriesItemOptions> & { opacity: number } {
        const { fill, fillOpacity, strokeWidth, strokeOpacity, stroke, lineDash, lineDashOffset, cornerRadius, wick } =
            this.item[itemId];
        return {
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            cornerRadius,
            opacity: 1,
            wick,
        };
    }
}
