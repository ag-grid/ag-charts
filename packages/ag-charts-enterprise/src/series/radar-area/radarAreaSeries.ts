import {
    type AgRadarAreaSeriesOptions,
    type AgRadarAreaSeriesStyle,
    type AgRadarAreaSeriesStylerParams,
    type AgSeriesMarkerStyle,
    _ModuleSupport,
} from 'ag-charts-community';
import type { CallbackParamRules, RequireOptional } from 'ag-charts-core';

import { type RadarPathPoint, RadarSeries, type ResolvedRadarStyle } from '../radar/radarSeries';
import { RadarAreaSeriesProperties } from './radarAreaSeriesProperties';

const {
    ChartAxisDirection,
    Group,
    HighlightState,
    Path,
    PointerEvents,
    Selection,
    applyShapeStyle,
    toHighlightString,
} = _ModuleSupport;

type S = AgRadarAreaSeriesStyle;
type O = AgRadarAreaSeriesOptions;
type P = RadarAreaSeriesProperties;
export class RadarAreaSeries extends RadarSeries<S, O, P> {
    static override readonly className = 'RadarAreaSeries';
    static readonly type = 'radar-area' as const;

    override properties = new RadarAreaSeriesProperties();

    private readonly areaGroup = this.contentGroup.appendChild(new Group({ name: 'radar-area' }));
    protected areaSelection: _ModuleSupport.Selection<_ModuleSupport.Path, boolean> = Selection.select(
        this.areaGroup,
        Path
    );

    override resetInvalidToZero = true;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx);
        this.areaGroup.zIndex = -1;
    }

    protected override updatePathSelections() {
        const pathData = this.visible ? [true] : [];
        this.areaSelection.update(pathData);
        super.updatePathSelections();
    }

    protected getAreaNode() {
        return this.areaSelection.at(0);
    }

    protected override getMarkerFill(highlightedStyle?: _ModuleSupport.SeriesItemHighlightStyle) {
        if (highlightedStyle?.fill != null) return highlightedStyle.fill;
        const stylerStyle = this.getStyle();
        return stylerStyle.marker.fill ?? stylerStyle.fill;
    }

    protected override updatePathNodes(): void {
        const styles = this.getPathNodesStyle();
        const { fill, fillOpacity, strokeWidth, stroke, strokeOpacity, lineDash, lineDashOffset, opacity } = styles;

        const lineNode = this.getLineNode();
        if (lineNode) {
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

        const areaNode = this.getAreaNode();
        if (areaNode) {
            applyShapeStyle(areaNode, { fill, fillOpacity, stroke: undefined }, this.getShapeFillBBox());
            areaNode.setProperties({
                lineJoin: 'round',
                pointerEvents: PointerEvents.None,
                opacity,
            });
        }
    }

    protected override animatePaths(ratio: number) {
        super.animatePaths(ratio);

        const areaNode = this.getAreaNode();
        if (areaNode) {
            this.animateSinglePath(areaNode, this.getAreaPoints(), ratio);
        }
    }

    private getAreaPoints(): RadarPathPoint[] {
        const points: RadarPathPoint[] = this.getLinePoints();

        const getPolarAxis = (direction: _ModuleSupport.ChartAxisDirection): _ModuleSupport.PolarAxis | undefined => {
            const axis = this.axes[direction];
            return axis instanceof _ModuleSupport.PolarAxis ? axis : undefined;
        };

        const radiusAxis = getPolarAxis(ChartAxisDirection.Radius);
        const angleAxis = getPolarAxis(ChartAxisDirection.Angle);

        const reversedRadiusAxis = radiusAxis?.isReversed();

        if (!reversedRadiusAxis) {
            return points;
        }

        const zeroLinePoints = angleAxis?.getAxisLinePoints()?.points ?? [];

        return points.concat(...zeroLinePoints);
    }

    protected override resetPaths(): ResolvedRadarStyle<AgRadarAreaSeriesStyle> | undefined {
        const superStyle = super.resetPaths();
        const areaNode = this.getAreaNode();

        if (areaNode) {
            const { path: areaPath } = areaNode;
            const areaPoints = this.getAreaPoints();
            const stylerStyle = superStyle ?? this.getStyle();
            const fillBBox = this.getShapeFillBBox();

            applyShapeStyle(
                areaNode,
                {
                    fill: stylerStyle.fill,
                    stroke: undefined,
                    fillOpacity: stylerStyle.fillOpacity,
                    lineDash: stylerStyle.lineDash,
                    lineDashOffset: stylerStyle.lineDashOffset,
                },
                fillBBox
            );

            areaNode.lineJoin = areaNode.lineCap = 'round';

            areaPath.clear(true);

            for (const { x, y, moveTo, arc, radius = 0, startAngle = 0, endAngle = 0 } of areaPoints) {
                if (arc) {
                    areaPath.arc(x, y, radius, startAngle, endAngle);
                } else if (moveTo) {
                    areaPath.moveTo(x, y);
                } else {
                    areaPath.lineTo(x, y);
                }
            }
            areaPath.closePath();

            areaNode.checkPathDirty();
            return stylerStyle;
        }
    }

    protected override makeStylerParams(
        highlightStateEnum?: _ModuleSupport.HighlightState
    ): AgRadarAreaSeriesStylerParams {
        const { properties } = this;
        const highlightState = toHighlightString(highlightStateEnum ?? HighlightState.None);

        type MarkerRules = { marker: RequireOptional<AgSeriesMarkerStyle> };
        type ParamsRules = CallbackParamRules<AgRadarAreaSeriesStylerParams & MarkerRules>;
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
            fill: properties.fill,
            fillOpacity: properties.fillOpacity,
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

    override getStyle(highlightState?: _ModuleSupport.HighlightState): ResolvedRadarStyle<AgRadarAreaSeriesStyle> {
        const { marker, fill, fillOpacity, lineDash, lineDashOffset, stroke, strokeOpacity, strokeWidth } =
            this.properties;
        const { size, shape, fill: markerFill = 'transparent', fillOpacity: markerFillOpacity } = marker;
        const stylerResult = this.getStylerResult({}, highlightState);
        stylerResult.marker ??= {};

        return {
            fill: stylerResult.fill ?? fill,
            fillOpacity: stylerResult.fillOpacity ?? fillOpacity,
            lineDash: stylerResult.lineDash ?? lineDash,
            lineDashOffset: stylerResult.lineDashOffset ?? lineDashOffset,
            stroke: stylerResult.stroke ?? stroke,
            strokeOpacity: stylerResult.strokeOpacity ?? strokeOpacity,
            strokeWidth: stylerResult.strokeWidth ?? strokeWidth,
            marker: {
                enabled: stylerResult.marker.enabled ?? marker.enabled,
                fill: stylerResult.marker.fill ?? markerFill,
                fillOpacity: stylerResult.marker.fillOpacity ?? markerFillOpacity,
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
