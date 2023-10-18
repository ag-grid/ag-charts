import type { ModuleContext } from '../../../module/moduleContext';
import { QUICK_TRANSITION } from '../../../motion/animation';
import type { NodeUpdateState } from '../../../motion/fromToMotion';
import { FROM_TO_MIXINS, fromToMotion, staticFromToMotion } from '../../../motion/fromToMotion';
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
import * as easing from './../../../motion/easing';
import type { CartesianSeriesNodeDatum } from './cartesianSeries';

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
        visible: visible && size > 0 && !isNaN(point?.x ?? 0) && !isNaN(point?.y ?? 0),
        fill,
        fillOpacity,
        stroke,
        strokeWidth,
        strokeOpacity,
        size,
        // Don't trample translation properties unless a point is specified.
        ...(point ? { translationX: point.x, translationY: point.y } : {}),
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
    status: NodeUpdateState = 'unknown'
) {
    const params = { ...FROM_TO_MIXINS[status] };
    staticFromToMotion(id, 'markers', animationManager, markerSelections, { opacity: 0 }, { opacity: 1 }, params);
    markerSelections.forEach((s) => s.cleanup());
}

export function markerScaleInAnimation<T>(
    { id }: { id: string },
    animationManager: AnimationManager,
    markerSelections: Selection<Node, T>[]
) {
    staticFromToMotion(
        id,
        'markers',
        animationManager,
        markerSelections,
        { scalingX: 0, scalingY: 0 },
        { scalingX: 1, scalingY: 1 }
    );
    markerSelections.forEach((s) => s.cleanup());
}

export function markerSwipeScaleInAnimation<T extends CartesianSeriesNodeDatum>(
    { id }: { id: string },
    animationManager: AnimationManager,
    markerSelections: Selection<Node, T>[],
    seriesWidth: number
) {
    // Improves consistency with matching parallel animations.
    const tweakFactor = 0.1;

    const fromFn = (_: Node, datum: T) => {
        const x = datum.midPoint?.x ?? seriesWidth;
        // Calculate a delay that depends on the X position of the datum, so that nodes appear
        // gradually from left to right. Use easeInOut to match any parallel swipe animations.
        const delayRatio = easing.easeInOut(x / seriesWidth) - tweakFactor;
        const delay = Math.max(Math.min(delayRatio, 1), 0);
        return { scalingX: 0, scalingY: 0, animationDelay: delay, animationDuration: QUICK_TRANSITION };
    };
    const toFn = () => {
        return { scalingX: 1, scalingY: 1 };
    };

    fromToMotion(id, 'markers', animationManager, markerSelections, { fromFn, toFn });
}

export function resetMarkerFn(_node: NodeWithOpacity & Node) {
    return { opacity: 1, scalingX: 1, scalingY: 1 };
}

export function resetMarkerPositionFn<T extends CartesianSeriesNodeDatum>(_node: Node, datum: T) {
    return {
        translationX: datum.point?.x ?? NaN,
        translationY: datum.point?.y ?? NaN,
    };
}
