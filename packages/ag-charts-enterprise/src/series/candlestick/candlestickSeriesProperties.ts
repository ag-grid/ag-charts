import type {
    AgCandlestickSeriesFormatterParams,
    AgCandlestickSeriesOptions,
    AgCandlestickSeriesStyles,
    AgCandlestickSeriesTooltipRendererParams,
} from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';

const {
    BaseProperties,
    AbstractBarSeriesProperties,
    SeriesTooltip,
    Validate,
    COLOR_STRING,
    FUNCTION,
    LINE_DASH,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
} = _ModuleSupport;

class CandlestickSeriesWick extends BaseProperties {
    @Validate(COLOR_STRING, { optional: true })
    stroke?: string;

    @Validate(POSITIVE_NUMBER)
    strokeWidth?: number;

    @Validate(RATIO)
    strokeOpacity?: number;

    @Validate(LINE_DASH, { optional: true })
    lineDash?: number[];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset?: number;
}

export class CandlestickSeriesItem extends BaseProperties {
    @Validate(COLOR_STRING, { optional: true })
    fill: string = '#c16068';

    @Validate(RATIO)
    fillOpacity = 1;

    @Validate(COLOR_STRING)
    stroke: string = '#333';

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @Validate(RATIO)
    strokeOpacity = 1;

    @Validate(LINE_DASH)
    lineDash: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @Validate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    @Validate(FUNCTION, { optional: true })
    formatter?: (params: AgCandlestickSeriesFormatterParams<any>) => AgCandlestickSeriesStyles;

    @Validate(OBJECT)
    readonly wick = new CandlestickSeriesWick();
}

class CandlestickSeriesItems extends BaseProperties {
    @Validate(OBJECT)
    readonly up = new CandlestickSeriesItem();

    @Validate(OBJECT)
    readonly down = new CandlestickSeriesItem();
}

export class CandlestickSeriesProperties extends AbstractBarSeriesProperties<AgCandlestickSeriesOptions> {
    @Validate(STRING)
    xKey!: string;

    @Validate(STRING)
    openKey!: string;

    @Validate(STRING)
    closeKey!: string;

    @Validate(STRING)
    highKey!: string;

    @Validate(STRING)
    lowKey!: string;

    @Validate(STRING, { optional: true })
    xName?: string;

    @Validate(STRING, { optional: true })
    yName?: string;

    @Validate(STRING, { optional: true })
    openName?: string;

    @Validate(STRING, { optional: true })
    closeName?: string;

    @Validate(STRING, { optional: true })
    highName?: string;

    @Validate(STRING, { optional: true })
    lowName?: string;

    @Validate(FUNCTION, { optional: true })
    formatter?: (params: AgCandlestickSeriesFormatterParams<unknown>) => AgCandlestickSeriesStyles;

    @Validate(OBJECT)
    readonly item = new CandlestickSeriesItems();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgCandlestickSeriesTooltipRendererParams>();
}
