import {
    type AgRadarAreaSeriesOptions,
    type AgRadarAreaSeriesStyle,
    type AgRadarAreaSeriesStylerParams,
    type AgSeriesMarkerStyle,
    _ModuleSupport,
} from 'ag-charts-community';
import type { RequireOptional } from 'ag-charts-core';

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
    mergeDefaults,
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
        const stylerStyle = this.getStyle(false);
        return stylerStyle.marker.fill ?? stylerStyle.fill;
    }

    protected override updatePathNodes(): void {
        const lineNode = this.getLineNode();
        if (!lineNode) return;

        type K = 'fill' | 'fillOpacity' | 'stroke' | 'strokeWidth' | 'strokeOpacity' | 'lineDash' | 'lineDashOffset';
        type M = Pick<AgRadarAreaSeriesOptions, K> & { opacity?: number };
        const merged = mergeDefaults<M>(this.getHighlightStyle(), this.getStyle(false));
        const { fill, fillOpacity, strokeWidth, stroke, strokeOpacity, lineDash, lineDashOffset, opacity } = merged;

        lineNode.setProperties({
            fill,
            fillOpacity,
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
            const stylerStyle = superStyle ?? this.getStyle(false);
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

            areaPoints.forEach(({ x, y, moveTo, arc, radius = 0, startAngle = 0, endAngle = 0 }) => {
                if (arc) {
                    areaPath.arc(x, y, radius, startAngle, endAngle);
                } else if (moveTo) {
                    areaPath.moveTo(x, y);
                } else {
                    areaPath.lineTo(x, y);
                }
            });
            areaPath.closePath();

            areaNode.checkPathDirty();
            return stylerStyle;
        }
    }

    private makeStylerParams(
        highlighted: boolean,
        highlightStateEnum?: _ModuleSupport.HighlightState
    ): AgRadarAreaSeriesStylerParams {
        const { id: seriesId } = this;
        const {
            marker,
            fill,
            fillOpacity,
            lineDash,
            lineDashOffset,
            stroke,
            strokeOpacity,
            strokeWidth,
            radiusKey,
            angleKey,
        } = this.properties;
        const highlightState = toHighlightString(highlightStateEnum ?? HighlightState.None);

        type MarkerRules = { marker: RequireOptional<AgSeriesMarkerStyle> };
        type ParamsRules = _ModuleSupport.CallbackParamRules<AgRadarAreaSeriesStylerParams & MarkerRules>;
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
            fill,
            fillOpacity,
            lineDash,
            lineDashOffset,
            seriesId,
            stroke,
            strokeOpacity,
            strokeWidth,
            angleKey,
            radiusKey,
        } satisfies ParamsRules;
    }

    override getStyle(
        highlighted: boolean,
        highlightState?: _ModuleSupport.HighlightState
    ): ResolvedRadarStyle<AgRadarAreaSeriesStyle> {
        const { styler, marker, fill, fillOpacity, lineDash, lineDashOffset, stroke, strokeOpacity, strokeWidth } =
            this.properties;
        const { size, shape, fill: markerFill = 'transparent', fillOpacity: markerFillOpacity } = marker;
        let stylerResult: AgRadarAreaSeriesStyle & { marker?: { enabled?: boolean } } = {};
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
