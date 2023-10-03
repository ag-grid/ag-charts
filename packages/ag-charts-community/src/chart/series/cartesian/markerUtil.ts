import type { ModuleContext } from '../../../module/moduleContext';
import type {
    AgCartesianSeriesMarkerFormat,
    AgSeriesHighlightMarkerStyle,
    AgSeriesMarkerFormatterParams,
} from '../../../options/agChartOptions';
import type { SizedPoint } from '../../../scene/point';
import type { Marker } from '../../marker/marker';
import type { CartesianSeriesNodeDatum } from './cartesianSeries';

interface NodeDatum extends Omit<CartesianSeriesNodeDatum, 'yKey' | 'yValue'> {
    readonly point: SizedPoint;
}

export type Style = {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    fillOpacity?: number;
    strokeOpacity?: number;
    size?: number;
    visible?: boolean;
};

export type MarkerConfig = Style & {
    point: SizedPoint;
    customMarker: boolean;
    animatedMarker?: boolean;
};

export function getMarkerConfig<ExtraParams extends {}>({
    datum,
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
    markerStyle: Style;
    seriesStyle: Style;
    highlightStyle: AgSeriesHighlightMarkerStyle;
    formatter?: (params: AgSeriesMarkerFormatterParams<NodeDatum> & ExtraParams) => AgCartesianSeriesMarkerFormat;
    seriesId: string;
    ctx: ModuleContext;
} & ExtraParams): Style {
    const fill =
        highlighted && highlightStyle.fill !== undefined ? highlightStyle.fill : markerStyle.fill ?? seriesStyle.fill;
    const fillOpacity =
        highlighted && highlightStyle.fillOpacity !== undefined
            ? highlightStyle.fillOpacity
            : markerStyle.fillOpacity ?? seriesStyle.fillOpacity;
    const stroke =
        highlighted && highlightStyle.stroke !== undefined
            ? highlightStyle.stroke
            : markerStyle.stroke ?? seriesStyle.stroke;
    const strokeWidth =
        highlighted && highlightStyle.strokeWidth !== undefined
            ? highlightStyle.strokeWidth
            : markerStyle.strokeWidth ?? 1;
    const strokeOpacity = markerStyle.strokeOpacity ?? seriesStyle.strokeOpacity;

    let format: AgCartesianSeriesMarkerFormat | undefined;
    if (formatter) {
        format = callbackCache.call(formatter as any, {
            datum: datum.datum,
            fill,
            stroke,
            strokeWidth,
            size: datum.point?.size ?? 0,
            highlighted,
            seriesId,
            ...opts,
        });
    }

    return {
        fill: format?.fill ?? fill,
        stroke: format?.stroke ?? stroke,
        strokeWidth: format?.strokeWidth ?? strokeWidth,
        size: format?.size ?? datum.point?.size ?? markerStyle.size,
        fillOpacity,
        strokeOpacity,
    };
}

export function updateMarker({ node, config }: { node: Marker; config: MarkerConfig }) {
    const {
        point,
        size,
        fill,
        stroke,
        strokeWidth,
        fillOpacity,
        strokeOpacity,
        visible = true,
        customMarker,
        animatedMarker,
    } = config;

    node.fill = fill;
    node.stroke = stroke;
    node.strokeWidth = strokeWidth ?? 1;
    node.fillOpacity = fillOpacity ?? 1;
    node.strokeOpacity = strokeOpacity ?? 1;

    if (!animatedMarker) {
        node.size = size ?? point.size;
        node.translationX = point.x;
        node.translationY = point.y;
    }

    node.visible = node.size > 0 && visible && !isNaN(point.x) && !isNaN(point.y);

    if (!customMarker || node.dirtyPath) {
        return;
    }

    // Only for custom marker shapes
    node.path.clear({ trackChanges: true });
    node.updatePath();
    node.checkPathDirty();
}
