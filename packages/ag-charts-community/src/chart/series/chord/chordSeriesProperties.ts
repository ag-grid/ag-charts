import type {
    AgChordSeriesOptions,
    AgChordSeriesTooltipRendererParams,
} from '../../../options/series/flow-proportion/chordOptions';
import { BaseProperties } from '../../../util/properties';
import {
    ARRAY,
    COLOR_STRING,
    COLOR_STRING_ARRAY,
    LINE_DASH,
    NUMBER,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    Validate,
} from '../../../util/validation';
import { DEFAULT_FILLS, DEFAULT_STROKES } from '../../themes/defaultColors';
import { SeriesProperties } from '../seriesProperties';
import { SeriesTooltip } from '../seriesTooltip';

export class ChordSeriesLinkNodeProperties extends BaseProperties<AgChordSeriesOptions> {
    @Validate(COLOR_STRING)
    fill: string | undefined = undefined;

    @Validate(RATIO)
    fillOpacity = 1;

    @Validate(COLOR_STRING)
    stroke: string | undefined = undefined;

    @Validate(RATIO)
    strokeOpacity = 1;

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @Validate(LINE_DASH)
    lineDash: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;
}

export class ChordSeriesProperties extends SeriesProperties<AgChordSeriesOptions> {
    @Validate(STRING)
    fromIdKey: string = '';

    @Validate(STRING, { optional: true })
    fromIdName: string | undefined = undefined;

    @Validate(STRING)
    toIdKey: string = '';

    @Validate(STRING, { optional: true })
    toIdName: string | undefined = undefined;

    @Validate(STRING)
    nodeIdKey: string = '';

    @Validate(STRING, { optional: true })
    nodeIdName: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    labelKey: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    labelName: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    sizeKey: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    sizeName: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    nodeSizeKey: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    nodeSizeName: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    positionKey: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    positionName: string | undefined = undefined;

    @Validate(ARRAY, { optional: true })
    nodes: any[] | undefined = undefined;

    @Validate(NUMBER)
    nodeWidth: number = 10;

    @Validate(COLOR_STRING_ARRAY)
    fills: string[] = Object.values(DEFAULT_FILLS);

    @Validate(COLOR_STRING_ARRAY)
    strokes: string[] = Object.values(DEFAULT_STROKES);

    @Validate(OBJECT)
    readonly link = new ChordSeriesLinkNodeProperties();

    @Validate(OBJECT)
    readonly node = new ChordSeriesLinkNodeProperties();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgChordSeriesTooltipRendererParams>();
}
