import type {
    AgSankeySeriesOptions,
    AgSankeySeriesTooltipRendererParams,
} from '../../../options/series/sankey/sankeyOptions';
import { OBJECT, Validate } from '../../../util/validation';
import { SeriesProperties } from '../seriesProperties';
import { SeriesTooltip } from '../seriesTooltip';

export class SankeySeriesProperties extends SeriesProperties<AgSankeySeriesOptions> {
    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgSankeySeriesTooltipRendererParams>();
}
