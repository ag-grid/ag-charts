import { type CartesianAxisDirection, Logger, isFiniteNumericValue, pick } from 'ag-charts-core';
import type {
    AgBubbleSeriesOptions,
    AgCartesianChartOptions,
    AgChartCallbackParams,
    AgChartLabelFormatterParams,
    AgChartLabelStylerParams,
    AgContextMenuGetItemsParams,
    AgContextMenuShowOnParams,
    AgCoordinates,
    AgNumberAxisOptions,
    AgNumericValue,
    AgQuadrantChartOptions,
    AgQuadrantRegion,
    AgScatterSeriesItemStylerParams,
    AgScatterSeriesLabelFormatterParams,
    AgScatterSeriesOptions,
    AgScatterSeriesOptionsKeys,
    AgScatterSeriesTooltipRendererParams,
    AgSeriesAreaBackgroundRegion,
    AgSeriesMarkerStyle,
    ContextDefault,
    DatumDefault,
} from 'ag-charts-types';

type Region = keyof NonNullable<AgQuadrantChartOptions['regions']>;

function getRegionMeta(
    params: AgChartCallbackParams<any, any> & AgScatterSeriesOptionsKeys,
    pivotX: AgNumericValue,
    pivotY: AgNumericValue
) {
    return getRegionMetaForValues(params.datum[params.xKey], params.datum[params.yKey], pivotX, pivotY);
}

function getRegionMetaForValues(
    xValue: AgNumericValue,
    yValue: AgNumericValue,
    pivotX: AgNumericValue,
    pivotY: AgNumericValue
) {
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
            xRange: { axis: 'x', end: pivotX },
            yRange: { axis: 'y', start: pivotY },
        },
        topRight: {
            ...topRight,
            xRange: { axis: 'x', start: pivotX },
            yRange: { axis: 'y', start: pivotY },
        },
        bottomLeft: {
            ...bottomLeft,
            xRange: { axis: 'x', end: pivotX },
            yRange: { axis: 'y', end: pivotY },
        },
        bottomRight: {
            ...bottomRight,
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

    const userGetItems = options.contextMenu?.getItems;

    const regionForValues = (xValue: unknown, yValue: unknown): AgQuadrantRegion | undefined => {
        if (!isFiniteNumericValue(xValue) || !isFiniteNumericValue(yValue)) return;
        return getRegionMetaForValues(xValue, yValue, pivotX, pivotY).regionName;
    };

    // Only clicks over the series area fall in a region. A `series-area` scope carries no datum, so its region comes
    // from the click's domain-space coordinates, which live on the root params rather than on the scope entry.
    const regionOfScope = (
        scope: AgContextMenuShowOnParams,
        coordinates: AgCoordinates | undefined
    ): AgQuadrantRegion | undefined => {
        if (scope.showOn === 'series-node') {
            return regionForValues(scope.datum?.[options.xKey], scope.datum?.[options.yKey]);
        }
        if (scope.showOn === 'series-area') {
            return regionForValues(coordinates?.x?.value, coordinates?.y?.value);
        }
    };

    const composedGetItems = userGetItems
        ? (params: AgContextMenuGetItemsParams) => {
              const { coordinates } = params;
              const allShowOnParams = params.allShowOnParams.map((scope) => {
                  if (scope.showOn === 'series-node' || scope.showOn === 'series-area') {
                      return { ...scope, region: regionOfScope(scope, coordinates) };
                  }
                  return scope;
              });

              if (params.showOn === 'series-node' || params.showOn === 'series-area') {
                  return userGetItems({ ...params, allShowOnParams, region: regionOfScope(params, coordinates) });
              }
              return userGetItems({ ...params, allShowOnParams });
          }
        : undefined;

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
            titlePlacement: 'edge',
            labelPlacement: 'crossing',
            crosshairLabelPlacement: 'crossing',
        } as const;
        axes.x.crossAt = { value: pivotY, ...placement };
        axes.y.crossAt = { value: pivotX, ...placement };
    }

    return {
        ...chartOptions,
        ...(composedGetItems && { contextMenu: { ...options.contextMenu, getItems: composedGetItems } }),
        axes,
        context,
        series,
        seriesArea: {
            backgroundRegions: Object.values(backgroundRegions),
        },
    };
}
