import {
    type AgBaseRadarSeriesOptions,
    type AgRadarLineSeriesStyle,
    type AgRadarLineSeriesStylerParams,
    type AgRadarSeriesStyle,
    type AgSeriesMarkerStyle,
    _ModuleSupport,
} from 'ag-charts-community';
import type { CallbackParamRules, RequireOptional } from 'ag-charts-core';

import { RadarSeries, type ResolvedRadarStyle } from '../radar/radarSeries';
import { RadarSeriesProperties } from '../radar/radarSeriesProperties';

const { HighlightState, PointerEvents, toHighlightString } = _ModuleSupport;

type S = AgRadarSeriesStyle;
type O = AgBaseRadarSeriesOptions;
type P = RadarSeriesProperties<S, O>;
export class RadarLineSeries extends RadarSeries<S, O, P> {
    static override readonly className = 'RadarLineSeries';
    static readonly type = 'radar-line' as const;

    override properties = new RadarSeriesProperties();

    protected override updatePathSelections() {
        this.lineSelection.update(this.visible ? [true] : []);
    }

    protected override updatePathNodes(): void {
        const lineNode = this.getLineNode();
        if (!lineNode) return;

        const style = this.getPathNodesStyle();
        const { strokeWidth, stroke, strokeOpacity, lineDash, lineDashOffset, opacity } = style;

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

    protected override makeStylerParams(
        highlightStateEnum?: _ModuleSupport.HighlightState
    ): AgRadarLineSeriesStylerParams {
        const { properties } = this;
        const highlightState = toHighlightString(highlightStateEnum ?? HighlightState.None);

        type MarkerRules = { marker: RequireOptional<AgSeriesMarkerStyle> };
        type ParamsRules = CallbackParamRules<AgRadarLineSeriesStylerParams & MarkerRules>;
        return {
            marker: {
                fill: properties.marker.fill,
                fillOpacity: properties.marker.fillOpacity,
                size: properties.marker.size,
                shape: properties.marker.shape,
                stroke: properties.marker.stroke,
                strokeOpacity: properties.marker.strokeOpacity,
                strokeWidth: properties.marker.strokeWidth,
                lineDash: properties.marker.lineDash,
                lineDashOffset: properties.marker.lineDashOffset,
            },
            highlightState,
            lineDash: properties.lineDash,
            lineDashOffset: properties.lineDashOffset,
            seriesId: this.id,
            stroke: properties.stroke,
            strokeOpacity: properties.strokeOpacity,
            strokeWidth: properties.strokeWidth,
            angleKey: properties.angleKey,
            radiusKey: properties.radiusKey,
        } satisfies ParamsRules;
    }

    override getStyle(
        highlightState?: _ModuleSupport.HighlightState
    ): ResolvedRadarStyle<AgRadarLineSeriesStyle> {
        const { marker, lineDash, lineDashOffset, stroke, strokeOpacity, strokeWidth } = this.properties;
        const { size, shape, fill = 'transparent', fillOpacity } = marker;
        const stylerResult = this.getStylerResult({}, highlightState);
        stylerResult.marker ??= {};

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
        };
    }
}
