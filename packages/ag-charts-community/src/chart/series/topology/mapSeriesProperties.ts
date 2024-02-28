import type { FeatureCollection } from 'geojson';

import type {
    AgBarSeriesLabelFormatterParams,
    AgMapSeriesFormatterParams,
    AgMapSeriesOptions,
    AgMapSeriesStyle,
    AgMapSeriesTooltipRendererParams,
} from '../../../options/series/topology/mapOptions';
import {
    AND,
    ARRAY,
    COLOR_STRING,
    COLOR_STRING_ARRAY,
    FUNCTION,
    OBJECT,
    PLAIN_OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    Validate,
} from '../../../util/validation';
import { Label } from '../../label';
import { SeriesProperties } from '../seriesProperties';
import { SeriesTooltip } from '../seriesTooltip';

export class MapSeriesProperties extends SeriesProperties<AgMapSeriesOptions> {
    @Validate(STRING, { optional: true })
    legendItemName?: string;

    @Validate(STRING)
    idKey: string = '';

    @Validate(STRING, { optional: true })
    idName: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    labelKey: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    colorKey?: string;

    @Validate(STRING, { optional: true })
    colorName?: string;

    @Validate(AND(COLOR_STRING_ARRAY, ARRAY.restrict({ minLength: 1 })), { optional: true })
    colorRange: string[] | undefined = undefined;

    @Validate(PLAIN_OBJECT)
    topology: FeatureCollection = { type: 'FeatureCollection', features: [] };

    @Validate(COLOR_STRING)
    fill: string = 'black';

    @Validate(RATIO)
    fillOpacity: number = 1;

    @Validate(COLOR_STRING)
    stroke: string = 'black';

    @Validate(RATIO)
    strokeOpacity: number = 1;

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 0;

    @Validate(FUNCTION, { optional: true })
    formatter?: (params: AgMapSeriesFormatterParams<any>) => AgMapSeriesStyle;

    @Validate(OBJECT)
    readonly label = new Label<AgBarSeriesLabelFormatterParams>();

    @Validate(OBJECT)
    override tooltip = new SeriesTooltip<AgMapSeriesTooltipRendererParams<any>>();
}
