import {
    type AgBaseRadarSeriesOptions,
    type AgRadarLineSeriesOptions,
    type AgRadarLineSeriesStyle,
    type AgRadarLineSeriesStylerParams,
    type AgRadarSeriesStyle,
    type AgSeriesMarkerStyle,
    _ModuleSupport,
} from 'ag-charts-community';
import type { RequireOptional } from 'ag-charts-core';

import { RadarSeries } from '../radar/radarSeries';
import { RadarSeriesProperties } from '../radar/radarSeriesProperties';

const { HighlightState, PointerEvents, mergeDefaults, toHighlightString } = _ModuleSupport;

type S = AgRadarSeriesStyle;
type O = AgBaseRadarSeriesOptions;
type P = RadarSeriesProperties<S, O>;
export class RadarLineSeries extends RadarSeries<S, O, P> {
    static override readonly className = 'RadarLineSeries';
    static readonly type = 'radar-line' as const;

    override properties = new RadarSeriesProperties();

    protected override hasItemStylers(): boolean {
        return this.properties.marker.itemStyler != null || this.properties.label.itemStyler != null;
    }

    protected override updatePathSelections() {
        this.lineSelection.update(this.visible ? [true] : []);
    }

    protected override updatePathNodes(): void {
        const lineNode = this.getLineNode();
        if (!lineNode) return;

        type K = 'stroke' | 'strokeWidth' | 'strokeOpacity' | 'lineDash' | 'lineDashOffset';
        type M = Pick<AgRadarLineSeriesOptions, K> & { opacity?: number };
        const merged = mergeDefaults<M>(this.getHighlightStyle(), this.getStyle(false));
        const { strokeWidth, stroke, strokeOpacity, lineDash, lineDashOffset, opacity } = merged;

        lineNode.setProperties({
            fill: undefined,
            lineJoin: 'round',
            lineCap: 'round',
            pointerEvents: PointerEvents.None,
            opacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
        });
    }

    private makeStylerParams(
        highlighted: boolean,
        highlightStateEnum?: _ModuleSupport.HighlightState
    ): AgRadarLineSeriesStylerParams {
        const { id: seriesId } = this;
        const { marker, lineDash, lineDashOffset, stroke, strokeOpacity, strokeWidth, radiusKey, angleKey } =
            this.properties;
        const highlightState = toHighlightString(highlightStateEnum ?? HighlightState.None);

        type MarkerRules = { marker: RequireOptional<AgSeriesMarkerStyle> };
        type ResultRules = _ModuleSupport.CallbackParamRules<AgRadarLineSeriesStylerParams & MarkerRules>;
        return {
            marker: {
                fill: marker.fill,
                fillOpacity: marker.fillOpacity,
                size: marker.size,
                shape: marker.shape,
                stroke: marker.stroke,
                strokeOpacity: marker.strokeOpacity,
                strokeWidth: marker.strokeWidth,
                lineDash: marker.lineDash,
                lineDashOffset: marker.lineDashOffset,
            },
            highlightState,
            highlighted,
            lineDash,
            lineDashOffset,
            seriesId,
            stroke,
            strokeOpacity,
            strokeWidth,
            angleKey,
            radiusKey,
        } satisfies ResultRules;
    }

    override getStyle(
        highlighted: boolean,
        highlightState?: _ModuleSupport.HighlightState
    ): AgRadarLineSeriesStyle & { marker: AgSeriesMarkerStyle & { enabled: boolean } } {
        const { styler, marker, lineDash, lineDashOffset, stroke, strokeOpacity, strokeWidth } = this.properties;
        const { size, shape, fill = 'transparent', fillOpacity } = marker;
        let stylerResult: AgRadarLineSeriesStyle & { marker?: { enabled?: boolean } } = {};
        if (styler) {
            const stylerParams = this.makeStylerParams(highlighted, highlightState);
            const cbResult = this.cachedCallWithContext(styler, stylerParams) ?? {};
            const resolved = this.ctx.optionsGraphService.resolvePartial(
                ['series', `${this.declarationOrder}`],
                cbResult,
                { pick: false }
            );
            stylerResult = resolved ?? {};
        }
        stylerResult.marker ??= {};

        type MarkerRules = { marker: RequireOptional<AgSeriesMarkerStyle> & { enabled: boolean } };
        type ResultRules = RequireOptional<AgRadarLineSeriesStyle> & MarkerRules;
        return {
            lineDash: stylerResult.lineDash ?? lineDash,
            lineDashOffset: stylerResult.lineDashOffset ?? lineDashOffset,
            stroke: stylerResult.stroke ?? stroke,
            strokeOpacity: stylerResult.strokeOpacity ?? strokeOpacity,
            strokeWidth: stylerResult.strokeWidth ?? strokeWidth,
            marker: {
                enabled: stylerResult.marker.enabled ?? marker.enabled,
                fill: stylerResult.marker.fill ?? fill,
                fillOpacity: stylerResult.marker.fillOpacity ?? fillOpacity,
                shape: stylerResult.marker.shape ?? shape,
                size: stylerResult.marker.size ?? size,
                lineDash: stylerResult.marker.lineDash ?? marker.lineDash ?? lineDash,
                lineDashOffset: stylerResult.marker.lineDashOffset ?? marker.lineDashOffset ?? lineDashOffset,
                stroke: stylerResult.marker.stroke ?? marker.stroke ?? stroke,
                strokeOpacity: stylerResult.marker.strokeOpacity ?? marker.strokeOpacity ?? strokeOpacity,
                strokeWidth: stylerResult.marker.strokeWidth ?? marker.strokeWidth ?? strokeWidth,
            },
        } satisfies ResultRules;
    }
}
