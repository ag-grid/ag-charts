import { type CartesianAxisDirection, Logger, mergeDefaults, pick } from 'ag-charts-core';
import type {
    AgBubbleSeriesOptions,
    AgCartesianChartOptions,
    AgChartCallbackParams,
    AgChartLabelFormatterParams,
    AgChartLabelStylerParams,
    AgNumberAxisOptions,
    AgNumericValue,
    AgQuadrantChartOptions,
    AgQuadrantRegionLabelOptions,
    AgQuadrantRegionLabelPosition,
    AgQuadrantRegionsLabelOptions,
    AgScatterSeriesItemStylerParams,
    AgScatterSeriesLabelFormatterParams,
    AgScatterSeriesOptions,
    AgScatterSeriesOptionsKeys,
    AgScatterSeriesTooltipRendererParams,
    AgSeriesAreaBackgroundRegion,
    AgSeriesAreaBackgroundRegionLabel,
    AgSeriesAreaBackgroundRegionLabelPosition,
    AgSeriesMarkerStyle,
    ContextDefault,
    DatumDefault,
} from 'ag-charts-types';

type Region = keyof Omit<NonNullable<AgQuadrantChartOptions['regions']>, 'label'>;

const DEFAULT_LABEL_POSITION: AgQuadrantRegionLabelPosition = 'inside-outer-outer';
const DEFAULT_LABEL_SPACING = 10;

interface LabelDirection {
    x: -1 | 0 | 1;
    y: -1 | 0 | 1;
}

const REGION_DIRECTIONS: Record<Region, { x: -1 | 1; y: -1 | 1 }> = {
    topLeft: { x: -1, y: -1 },
    topRight: { x: 1, y: -1 },
    bottomLeft: { x: -1, y: 1 },
    bottomRight: { x: 1, y: 1 },
};

// Multipliers of the region's outward direction, so that spacing moves a label away from the edges its
// position aligns it to.
const LABEL_SPACING_DIRECTIONS: Record<AgQuadrantRegionLabelPosition, LabelDirection> = {
    'outside-outer': { x: -1, y: 1 },
    'outside-center': { x: 0, y: 1 },
    'outside-inner': { x: 1, y: 1 },
    'inside-outer-outer': { x: -1, y: -1 },
    'inside-outer-center': { x: 0, y: -1 },
    'inside-outer-inner': { x: 1, y: -1 },
    'inside-center-outer': { x: -1, y: 0 },
    'inside-center': { x: 0, y: 0 },
    'inside-center-inner': { x: 1, y: 0 },
    'inside-inner-outer': { x: -1, y: 1 },
    'inside-inner-center': { x: 0, y: 1 },
    'inside-inner-inner': { x: 1, y: 1 },
};

const LABEL_POSITIONS: Record<
    AgQuadrantRegionLabelPosition,
    Record<Region, AgSeriesAreaBackgroundRegionLabelPosition>
> = {
    'outside-outer': {
        topLeft: 'top-left-above',
        topRight: 'top-right-above',
        bottomLeft: 'bottom-left-below',
        bottomRight: 'bottom-right-below',
    },
    'outside-center': { topLeft: 'top', topRight: 'top', bottomLeft: 'bottom', bottomRight: 'bottom' },
    'outside-inner': {
        topLeft: 'top-right-above',
        topRight: 'top-left-above',
        bottomLeft: 'bottom-right-below',
        bottomRight: 'bottom-left-below',
    },
    'inside-outer-outer': {
        topLeft: 'inside-top-left',
        topRight: 'inside-top-right',
        bottomLeft: 'inside-bottom-left',
        bottomRight: 'inside-bottom-right',
    },
    'inside-outer-center': {
        topLeft: 'inside-top',
        topRight: 'inside-top',
        bottomLeft: 'inside-bottom',
        bottomRight: 'inside-bottom',
    },
    'inside-outer-inner': {
        topLeft: 'inside-top-right',
        topRight: 'inside-top-left',
        bottomLeft: 'inside-bottom-right',
        bottomRight: 'inside-bottom-left',
    },
    'inside-center-outer': {
        topLeft: 'inside-left',
        topRight: 'inside-right',
        bottomLeft: 'inside-left',
        bottomRight: 'inside-right',
    },
    'inside-center': { topLeft: 'inside', topRight: 'inside', bottomLeft: 'inside', bottomRight: 'inside' },
    'inside-center-inner': {
        topLeft: 'inside-right',
        topRight: 'inside-left',
        bottomLeft: 'inside-right',
        bottomRight: 'inside-left',
    },
    'inside-inner-outer': {
        topLeft: 'inside-bottom-left',
        topRight: 'inside-bottom-right',
        bottomLeft: 'inside-top-left',
        bottomRight: 'inside-top-right',
    },
    'inside-inner-center': {
        topLeft: 'inside-bottom',
        topRight: 'inside-bottom',
        bottomLeft: 'inside-top',
        bottomRight: 'inside-top',
    },
    'inside-inner-inner': {
        topLeft: 'inside-bottom-right',
        topRight: 'inside-bottom-left',
        bottomLeft: 'inside-top-right',
        bottomRight: 'inside-top-left',
    },
};

function labelOffset(spacing: number, direction: -1 | 0 | 1, outward: -1 | 1) {
    return direction === 0 ? 0 : spacing * direction * outward;
}

function createRegionLabel(
    region: Region,
    shared: AgQuadrantRegionsLabelOptions | undefined,
    label: AgQuadrantRegionLabelOptions | undefined
): AgSeriesAreaBackgroundRegionLabel {
    const position = label?.position ?? shared?.position ?? DEFAULT_LABEL_POSITION;
    const { spacing = DEFAULT_LABEL_SPACING, ...style } = mergeDefaults(label, shared) ?? {};
    const outward = REGION_DIRECTIONS[region];
    const direction = LABEL_SPACING_DIRECTIONS[position];

    return {
        ...style,
        position: LABEL_POSITIONS[position][region],
        xOffset: labelOffset(spacing, direction.x, outward.x),
        yOffset: labelOffset(spacing, direction.y, outward.y),
    };
}

function getRegionMeta(
    params: AgChartCallbackParams<any, any> & AgScatterSeriesOptionsKeys,
    pivotX: AgNumericValue,
    pivotY: AgNumericValue
) {
    const xValue = params.datum[params.xKey];
    const yValue = params.datum[params.yKey];

    let regionName: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'bottom-left';
    let index = 2;
    if (xValue > pivotX && yValue > pivotY) {
        regionName = 'top-right';
        index = 1;
    } else if (xValue > pivotX) {
        regionName = 'bottom-right';
        index = 3;
    } else if (yValue > pivotY) {
        regionName = 'top-left';
        index = 0;
    }

    return { regionName, index };
}

export function createQuadrant(
    options: AgQuadrantChartOptions,
    _: any,
    __: any,
    ___: any,
    logger: Logger,
    getOptionsGraph: () => any
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
        'maxRenderedItems',
        'nodeClickRange',
        'styler',
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
            ...topLeft,
            label: createRegionLabel('topLeft', regions?.label, topLeft.label),
            xRange: { axis: 'x', end: pivotX },
            yRange: { axis: 'y', start: pivotY },
        },
        topRight: {
            ...topRight,
            label: createRegionLabel('topRight', regions?.label, topRight.label),
            xRange: { axis: 'x', start: pivotX },
            yRange: { axis: 'y', start: pivotY },
        },
        bottomLeft: {
            ...bottomLeft,
            label: createRegionLabel('bottomLeft', regions?.label, bottomLeft.label),
            xRange: { axis: 'x', end: pivotX },
            yRange: { axis: 'y', end: pivotY },
        },
        bottomRight: {
            ...bottomRight,
            label: createRegionLabel('bottomRight', regions?.label, bottomRight.label),
            xRange: { axis: 'x', start: pivotX },
            yRange: { axis: 'y', end: pivotY },
        },
    };

    const composedItemStyler = (params: AgScatterSeriesItemStylerParams): AgSeriesMarkerStyle => {
        const { regionName, index } = getRegionMeta(params, pivotX, pivotY);

        let defaultMarker = bottomLeftMarker;
        if (regionName === 'top-right') {
            defaultMarker = topRightMarker;
        } else if (regionName === 'bottom-right') {
            defaultMarker = bottomRightMarker;
        } else if (regionName === 'top-left') {
            defaultMarker = topLeftMarker;
        }

        // Get the default marker style, without the fill or stroke so we can retrieve them from the region.
        let defaultStyle: AgSeriesMarkerStyle = pick(params, [
            'fillOpacity',
            'lineDash',
            'lineDashOffset',
            'shape',
            'size',
            'strokeOpacity',
            'strokeWidth',
        ]);

        defaultStyle = {
            ...defaultStyle,
            ...defaultMarker,
        };

        // Resolve against the background region since we derive the marker style from the region.
        const resolvedRegionStyle = getOptionsGraph().resolvePartial(
            logger,
            ['seriesArea', 'backgroundRegions', `${index}`],
            defaultStyle,
            { pick: false }
        );

        let result: AgSeriesMarkerStyle = {
            ...pick(resolvedRegionStyle, [
                'fillOpacity',
                'lineDash',
                'lineDashOffset',
                'shape',
                'size',
                'strokeOpacity',
                'strokeWidth',
            ]),
            stroke: defaultMarker?.stroke ?? params.stroke ?? resolvedRegionStyle.stroke,
            fill: defaultMarker?.fill ?? params.fill ?? resolvedRegionStyle.fill,
        };

        // Compose the user's itemStyler within the region's itemStyler.
        if (options.itemStyler) {
            result = { ...result, ...options.itemStyler({ ...params, ...result, region: regionName }) };
        }

        return result;
    };

    const composedTooltipRenderer = (params: AgScatterSeriesTooltipRendererParams) => {
        const { regionName } = getRegionMeta(params, pivotX, pivotY);
        return options.tooltip?.renderer?.({ ...params, region: regionName });
    };

    const composedLabelFormatter = options.label?.formatter
        ? (params: AgChartLabelFormatterParams<any, any> & AgScatterSeriesLabelFormatterParams) => {
              const { regionName } = getRegionMeta(params, pivotX, pivotY);
              return options.label?.formatter?.({ ...params, region: regionName });
          }
        : undefined;

    const composedLabelItemStyler = options.label?.itemStyler
        ? (params: AgChartLabelStylerParams<any, any> & AgScatterSeriesLabelFormatterParams) => {
              const { regionName } = getRegionMeta(params, pivotX, pivotY);
              return options.label?.itemStyler?.({ ...params, region: regionName });
          }
        : undefined;

    const labelEnabled = options.label?.enabled ?? Boolean(options.labelKey);

    const series: (AgScatterSeriesOptions | AgBubbleSeriesOptions)[] = [];

    if (options.sizeKey == null) {
        series.push({
            ...pick(options, scatterSeriesKeys),
            type: 'scatter',
            context,
            itemStyler: composedItemStyler,
            tooltip: {
                ...options.tooltip,
                renderer: composedTooltipRenderer,
            },
            label: {
                ...options.label,
                enabled: labelEnabled,
                formatter: composedLabelFormatter,
                itemStyler: composedLabelItemStyler,
            },
        });
    } else {
        series.push({
            minSize: options.size, // Default minSize to size
            ...pick(options, bubbleSeriesKeys),
            sizeKey: options.sizeKey, // Tell typescript that sizeKey is not undefined
            type: 'bubble',
            context,
            itemStyler: composedItemStyler,
            tooltip: {
                ...options.tooltip,
                renderer: composedTooltipRenderer,
            },
            label: {
                ...options.label,
                enabled: labelEnabled,
                formatter: composedLabelFormatter,
                itemStyler: composedLabelItemStyler,
            },
        });
    }

    const axes: Record<CartesianAxisDirection, AgNumberAxisOptions> = {
        x: {
            ...xAxis,
            type: 'number',
            position: 'bottom',
            context,
        },
        y: {
            ...yAxis,
            type: 'number',
            position: 'left',
            context,
        },
    };

    if (alignAxesToPivot) {
        const placement = {
            titlePlacement: options.axisPlacement?.title ?? 'edge',
            labelPlacement: options.axisPlacement?.label ?? 'edge',
            crosshairLabelPlacement: options.axisPlacement?.crosshairLabel ?? 'edge',
        } as const;
        axes.x.crossAt = { value: pivotY, ...placement };
        axes.y.crossAt = { value: pivotX, ...placement };
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
