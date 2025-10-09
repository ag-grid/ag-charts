import type {
    AgRangeAreaSeriesItemType,
    AgRangeAreaSeriesLabelFormatterParams,
    AgRangeAreaSeriesLabelPlacement,
    AgRangeAreaSeriesOptions,
    AgRangeAreaSeriesOptionsKeys,
    AgRangeAreaSeriesTooltipRendererParams,
    AgSeriesMarkerOptions,
    AgSeriesMarkerStyle,
    PixelSize,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type { AreExact, InternalAgColorType } from 'ag-charts-core';

export interface RangeAreaMarkerDatum extends Omit<_ModuleSupport.CartesianSeriesNodeDatum, 'yKey' | 'yValue'> {
    readonly itemId: AgRangeAreaSeriesItemType;
    readonly index: number;
    readonly yLowKey: string;
    readonly yHighKey: string;
    readonly yLowValue: number;
    readonly yHighValue: number;
    readonly point: Readonly<_ModuleSupport.SizedPoint>;
    readonly enabled: boolean;
    style?: AgSeriesMarkerStyle;
}

const {
    BaseProperties,
    CartesianSeriesProperties,
    InterpolationProperties,
    SeriesMarker,
    makeSeriesTooltip,
    Property,
    DropShadow,
    Label,
    Deprecated,
} = _ModuleSupport;

type RangeAreaSeriesItemOptions = NonNullable<AgRangeAreaSeriesOptions['item']>;
type RangeAreaSeriesLineOptions = NonNullable<RangeAreaSeriesItemOptions[AgRangeAreaSeriesItemType]>;

class RangeAreaSeriesLabel extends Label<AgRangeAreaSeriesLabelFormatterParams> {
    @Property
    placement: AgRangeAreaSeriesLabelPlacement = 'outside';

    @Property
    spacing: PixelSize = 0;
}

class RangeAreaInvertedStyle {
    @Property
    enabled: boolean = false;

    @Property
    fill?: InternalAgColorType;

    @Property
    fillOpacity: number = 1;
}

class RangeAreaLineStyle extends BaseProperties<RangeAreaSeriesLineOptions> {
    @Property
    stroke: string = '#99CCFF';

    @Property
    strokeWidth: number = 1;

    @Property
    strokeOpacity: number = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    @Property
    readonly marker = new SeriesMarker<AgRangeAreaSeriesOptionsKeys>();
}

class RangeAreaItemProperties extends BaseProperties<RangeAreaSeriesItemOptions> {
    @Property
    low = new RangeAreaLineStyle();

    @Property
    high = new RangeAreaLineStyle();
}

const DeprecatedMessage = (alt: string) => `Use item.low.${alt} and item.high.${alt} instead`;

export class RangeAreaProperties extends CartesianSeriesProperties<AgRangeAreaSeriesOptions> {
    @Property
    xKey!: string;

    @Property
    yLowKey!: string;

    @Property
    yHighKey!: string;

    @Property
    xName?: string;

    @Property
    yName?: string;

    @Property
    yLowName?: string;

    @Property
    yHighName?: string;

    @Property
    fill: InternalAgColorType = '#99CCFF';

    @Property
    fillOpacity: number = 1;

    @Deprecated(DeprecatedMessage('stroke'))
    stroke?: string;

    @Deprecated(DeprecatedMessage('strokeWidth'))
    strokeWidth?: number;

    @Deprecated(DeprecatedMessage('strokeOpacity'))
    strokeOpacity?: number;

    @Deprecated(DeprecatedMessage('lineDash'))
    lineDash?: number[];

    @Deprecated(DeprecatedMessage('lineDashOffset'))
    lineDashOffset?: number;

    @Property
    interpolation: _ModuleSupport.InterpolationProperties = new InterpolationProperties();

    @Property
    styler?: Styler<unknown, undefined>;

    @Property
    item = new RangeAreaItemProperties();

    @Property
    readonly invertedStyle = new RangeAreaInvertedStyle();

    @Property
    readonly shadow = new DropShadow().set({ enabled: false });

    @Deprecated(DeprecatedMessage('marker'))
    readonly marker?: AgSeriesMarkerOptions<unknown, unknown, unknown>;

    @Property
    readonly label = new RangeAreaSeriesLabel();

    @Property
    readonly tooltip = makeSeriesTooltip<AgRangeAreaSeriesTooltipRendererParams>();

    @Property
    connectMissingData: boolean = false;

    public applyDeprecations() {
        // We could, in theory, use the graph config to apply the deprecations.
        //
        // Example:
        //    { item: { low: { strokeWidth: { $path: [ '../../strokeWidth', 1 ] }
        //
        // But we can only use $path and $isUserOption on leaf-nodes. So in practice, things get overly complex when
        // trying to configure the defaults for `item.[low|high].marker.fill`, because the defaults also depend on
        // `fill.type`.
        //
        // So simplify this by implementing the deprecated options here.
        //
        const {
            lineDash: deprecatedLineDash,
            lineDashOffset: deprecatedLineDashOffset,
            stroke: deprecatedStroke,
            strokeOpacity: deprecatedStrokeOpacity,
            strokeWidth: deprecatedStrokeWidth,
            item: { low, high },
        } = this;

        if (deprecatedLineDash != null) {
            low.lineDash = deprecatedLineDash;
            high.lineDash = deprecatedLineDash;
        }
        if (deprecatedLineDashOffset != null) {
            low.lineDashOffset = deprecatedLineDashOffset;
            high.lineDashOffset = deprecatedLineDashOffset;
        }
        if (deprecatedStroke != null) {
            low.stroke = deprecatedStroke;
            high.stroke = deprecatedStroke;
        }
        if (deprecatedStrokeOpacity != null) {
            low.strokeOpacity = deprecatedStrokeOpacity;
            high.strokeOpacity = deprecatedStrokeOpacity;
        }
        if (deprecatedStrokeWidth != null) {
            low.strokeWidth = deprecatedStrokeWidth;
            high.strokeWidth = deprecatedStrokeWidth;
        }

        const deprecatedMarker = this.marker == null ? undefined : { ...this.marker };
        if (deprecatedMarker != null) {
            deprecatedMarker.enabled ??= true; // auto-enable
            const {
                enabled: deprecatedMarkerEnabled,
                stroke: deprecatedMarkerStroke,
                itemStyler: deprecatedItemStyler,
                size: deprecatedSize,
                shape: deprecatedShape,
                fill: deprecatedFill,
                fillOpacity: deprecatedFillOpacity,
                strokeOpacity: deprecatedStrokeOpacity,
                strokeWidth: deprecatedStrokeWidth,
                lineDash: deprecatedLineDash,
                lineDashOffset: deprecatedLineDashOffset,
                ...rest
            } = deprecatedMarker;

            // check that all properties from deprecatedMarker have been exhausted:
            true satisfies AreExact<typeof rest, {}>;

            if (deprecatedMarkerEnabled != null) {
                low.marker.enabled = deprecatedMarkerEnabled;
                high.marker.enabled = deprecatedMarkerEnabled;
            }
            if (deprecatedMarkerStroke != null) {
                low.marker.stroke = deprecatedMarkerStroke;
                high.marker.stroke = deprecatedMarkerStroke;
            }
            if (deprecatedItemStyler != null) {
                low.marker.itemStyler = deprecatedItemStyler;
                high.marker.itemStyler = deprecatedItemStyler;
            }
            if (deprecatedSize != null) {
                low.marker.size = deprecatedSize;
                high.marker.size = deprecatedSize;
            }
            if (deprecatedShape != null) {
                low.marker.shape = deprecatedShape;
                high.marker.shape = deprecatedShape;
            }
            if (deprecatedFill != null) {
                if (typeof deprecatedFill === 'string') {
                    low.marker.fill = deprecatedFill;
                    high.marker.fill = deprecatedFill;
                } else {
                    deprecatedFill.
                }
                low.marker.fill = deprecatedFill;
                high.marker.fill = deprecatedFill;
            }
            if (deprecatedFillOpacity != null) {
                low.marker.fillOpacity = deprecatedFillOpacity;
                high.marker.fillOpacity = deprecatedFillOpacity;
            }
            if (deprecatedStrokeOpacity != null) {
                low.marker.strokeOpacity = deprecatedStrokeOpacity;
                high.marker.strokeOpacity = deprecatedStrokeOpacity;
            }
            if (deprecatedStrokeWidth != null) {
                low.marker.strokeWidth = deprecatedStrokeWidth;
                high.marker.strokeWidth = deprecatedStrokeWidth;
            }
            if (deprecatedLineDash != null) {
                low.marker.lineDash = deprecatedLineDash;
                high.marker.lineDash = deprecatedLineDash;
            }
            if (deprecatedLineDashOffset != null) {
                low.marker.lineDashOffset = deprecatedLineDashOffset;
                high.marker.lineDashOffset = deprecatedLineDashOffset;
            }
        }
    }
}
