import type { HighlightNodeDatum } from '../../../core/eventsHub';
import type { HighlightState } from '../seriesProperties';
import type { SeriesNodeDatum } from '../seriesTypes';

interface SeriesLike<TStyle> {
    getHighlightState(
        highlightedDatum: HighlightNodeDatum | undefined,
        isHighlight?: boolean,
        datumIndex?: number,
        legendItemValues?: string[]
    ): HighlightState;

    getItemStyle(datumIndex: number | undefined, isHighlight: boolean, highlightState?: HighlightState): TStyle;
}

interface SeriesNodeDatumLike<TStyle> extends SeriesNodeDatum<number> {
    style?: TStyle;
}

export function readDatumStyle<TStyle, TDatum extends SeriesNodeDatumLike<TStyle>>(
    series: SeriesLike<TStyle>,
    targetDatum: TDatum,
    highlightedDatum: HighlightNodeDatum | undefined,
    opts: { isHighlight: boolean }
) {
    const { datumIndex, style } = targetDatum;
    if (style != null) return style;

    const highlightState = series.getHighlightState(highlightedDatum, opts.isHighlight, datumIndex);
    return series.getItemStyle(datumIndex, opts.isHighlight, highlightState);
}
