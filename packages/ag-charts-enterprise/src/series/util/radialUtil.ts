import type {
    AgColorType,
    AgRadialSeriesItemStylerParams,
    AgRadialSeriesStyle,
    AgRadialSeriesStylerParams,
    HighlightState as HighlightStateString,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type { Callback, CallbackParam, InternalAgColorType, CallbackParamRules } from 'ag-charts-core';

import { mergeDefaults } from 'ag-charts-core';
const { createDatumId, toHighlightString } = _ModuleSupport;

type BaseNodeDatum = _ModuleSupport.DataModelSeriesNodeDatum;

export interface RadialSeriesStyleResult extends Required<Omit<AgRadialSeriesStyle, 'fill'>> {
    fill: InternalAgColorType;
    opacity: 1;
}

interface RadialSectorSeries<D extends BaseNodeDatum> {
    readonly id: string;
    readonly ctx: _ModuleSupport.ModuleContext;
    readonly declarationOrder: number;
    readonly context?: { nodeData: D[] };
    readonly properties: {
        readonly angleKey: string;
        readonly radiusKey: string;
        readonly fill: InternalAgColorType;
        readonly fillOpacity: number;
        readonly stroke: string;
        readonly strokeWidth: number;
        readonly strokeOpacity: number;
        readonly lineDash: number[];
        readonly lineDashOffset: number;
        readonly cornerRadius: number;
        readonly stackGroup?: string;
        readonly styler?: Styler<AgRadialSeriesStylerParams<unknown, unknown>, AgRadialSeriesStyle>;
        readonly itemStyler?: Styler<AgRadialSeriesItemStylerParams<unknown>, AgRadialSeriesStyle>;
    };
    callWithContext<F extends Callback>(fn: F, params: CallbackParam<F>): ReturnType<F>;
    cachedCallWithContext<F extends Callback>(fn: F, params: CallbackParam<F>): ReturnType<F> | undefined;
    cachedDatumCallback<T>(id: any, fn: () => T): T | undefined;
    filterItemStylerFillParams(fill: AgColorType | undefined): InternalAgColorType | undefined;
    getDatumId(datum: D): string | number | boolean | undefined;
    getHighlightStyle(
        isHighlight?: boolean,
        datumIndex?: number,
        highlightState?: _ModuleSupport.HighlightState
    ): AgRadialSeriesStyle;
    getHighlightStateString(
        datum: _ModuleSupport.HighlightNodeDatum | undefined,
        isHighlight?: boolean,
        datumIndex?: number
    ): HighlightStateString;
}

export function makeStylerParams(
    series: RadialSectorSeries<BaseNodeDatum>,
    highlighted: boolean,
    highlightStateEnum?: _ModuleSupport.HighlightState
): AgRadialSeriesStylerParams<unknown, unknown> {
    const { id: seriesId } = series;
    const {
        angleKey,
        cornerRadius,
        fill,
        fillOpacity,
        lineDash,
        lineDashOffset,
        radiusKey,
        stackGroup,
        stroke,
        strokeOpacity,
        strokeWidth,
    } = series.properties;
    const highlightState = toHighlightString(highlightStateEnum ?? _ModuleSupport.HighlightState.None);

    type T = ReturnType<typeof makeStylerParams>;
    type Rules = CallbackParamRules<T>;
    return {
        angleKey,
        cornerRadius,
        fill,
        fillOpacity,
        highlightState,
        highlighted,
        lineDash,
        lineDashOffset,
        radiusKey,
        seriesId,
        stackGroup,
        stroke,
        strokeOpacity,
        strokeWidth,
    } satisfies Rules;
}

export function getStyle(
    series: RadialSectorSeries<BaseNodeDatum>,
    ignoreStylerCallback: boolean,
    highlighted: boolean,
    highlightState?: _ModuleSupport.HighlightState
): RadialSeriesStyleResult {
    const { styler } = series.properties;
    let stylerResult: AgRadialSeriesStyle = {};
    if (!ignoreStylerCallback && styler) {
        const stylerParams = makeStylerParams(series, highlighted, highlightState);
        stylerResult =
            series.ctx.optionsGraphService.resolvePartial(
                ['series', `${series.declarationOrder}`],
                series.cachedCallWithContext(styler, stylerParams) ?? {},
                { pick: false }
            ) ?? {};
    }

    return {
        cornerRadius: stylerResult.cornerRadius ?? series.properties.cornerRadius,
        fill: stylerResult.fill ?? series.properties.fill,
        fillOpacity: stylerResult.fillOpacity ?? series.properties.fillOpacity,
        lineDash: stylerResult.lineDash ?? series.properties.lineDash,
        lineDashOffset: stylerResult.lineDashOffset ?? series.properties.lineDashOffset,
        stroke: stylerResult.stroke ?? series.properties.stroke,
        strokeOpacity: stylerResult.strokeOpacity ?? series.properties.strokeOpacity,
        strokeWidth: stylerResult.strokeWidth ?? series.properties.strokeWidth,
        opacity: 1,
    };
}

export function makeItemStylerParams<D extends BaseNodeDatum, S extends RadialSectorSeries<D>>(
    series: S,
    nodeDatum: D,
    isHighlight: boolean,
    style: Required<AgRadialSeriesStyle> & { opacity: number }
) {
    const { id: seriesId, properties } = series;
    const { angleKey, radiusKey } = properties;

    const activeHighlight = series.ctx.highlightManager?.getActiveHighlight();
    const highlightStateString = series.getHighlightStateString(activeHighlight, isHighlight, nodeDatum.datumIndex);
    const fill = series.filterItemStylerFillParams(style.fill) ?? style.fill;

    return {
        seriesId,
        datum: nodeDatum.datum,
        highlighted: isHighlight,
        highlightState: highlightStateString,
        angleKey,
        radiusKey,
        ...style,
        fill,
    };
}

export function getItemStyle<D extends BaseNodeDatum, S extends RadialSectorSeries<D>>(
    series: S,
    nodeDatum: D | undefined,
    isHighlight: boolean,
    highlightState?: _ModuleSupport.HighlightState
): RadialSeriesStyleResult {
    const { properties } = series;
    const { itemStyler } = properties;

    const highlightStyle = series.getHighlightStyle(isHighlight, nodeDatum?.datumIndex, highlightState);
    const baseStyle = mergeDefaults(
        highlightStyle,
        getStyle(series, nodeDatum === undefined, isHighlight, highlightState)
    );
    let style = baseStyle;

    if (itemStyler != null && nodeDatum != null) {
        const overrides = series.cachedDatumCallback(
            createDatumId(series.getDatumId(nodeDatum), isHighlight ? 'highlight' : 'node'),
            () => {
                const params = makeItemStylerParams(series, nodeDatum, isHighlight, style);
                return series.callWithContext(itemStyler, params);
            }
        );

        if (overrides) {
            style = mergeDefaults(overrides, style);
        }
    }

    return style;
}
