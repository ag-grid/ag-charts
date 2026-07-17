import type {
    AgColorType,
    AgRadialSeriesItemStylerParams,
    AgRadialSeriesStyle,
    AgRadialSeriesStylerParams,
    HighlightState as HighlightStateString,
    SelectionState as SelectionStateString,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type {
    Callback,
    CallbackParam,
    CallbackParamRules,
    DynamicContext,
    InternalAgColorType,
    Resolved,
} from 'ag-charts-core';
import { mergeDefaults } from 'ag-charts-core';

const { createDatumId, toHighlightString, toSelectionString } = _ModuleSupport;

type BaseNodeDatum = _ModuleSupport.DataModelSeriesNodeDatum;

export interface RadialSeriesStyleResult extends Required<Omit<AgRadialSeriesStyle, 'fill'>> {
    fill: InternalAgColorType;
    opacity: 1;
}

interface RadialSectorSeries<D extends BaseNodeDatum> {
    readonly id: string;
    readonly ctx: DynamicContext<_ModuleSupport.ChartRegistry>;
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
    getSelectionStyle(
        datumIndex?: number,
        selectionState?: _ModuleSupport.SelectionState,
        candidateState?: _ModuleSupport.SelectionState
    ): AgRadialSeriesStyle | undefined;
    getSelectionStateString(datumIndex: number | undefined): SelectionStateString | undefined;
    getCandidateStateString(datumIndex: number | undefined): SelectionStateString | undefined;
}

export function makeStylerParams(
    series: RadialSectorSeries<BaseNodeDatum>,
    highlightStateEnum: _ModuleSupport.HighlightState | undefined,
    selectionStateEnum: _ModuleSupport.SelectionState | undefined,
    candidateStateEnum: _ModuleSupport.SelectionState | undefined
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
    const selectionState = toSelectionString(selectionStateEnum);
    const candidateState = toSelectionString(candidateStateEnum);

    type T = ReturnType<typeof makeStylerParams>;
    type Rules = CallbackParamRules<T>;
    return {
        angleKey,
        cornerRadius,
        fill,
        fillOpacity,
        highlightState,
        selectionState,
        candidateState,
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
    highlightState: _ModuleSupport.HighlightState | undefined,
    selectionState: _ModuleSupport.SelectionState | undefined,
    candidateState: _ModuleSupport.SelectionState | undefined
): RadialSeriesStyleResult {
    const { styler } = series.properties;
    let stylerResult: Resolved<Partial<AgRadialSeriesStyle>> = {};
    if (!ignoreStylerCallback && styler) {
        const stylerParams = makeStylerParams(series, highlightState, selectionState, candidateState);
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
    const selectionStateString = series.getSelectionStateString(nodeDatum.datumIndex);
    const candidateStateString = series.getCandidateStateString(nodeDatum.datumIndex);
    const fill = series.filterItemStylerFillParams(style.fill) ?? style.fill;

    type ItemStylerParamRules = CallbackParamRules<AgRadialSeriesItemStylerParams<unknown, never>>;
    return {
        seriesId,
        datum: nodeDatum.datum,
        highlightState: highlightStateString,
        selectionState: selectionStateString,
        candidateState: candidateStateString,
        angleKey,
        radiusKey,
        ...style,
        fill,
    } satisfies ItemStylerParamRules;
}

export function getItemStyle<D extends BaseNodeDatum, S extends RadialSectorSeries<D>>(
    series: S,
    nodeDatum: D | undefined,
    isHighlight: boolean,
    highlightState: _ModuleSupport.HighlightState | undefined,
    selectionState: _ModuleSupport.SelectionState | undefined,
    candidateState: _ModuleSupport.SelectionState | undefined
): RadialSeriesStyleResult {
    const { properties } = series;
    const { itemStyler } = properties;

    const highlightStyle = series.getHighlightStyle(isHighlight, nodeDatum?.datumIndex, highlightState);
    // Pre-resolved selectionState is forwarded by the no-itemStyler cache path.
    const selectionStyle = series.getSelectionStyle(nodeDatum?.datumIndex, selectionState, candidateState);
    const baseStyle = mergeDefaults(
        selectionStyle,
        highlightStyle,
        getStyle(series, nodeDatum === undefined, highlightState, selectionState, candidateState)
    );
    let style = baseStyle;

    if (itemStyler != null && nodeDatum != null) {
        const overrides = series.cachedDatumCallback(
            createDatumId(series.getDatumId(nodeDatum), isHighlight ? 'highlight' : 'node'),
            () => {
                const params = makeItemStylerParams(series, nodeDatum, isHighlight, style);
                return series.ctx.optionsGraphService.resolvePartial(
                    ['series', `${series.declarationOrder}`],
                    series.callWithContext(itemStyler, params)
                );
            }
        );

        if (overrides) {
            style = mergeDefaults(overrides, style);
        }
    }

    return style;
}
