import { Padding } from '../util/padding';
import { BaseProperties } from '../util/properties';
import { ARRAY, BOOLEAN, OBJECT, POSITIVE_NUMBER, UNION, Validate } from '../util/validation';
import { Caption } from './caption';
import { ChartOverlays } from './overlay/chartOverlays';
import { Tooltip } from './tooltip/tooltip';

class ChartHighlight extends BaseProperties {
    @Validate(UNION(['tooltip', 'node'], 'a range'))
    public range: 'tooltip' | 'node' = 'tooltip';
}

class SeriesArea extends BaseProperties {
    @Validate(BOOLEAN)
    clip: boolean = false;

    @Validate(OBJECT)
    padding = new Padding(0);
}

export class ChartProperties extends BaseProperties {
    @Validate(ARRAY, { optional: true })
    data?: any[];

    @Validate(OBJECT.restrict(HTMLElement), { optional: true })
    container?: HTMLElement;

    @Validate(POSITIVE_NUMBER, { optional: true })
    width?: number;

    @Validate(POSITIVE_NUMBER, { optional: true })
    height?: number;

    @Validate(BOOLEAN, { optional: true })
    autoSize?: boolean;

    @Validate(OBJECT)
    readonly title = new Caption();

    @Validate(OBJECT)
    readonly subtitle = new Caption();

    @Validate(OBJECT)
    readonly footnote = new Caption();

    @Validate(OBJECT)
    readonly padding = new Padding(20);

    @Validate(OBJECT)
    readonly seriesArea = new SeriesArea();

    @Validate(OBJECT)
    readonly highlight = new ChartHighlight();

    @Validate(OBJECT)
    readonly overlays = new ChartOverlays();

    @Validate(OBJECT)
    readonly tooltip = new Tooltip();
}
