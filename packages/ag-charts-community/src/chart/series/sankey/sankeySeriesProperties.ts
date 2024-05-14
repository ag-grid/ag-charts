import type {
    AgSankeySeriesOptions,
    AgSankeySeriesTooltipRendererParams,
} from '../../../options/series/sankey/sankeyOptions';
import { ARRAY, NUMBER, OBJECT, STRING, Validate } from '../../../util/validation';
import { SeriesProperties } from '../seriesProperties';
import { SeriesTooltip } from '../seriesTooltip';

export class SankeySeriesProperties extends SeriesProperties<AgSankeySeriesOptions> {
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

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgSankeySeriesTooltipRendererParams>();
}
