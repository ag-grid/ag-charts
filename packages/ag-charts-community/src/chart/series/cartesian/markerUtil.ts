import type { ModuleContext } from '../../../module/moduleContext';
import { staticFromToMotion } from '../../../motion/fromToMotion';
import type {
    AgCartesianSeriesMarkerFormat,
    AgSeriesHighlightMarkerStyle,
    AgSeriesMarkerFormatterParams,
    FillOptions,
    StrokeOptions,
} from '../../../options/agChartOptions';
import type { Node } from '../../../scene/node';
import type { SizedPoint } from '../../../scene/point';
import type { Selection } from '../../../scene/selection';
import { mergeDefaults } from '../../../util/object';
import type { AnimationManager } from '../../interaction/animationManager';
import type { Marker } from '../../marker/marker';
import type { SeriesNodeDatum } from '../seriesTypes';

interface NodeDatum extends SeriesNodeDatum {
    readonly xKey: string;
    readonly xValue?: any;
    readonly point?: SizedPoint;
}

type MarkerStyle = FillOptions & StrokeOptions & { visible?: boolean; size?: number };
type MarkerConfig = MarkerStyle & { point?: SizedPoint; customMarker: boolean };

export function getMarkerConfig<ExtraParams extends {}>({
    datum: { datum, point },
    highlighted,
    markerStyle,
    seriesStyle,
    highlightStyle,
    formatter,
    seriesId,
    ctx: { callbackCache },
    ...opts
}: {
    datum: NodeDatum;
    highlighted: boolean;
    markerStyle: MarkerStyle;
    seriesStyle: MarkerStyle;
    highlightStyle: AgSeriesHighlightMarkerStyle;
    formatter?: (params: AgSeriesMarkerFormatterParams<NodeDatum> & ExtraParams) => AgCartesianSeriesMarkerFormat;
    seriesId: string;
    ctx: ModuleContext;
} & ExtraParams): MarkerStyle {
    const {
        fill,
        fillOpacity,
        stroke,
        strokeWidth = 1,
        strokeOpacity,
    } = mergeDefaults(highlighted && highlightStyle, markerStyle, seriesStyle);

    let format: AgCartesianSeriesMarkerFormat | undefined;
    if (formatter) {
        format = callbackCache.call(formatter as any, {
            datum,
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            size: point?.size ?? 0,
            highlighted,
            seriesId,
            ...opts,
        });
    }

    return {
        fill: format?.fill ?? fill,
        stroke: format?.stroke ?? stroke,
        strokeWidth: format?.strokeWidth ?? strokeWidth,
        size: format?.size ?? point?.size ?? markerStyle.size,
        fillOpacity,
        strokeOpacity,
    };
}

export function updateMarker({ node, config }: { node: Marker; config: MarkerConfig }) {
    const {
        visible = true,
        point,
        fill,
        fillOpacity = 1,
        stroke,
        strokeWidth = 1,
        strokeOpacity = 1,
        size = point?.size ?? 0,
        customMarker,
    } = config;

    node.setProperties({
        visible: visible && size > 0 && point && !isNaN(point.x) && !isNaN(point.y),
        fill,
        fillOpacity,
        stroke,
        strokeWidth,
        strokeOpacity,
        size,
        translationX: point?.x,
        translationY: point?.y,
    });

    // Only for custom marker shapes
    if (customMarker && !node.dirtyPath) {
        node.path.clear({ trackChanges: true });
        node.updatePath();
        node.checkPathDirty();
    }
}

type NodeWithOpacity = Node & { opacity: number };
export function markerFadeInAnimation<T>(
    { id }: { id: string },
    animationManager: AnimationManager,
    markerSelections: Selection<NodeWithOpacity, T>[],
    delay?: true
) {
    const params = delay
        ? { delay: animationManager.defaultDuration, duration: 200 }
        : { duration: animationManager.defaultDuration };
    staticFromToMotion(`${id}_markers`, animationManager, markerSelections, { opacity: 0 }, { opacity: 1 }, params);
}

export function markerScaleInAnimation<T>(
    { id }: { id: string },
    animationManager: AnimationManager,
    markerSelections: Selection<Node, T>[]
) {
    staticFromToMotion(
        `${id}_markers`,
        animationManager,
        markerSelections,
        { scalingX: 0, scalingY: 0 },
        { scalingX: 1, scalingY: 1 },
        { duration: animationManager.defaultDuration }
    );
}

export function resetMarkerFn(_node: NodeWithOpacity & Node) {
    return { opacity: 1, scalingX: 1, scalingY: 1 };
}
