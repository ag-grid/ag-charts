import type { AgBulletSeriesOptions, AgBulletSeriesTooltipRendererParams, CssColor } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

const {
    AbstractBarSeriesProperties,
    BaseProperties,
    PropertiesArray,
    SeriesTooltip,
    Validate,
    ARRAY,
    COLOR_STRING,
    LINE_DASH,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
} = _ModuleSupport;

class TargetStyle extends BaseProperties {
    @Validate(COLOR_STRING)
    fill: string = 'black';

    @Validate(RATIO)
    fillOpacity = 1;

    @Validate(COLOR_STRING)
    stroke: string = 'black';

    @Validate(POSITIVE_NUMBER)
    strokeWidth = 1;

    @Validate(RATIO)
    strokeOpacity = 1;

    @Validate(LINE_DASH)
    lineDash: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @Validate(RATIO)
    lengthRatio: number = 0.75;
}

class BulletScale extends BaseProperties {
    @Validate(POSITIVE_NUMBER, { optional: true })
    max?: number;
}

export class BulletColorRange extends BaseProperties {
    @Validate(COLOR_STRING)
    color: string = 'lightgrey';

    @Validate(POSITIVE_NUMBER, { optional: true })
    stop?: number;
}

export class BulletSeriesProperties extends AbstractBarSeriesProperties<AgBulletSeriesOptions> {
    @Validate(STRING)
    valueKey!: string;

    @Validate(STRING, { optional: true })
    valueName?: string;

    @Validate(STRING, { optional: true })
    targetKey?: string;

    @Validate(STRING, { optional: true })
    targetName?: string;

    @Validate(COLOR_STRING)
    fill: string = 'black';

    @Validate(RATIO)
    fillOpacity = 1;

    @Validate(COLOR_STRING)
    stroke: string = 'black';

    @Validate(POSITIVE_NUMBER)
    strokeWidth = 1;

    @Validate(RATIO)
    strokeOpacity = 1;

    @Validate(LINE_DASH)
    lineDash: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @Validate(RATIO)
    widthRatio: number = 0.5;

    @Validate(ARRAY.restrict({ minLength: 0 }))
    colorRanges: BulletColorRange[] = new PropertiesArray(BulletColorRange);

    @Validate(OBJECT)
    readonly target = new TargetStyle();

    @Validate(OBJECT)
    readonly scale = new BulletScale();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgBulletSeriesTooltipRendererParams>();

    @Validate(COLOR_STRING) // Internal: Set by paletteFactory.
    backgroundFill: CssColor = 'white';
}
