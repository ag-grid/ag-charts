import { type CartesianAxisDirection, isImageFill, isPatternFill, isPublicGradientFill, pick } from 'ag-charts-core';
import type {
    AgBubbleSeriesOptions,
    AgCartesianChartOptions,
    AgNumberAxisOptions,
    AgQuadrantChartOptions,
    AgScatterSeriesItemStylerParams,
    AgScatterSeriesOptions,
    AgSeriesAreaBackgroundRegion,
    AgSeriesMarkerStyle,
    ContextDefault,
    DatumDefault,
} from 'ag-charts-types';

type Region = keyof NonNullable<AgQuadrantChartOptions['regions']>;

export function createScatterQuadrant(
    options: AgQuadrantChartOptions
): AgCartesianChartOptions<DatumDefault, ContextDefault> {
    const { alignAxesToPivot = true, pivot, regions, xAxis, yAxis, context } = options;

    const chartOptions = pick(options, [
        'animation',
        'container',
        'contextMenu',
        'data',
        'dataIdKey',
        'dataSource',
        'enableRtl',
        'footnote',
        'formatter',
        'height',
        'initialState',
        'listeners',
        'locale',
        'minHeight',
        'minWidth',
        'padding',
        'selection',
        'subtitle',
        'title',
        'theme',
        'width',
    ]);

    const pointSeriesKeys = [
        'cursor',
        'errorBar',
        'fill',
        'fillOpacity',
        'highlight',
        'itemStyler',
        'lineDash',
        'lineDashOffset',
        'label',
        'labelName',
        'labelKey',
        'legendItemName',
        'maxRenderedItems',
        'nodeClickRange',
        'styler',
        'showInLegend',
        'shape',
        'stroke',
        'strokeOpacity',
        'strokeWidth',
        'tooltip',
        'xName',
        'xKey',
        'yName',
        'yKey',
    ] as const;

    const scatterSeriesKeys = [...pointSeriesKeys, 'size'] as const;

    const bubbleSeriesKeys = [...pointSeriesKeys, 'maxSize', 'minSize', 'sizeKey'] as const;

    const pivotX = pivot?.x ?? 0;
    const pivotY = pivot?.y ?? 0;

    const { marker: topLeftMarker, ...topLeft } = regions?.topLeft ?? {};
    const { marker: topRightMarker, ...topRight } = regions?.topRight ?? {};
    const { marker: bottomLeftMarker, ...bottomLeft } = regions?.bottomLeft ?? {};
    const { marker: bottomRightMarker, ...bottomRight } = regions?.bottomRight ?? {};

    const backgroundRegions: Record<Region, AgSeriesAreaBackgroundRegion> = {
        topLeft: {
            fill: { ref: 'foregroundColor', onto: 'backgroundColor', mix: 1 },
            fillOpacity: 0.3,
            ...topLeft,
            label: { position: 'inside', ...topLeft.label },
            xRange: { axis: 'x', end: pivotX },
            yRange: { axis: 'y', start: pivotY },
        },
        topRight: {
            fill: { ref: 'foregroundColor', onto: 'backgroundColor', mix: 0.8 },
            fillOpacity: 0.3,
            ...topRight,
            label: { position: 'inside', ...topRight.label },
            xRange: { axis: 'x', start: pivotX },
            yRange: { axis: 'y', start: pivotY },
        },
        bottomLeft: {
            fill: { ref: 'foregroundColor', onto: 'backgroundColor', mix: 0.4 },
            fillOpacity: 0.3,
            ...bottomLeft,
            label: { position: 'inside', ...bottomLeft.label },
            xRange: { axis: 'x', end: pivotX },
            yRange: { axis: 'y', end: pivotY },
        },
        bottomRight: {
            fill: { ref: 'foregroundColor', onto: 'backgroundColor', mix: 0.6 },
            fillOpacity: 0.3,
            ...bottomRight,
            label: { position: 'inside', ...bottomRight.label },
            xRange: { axis: 'x', start: pivotX },
            yRange: { axis: 'y', end: pivotY },
        },
    };

    const composedItemStyler = (params: AgScatterSeriesItemStylerParams): AgSeriesMarkerStyle => {
        const xValue = params.datum[params.xKey];
        const yValue = params.datum[params.yKey];

        let regionKey: Region = 'bottomLeft';
        let regionName: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'bottom-left';
        let defaultMarker = bottomLeftMarker;
        if (xValue > pivotX && yValue > pivotY) {
            regionKey = 'topRight';
            regionName = 'top-right';
            defaultMarker = topRightMarker;
        } else if (xValue > pivotX) {
            regionKey = 'bottomRight';
            regionName = 'bottom-right';
            defaultMarker = bottomRightMarker;
        } else if (yValue > pivotY) {
            regionKey = 'topLeft';
            regionName = 'top-left';
            defaultMarker = topLeftMarker;
        }

        const fill = backgroundRegions[regionKey].fill;
        const stroke =
            backgroundRegions[regionKey].stroke ??
            (isPublicGradientFill(fill) || isPatternFill(fill) || isImageFill(fill) ? undefined : fill);

        let result: AgSeriesMarkerStyle = {
            fill,
            fillOpacity: 1,
            stroke,
            strokeOpacity: backgroundRegions[regionKey].strokeOpacity,
            ...defaultMarker,
        };

        if (options.itemStyler) {
            result = options.itemStyler({ ...params, ...result, region: regionName }) ?? result;
        }

        return result;
    };

    const series: (AgScatterSeriesOptions | AgBubbleSeriesOptions)[] = [];

    if (options.sizeKey == null) {
        series.push({
            ...pick(options, scatterSeriesKeys),
            type: 'scatter',
            context,
            itemStyler: composedItemStyler,
        });
    } else {
        series.push({
            minSize: options.size, // Default minSize to size
            ...pick(options, bubbleSeriesKeys),
            sizeKey: options.sizeKey, // Tell typescript that sizeKey is not undefined
            type: 'bubble',
            context,
            itemStyler: composedItemStyler,
        });
    }

    const axes: Record<CartesianAxisDirection, AgNumberAxisOptions> = {
        x: {
            ...xAxis,
            type: 'number',
            position: 'bottom',
            context,
            label: { enabled: false, ...xAxis?.label },
            line: { width: 2, ...xAxis?.line },
            tick: { enabled: false, ...xAxis?.tick },
        },
        y: {
            ...yAxis,
            type: 'number',
            position: 'left',
            context,
            label: { enabled: false, ...yAxis?.label },
            line: { width: 2, ...yAxis?.line },
            tick: { enabled: false, ...yAxis?.tick },
        },
    };

    if (alignAxesToPivot) {
        // TODO: bigint on crossAt
        axes.x.crossAt = { value: Number(pivotY), titlePlacement: 'edge', labelsPlacement: 'crossing' };
        axes.y.crossAt = { value: Number(pivotX), titlePlacement: 'edge', labelsPlacement: 'crossing' };
    }

    return {
        ...chartOptions,
        axes,
        context,
        series,
        seriesArea: {
            backgroundRegions: Object.values(backgroundRegions),
        },
    };
}
