import { type Mock, afterEach, describe, expect, it } from 'vitest';

import { type AgChartInstance, AgCharts } from 'ag-charts-community';
import {
    contextMenuAction,
    expectNonBlank,
    getSeriesAt,
    getSeriesNodeData,
    hoverAction,
    hoverLegendItem,
    prepareFinancialTestOptions,
    prepareTestOptions,
    pressKey,
    resetMockConsole,
    setupMockCanvas,
    setupMockConsole,
    setupMockPointerEvent,
    tabIntoChart,
    toMatchImage,
    waitForChartStability,
} from 'ag-charts-community-test';
import { Group, type Point, Text, Transformable, deepClone } from 'ag-charts-core';

import { DEFAULT_CONTEXT_MENU_CLASS } from '../features/context-menu/contextMenuStyles';
import ukRoadTopology from '../series/map-test/ukRoadTopology.json';
import ukTopology from '../series/map-test/ukTopology.json';
import { setupEnterpriseModules } from '../setup';
import { findSceneNodes } from './featureAccessors';
import { prepareEnterpriseTestOptions } from './utils';

setupEnterpriseModules();

type Options = Record<string, any>;
type Factory =
    'create' | 'createFinancialChart' | 'createVolumeProfileChart' | 'createQuadrantChart' | '__createSparkline';

interface KeyPathCase {
    name: string;
    options: Options;
    keys: string[];
    factory?: Factory;
    /** Options only `create` accepts, left out of later updates. */
    createOptions?: Options;
    /** Charts created from the same options; only the first is snapshotted, the others can drive it. */
    chartCount?: number;
    interact?: (charts: AgChartInstance[]) => Promise<void>;
    probe?: (charts: AgChartInstance[]) => unknown;
}

const NESTED = 'nested';
const ABSENT = 'absent';

function getAt(target: Options, path: string): any {
    return path.split('.').reduce((value, part) => value?.[part], target);
}

function setAt(target: Options, path: string, value: unknown) {
    const parts = path.split('.');
    const last = parts.pop()!;
    const parent = parts.length === 0 ? target : getAt(target, parts.join('.'));
    parent[last] = value;
}

// Copies `field` into a `nested` object on every datum, tree nodes included, leaving the flat value in place.
function nestField(value: unknown, field: string): unknown {
    if (Array.isArray(value)) return value.map((item) => nestField(item, field));
    if (value == null || typeof value !== 'object' || value instanceof Date) return value;
    const result: Options = {};
    for (const [key, item] of Object.entries(value)) result[key] = nestField(item, field);
    if (field in result) result[NESTED] = { [field]: result[field] };
    return result;
}

// Nests the field in every `data` along the key path: the chart's, a series' or a preset section's.
function withKey(options: Options, keyPath: string, mode: 'nested' | 'absent'): Options {
    const field: string = getAt(options, keyPath);
    const result = deepClone(options);
    if (mode === 'nested') {
        const parts = keyPath.split('.');
        for (let depth = 0; depth < parts.length; depth++) {
            const host = depth === 0 ? result : getAt(result, parts.slice(0, depth).join('.'));
            if (Array.isArray(host?.data)) host.data = nestField(host.data, field);
            if (Array.isArray(host)) {
                for (const item of host) if (Array.isArray(item?.data)) item.data = nestField(item.data, field);
            }
        }
    }
    setAt(result, keyPath, mode === 'nested' ? `${NESTED}.${field}` : ABSENT);
    return result;
}

// Renames each key's field to a dotted property name, which only a chart with dot notation suppressed reads back.
function withLiteralKeys(options: Options, keyPaths: string[]): Options {
    const result = deepClone(options);
    for (const keyPath of keyPaths) {
        const field: string = getAt(result, keyPath);
        const literal = `${NESTED}.${field}`;
        const rename = (data: Options[]) =>
            data.map(({ [field]: value, ...datum }) => (value === undefined ? datum : { ...datum, [literal]: value }));
        const parts = keyPath.split('.');
        for (let depth = 0; depth < parts.length; depth++) {
            const host = depth === 0 ? result : getAt(result, parts.slice(0, depth).join('.'));
            if (Array.isArray(host?.data)) host.data = rename(host.data);
        }
        setAt(result, keyPath, literal);
    }
    return { ...result, suppressFieldDotNotation: true };
}

const categories = [
    { x: 'A', y: 1, low: 0.5, high: 2 },
    { x: 'B', y: 4, low: 2, high: 5 },
    { x: 'C', y: 2, low: 1, high: 3 },
];

const points = [
    { x: 1, y: 2, size: 3, color: 10, label: 'Point P', xLow: 0.5, xHigh: 1.5 },
    { x: 2, y: 5, size: 8, color: 30, label: 'Point Q', xLow: 1.5, xHigh: 2.5 },
    { x: 4, y: 3, size: 5, color: 20, label: 'Point R', xLow: 3.5, xHigh: 4.5 },
];

const dated = [
    { date: new Date(2024, 0, 1), y: 2 },
    { date: new Date(2024, 0, 9), y: 5 },
    { date: new Date(2024, 1, 3), y: 3 },
];

const prices = [
    { date: new Date(2024, 0, 1), open: 10, high: 14, low: 8, close: 12, volume: 100 },
    { date: new Date(2024, 0, 2), open: 12, high: 15, low: 11, close: 11, volume: 140 },
    { date: new Date(2024, 0, 3), open: 11, high: 13, low: 9, close: 13, volume: 90 },
];

const boxes = [
    { x: 'A', min: 1, q1: 3, median: 5, q3: 7, max: 9 },
    { x: 'B', min: 2, q1: 4, median: 6, q3: 8, max: 10 },
];

const stages = [
    { stage: 'Visit', value: 100 },
    { stage: 'Cart', value: 60 },
    { stage: 'Buy', value: 20 },
];

const slices = [
    { name: 'Alpha', value: 3, radius: 1, sector: 'Sector alpha', legend: 'Legend alpha' },
    { name: 'Beta', value: 5, radius: 3, sector: 'Sector beta', legend: 'Legend beta' },
    { name: 'Gamma', value: 2, radius: 2, sector: 'Sector gamma', legend: 'Legend gamma' },
];

const tree = [
    {
        name: 'Group one',
        secondary: 'First group',
        children: [
            { name: 'Leaf A', secondary: 'Secondary A', size: 5, color: 1 },
            { name: 'Leaf B', secondary: 'Secondary B', size: 2, color: 4 },
        ],
    },
    {
        name: 'Group two',
        secondary: 'Second group',
        children: [{ name: 'Leaf C', secondary: 'Secondary C', size: 3, color: 2 }],
    },
];

const links = [
    { from: 'A', to: 'X', size: 5 },
    { from: 'A', to: 'Y', size: 2 },
    { from: 'B', to: 'X', size: 3 },
];

const people = [
    { id: 'ceo', parent: null, name: 'Alice Chen', job: 'Chief Executive', location: 'London' },
    { id: 'cto', parent: 'ceo', name: 'Bob Smith', job: 'Chief Technology', location: 'Leeds' },
    { id: 'cfo', parent: 'ceo', name: 'Carol Wu', job: 'Chief Financial', location: 'York' },
];

const countries = [
    { name: 'England', population: 56, label: 'England label' },
    { name: 'Scotland', population: 5, label: 'Scotland label' },
    { name: 'Wales', population: 3, label: 'Wales label' },
];

const cities = [
    { name: 'London', lat: 51.5, lon: -0.1, population: 9, label: 'London label' },
    { name: 'Edinburgh', lat: 55.9, lon: -3.2, population: 0.5, label: 'Edinburgh label' },
];

const cartesian = (type: string, data: Options[], series: Options, keys: string[]): KeyPathCase => ({
    name: type,
    options: { data, series: [{ id: 'under-test', type, ...series }] },
    keys: keys.map((key) => `series.0.${key}`),
});

const polar = (type: string, series: Options, keys: string[]): KeyPathCase => cartesian(type, slices, series, keys);

const hoverCentre = async ([target]: AgChartInstance[]) => {
    await hoverAction(400, 300)(target);
    await waitForChartStability(target);
};

const focusSecondItem = async ([target]: AgChartInstance[]) => {
    await tabIntoChart(target);
    await pressKey(target, 'Home');
    await pressKey(target, 'ArrowRight');
};

const tooltipText = () => document.querySelector('.ag-charts-tooltip')?.textContent?.replaceAll(/\s+/g, ' ').trim();

const activeItem = ([target]: AgChartInstance[]) => target.getState().active?.activeItem;

const volumeLevels = [
    { price: 9, up: 30, down: 20 },
    { price: 11, up: 50, down: 10 },
    { price: 13, up: 20, down: 40 },
];

const FINANCIAL_KEYS = {
    dateKey: 'date',
    openKey: 'open',
    highKey: 'high',
    lowKey: 'low',
    closeKey: 'close',
    volumeKey: 'volume',
};

// The price keys each chart type draws; every type also draws the date and volume.
const CHART_TYPE_KEYS: Record<string, string[]> = {
    candlestick: ['openKey', 'highKey', 'lowKey', 'closeKey'],
    'hollow-candlestick': ['openKey', 'highKey', 'lowKey', 'closeKey'],
    ohlc: ['openKey', 'highKey', 'lowKey', 'closeKey'],
    line: ['closeKey'],
    'step-line': ['closeKey'],
    hlc: ['highKey', 'lowKey', 'closeKey'],
    'high-low': ['highKey', 'lowKey'],
};

const statusBarTexts = ([target]: AgChartInstance[]) =>
    findSceneNodes(target, (node): node is Group => node instanceof Group && node.name === 'StatusBar').flatMap(
        (group) =>
            Array.from(group.descendants(), (node) => (node instanceof Text && node.visible ? node.text : undefined))
    );

const SERIES: KeyPathCase[] = [
    cartesian('line', categories, { xKey: 'x', yKey: 'y' }, ['xKey', 'yKey']),
    { ...cartesian('line', points, { xKey: 'x', yKey: 'y' }, ['xKey']), name: 'line with a number x' },
    {
        ...cartesian('line', dated, { xKey: 'date', yKey: 'y' }, ['xKey']),
        name: 'line with a time x',
    },
    cartesian('area', categories, { xKey: 'x', yKey: 'y' }, ['xKey', 'yKey']),
    cartesian('bar', categories, { xKey: 'x', yKey: 'y' }, ['xKey', 'yKey']),
    {
        ...cartesian(
            'scatter',
            points,
            { xKey: 'x', yKey: 'y', labelKey: 'label', colorKey: 'color', label: { enabled: true } },
            ['xKey', 'yKey', 'labelKey', 'colorKey']
        ),
    },
    {
        ...cartesian(
            'bubble',
            points,
            { xKey: 'x', yKey: 'y', sizeKey: 'size', labelKey: 'label', colorKey: 'color', label: { enabled: true } },
            ['xKey', 'yKey', 'sizeKey', 'labelKey', 'colorKey']
        ),
    },
    {
        ...cartesian('histogram', points, { xKey: 'x', yKey: 'y', aggregation: 'sum' }, ['xKey', 'yKey']),
    },
    {
        ...cartesian('heatmap', points, { xKey: 'label', yKey: 'y', colorKey: 'color' }, ['xKey', 'yKey', 'colorKey']),
    },
    cartesian('waterfall', categories, { xKey: 'x', yKey: 'y' }, ['xKey', 'yKey']),
    {
        ...cartesian(
            'waterfall',
            categories,
            { xKey: 'x', yKey: 'y', totals: [{ totalType: 'total', index: 2, axisLabel: 'Total' }] },
            ['xKey']
        ),
        name: 'waterfall with a total',
    },
    {
        ...cartesian('range-bar', categories, { xKey: 'x', yLowKey: 'low', yHighKey: 'high' }, [
            'xKey',
            'yLowKey',
            'yHighKey',
        ]),
    },
    {
        ...cartesian('range-area', categories, { xKey: 'x', yLowKey: 'low', yHighKey: 'high' }, [
            'xKey',
            'yLowKey',
            'yHighKey',
        ]),
    },
    {
        ...cartesian(
            'box-plot',
            boxes,
            { xKey: 'x', minKey: 'min', q1Key: 'q1', medianKey: 'median', q3Key: 'q3', maxKey: 'max' },
            ['xKey', 'minKey', 'q1Key', 'medianKey', 'q3Key', 'maxKey']
        ),
    },
    {
        ...cartesian(
            'candlestick',
            prices,
            { xKey: 'date', openKey: 'open', highKey: 'high', lowKey: 'low', closeKey: 'close' },
            ['xKey', 'openKey', 'highKey', 'lowKey', 'closeKey']
        ),
    },
    {
        ...cartesian(
            'ohlc',
            prices,
            { xKey: 'date', openKey: 'open', highKey: 'high', lowKey: 'low', closeKey: 'close' },
            ['xKey', 'openKey', 'highKey', 'lowKey', 'closeKey']
        ),
    },
    {
        ...cartesian('hlc', prices, { xKey: 'date', highKey: 'high', lowKey: 'low', closeKey: 'close' }, [
            'xKey',
            'highKey',
            'lowKey',
            'closeKey',
        ]),
    },
    {
        ...cartesian('bar', categories, { xKey: 'x', yKey: 'y', errorBar: { yLowerKey: 'low', yUpperKey: 'high' } }, [
            'errorBar.yLowerKey',
            'errorBar.yUpperKey',
        ]),
        name: 'bar error bars',
    },
    {
        ...cartesian('scatter', points, { xKey: 'x', yKey: 'y', errorBar: { xLowerKey: 'xLow', xUpperKey: 'xHigh' } }, [
            'errorBar.xLowerKey',
            'errorBar.xUpperKey',
        ]),
        name: 'scatter error bars',
    },
    cartesian('funnel', stages, { stageKey: 'stage', valueKey: 'value' }, ['stageKey', 'valueKey']),
    cartesian('cone-funnel', stages, { stageKey: 'stage', valueKey: 'value' }, ['stageKey', 'valueKey']),
    cartesian('pyramid', stages, { stageKey: 'stage', valueKey: 'value' }, ['stageKey', 'valueKey']),
    ...(['pie', 'donut'] as const).map((type) =>
        polar(
            type,
            {
                innerRadiusRatio: type === 'donut' ? 0.3 : undefined,
                angleKey: 'value',
                radiusKey: 'radius',
                calloutLabelKey: 'name',
                sectorLabelKey: 'sector',
                legendItemKey: 'legend',
            },
            ['angleKey', 'radiusKey', 'calloutLabelKey', 'sectorLabelKey', 'legendItemKey']
        )
    ),
    polar('radar-line', { angleKey: 'name', radiusKey: 'value' }, ['angleKey', 'radiusKey']),
    polar('radar-area', { angleKey: 'name', radiusKey: 'value' }, ['angleKey', 'radiusKey']),
    polar('nightingale', { angleKey: 'name', radiusKey: 'value' }, ['angleKey', 'radiusKey']),
    polar('radial-bar', { angleKey: 'value', radiusKey: 'name' }, ['angleKey', 'radiusKey']),
    polar('radial-column', { angleKey: 'name', radiusKey: 'value' }, ['angleKey', 'radiusKey']),
    ...(['treemap', 'sunburst'] as const).map((type): KeyPathCase => ({
        ...cartesian(
            type,
            tree,
            {
                labelKey: 'name',
                secondaryLabelKey: 'secondary',
                childrenKey: 'children',
                sizeKey: 'size',
                colorKey: 'color',
            },
            ['labelKey', 'secondaryLabelKey', 'childrenKey', 'sizeKey', 'colorKey']
        ),
    })),
    cartesian('sankey', links, { fromKey: 'from', toKey: 'to', sizeKey: 'size' }, ['fromKey', 'toKey', 'sizeKey']),
    cartesian('chord', links, { fromKey: 'from', toKey: 'to', sizeKey: 'size' }, ['fromKey', 'toKey', 'sizeKey']),
    cartesian(
        'organization',
        people,
        {
            idKey: 'id',
            parentIdKey: 'parent',
            node: { title: { key: 'name' }, subtitle: { key: 'job' }, labels: [{ key: 'location' }] },
        },
        ['idKey', 'parentIdKey', 'node.title.key', 'node.subtitle.key', 'node.labels.0.key']
    ),
    {
        name: 'map-shape',
        options: {
            topology: ukTopology,
            series: [
                {
                    id: 'under-test',
                    type: 'map-shape',
                    data: countries,
                    idKey: 'name',
                    colorKey: 'population',
                    labelKey: 'label',
                    label: { enabled: true },
                },
            ],
        },
        keys: ['series.0.idKey', 'series.0.colorKey', 'series.0.labelKey'],
    },
    {
        name: 'map-marker',
        options: {
            topology: ukTopology,
            seriesArea: { padding: { top: 60, right: 60, bottom: 60, left: 60 } },
            series: [
                {
                    id: 'under-test',
                    type: 'map-marker',
                    data: cities,
                    latitudeKey: 'lat',
                    longitudeKey: 'lon',
                    sizeKey: 'population',
                    colorKey: 'population',
                    labelKey: 'label',
                    label: { enabled: true },
                },
            ],
        },
        keys: [
            'series.0.latitudeKey',
            'series.0.longitudeKey',
            'series.0.sizeKey',
            'series.0.colorKey',
            'series.0.labelKey',
        ],
    },
    {
        name: 'map-marker by id',
        options: {
            topology: ukTopology,
            series: [{ id: 'under-test', type: 'map-marker', data: countries, idKey: 'name', size: 40 }],
        },
        keys: ['series.0.idKey'],
    },
    {
        name: 'map-line',
        options: {
            topology: ukRoadTopology,
            series: [
                {
                    id: 'under-test',
                    type: 'map-line',
                    data: [
                        { name: 'M1', traffic: 5, label: 'Motorway one' },
                        { name: 'M6', traffic: 9, label: 'Motorway six' },
                    ],
                    idKey: 'name',
                    sizeKey: 'traffic',
                    colorKey: 'traffic',
                    labelKey: 'label',
                    label: { enabled: true },
                },
            ],
        },
        keys: ['series.0.idKey', 'series.0.sizeKey', 'series.0.colorKey', 'series.0.labelKey'],
    },
];

// Keyboard focus opens the default tooltip, so every series also checks the tooltip content its keys produce.
const SERIES_CASES = SERIES.map((keyPathCase): KeyPathCase => ({
    interact: focusSecondItem,
    probe: (charts) => [tooltipText(), activeItem(charts)],
    ...keyPathCase,
}));

const highlight = { highlightedItem: { fill: 'red' }, unhighlightedSeries: { opacity: 0.2 } };

const FEATURE_CASES: KeyPathCase[] = [
    {
        name: 'dataIdKey',
        options: {
            data: categories.map((datum, index) => ({ ...datum, id: `item-${index}` })),
            dataIdKey: 'id',
            series: [{ type: 'bar', id: 'bars', xKey: 'x', yKey: 'y' }],
        },
        keys: ['dataIdKey'],
        interact: async ([target]) => {
            await target.setState({
                version: target.getState().version,
                active: { activeItem: { type: 'series-node', seriesId: 'bars', itemId: 'item-1' } },
            });
            await waitForChartStability(target);
        },
        probe: ([target]) => target.getState().active,
    },
    {
        name: 'dataIdKey on a focused bar',
        options: {
            data: categories.map((datum, index) => ({ ...datum, id: `item-${index}` })),
            dataIdKey: 'id',
            series: [{ type: 'bar', id: 'bars', xKey: 'x', yKey: 'y' }],
        },
        keys: ['dataIdKey'],
        interact: focusSecondItem,
        probe: activeItem,
    },
    {
        name: 'dataIdKey on a sankey link',
        options: {
            data: links.map((datum, index) => ({ ...datum, id: `flow-${index}` })),
            dataIdKey: 'id',
            series: [{ type: 'sankey', id: 'flows', fromKey: 'from', toKey: 'to', sizeKey: 'size' }],
        },
        keys: ['dataIdKey'],
        interact: async ([target]) => {
            await target.setState({
                version: target.getState().version,
                active: { activeItem: { type: 'series-node', seriesId: 'flows', itemId: 'flow-1' } },
            });
            await waitForChartStability(target);
        },
        probe: ([target]) => target.getState().active,
    },
    {
        name: 'donuts sharing legend items',
        options: {
            data: slices,
            legend: { enabled: true },
            series: [
                { type: 'donut', angleKey: 'value', legendItemKey: 'legend', innerRadiusRatio: 0.7, highlight },
                {
                    type: 'donut',
                    angleKey: 'value',
                    legendItemKey: 'legend',
                    innerRadiusRatio: 0.3,
                    outerRadiusRatio: 0.6,
                    highlight,
                },
            ],
        },
        keys: ['series.0.legendItemKey'],
        interact: async ([target]) => {
            await hoverAction(0, 0)(target);
            await hoverLegendItem(target, 0);
            await waitForChartStability(target);
        },
    },
    {
        name: 'key names in the legend',
        options: {
            data: categories,
            legend: { enabled: true },
            series: [
                { type: 'bar', xKey: 'x', yKey: 'y' },
                { type: 'line', xKey: 'x', yKey: 'high' },
            ],
        },
        keys: ['series.0.yKey', 'series.1.yKey'],
    },
    {
        name: 'crosshair on a category axis',
        options: {
            data: categories,
            series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
            axes: {
                x: { type: 'category', position: 'bottom', crosshair: { enabled: true } },
                y: { type: 'number', position: 'left' },
            },
        },
        keys: ['series.0.xKey'],
        interact: hoverCentre,
        probe: () =>
            Array.from(
                document.querySelectorAll('.ag-charts-crosshair-label:not(.ag-charts-crosshair-label--hidden)'),
                (label) => label.textContent?.trim()
            ),
    },
    {
        name: 'synced node interaction',
        options: {
            data: categories,
            series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
            sync: { groupId: 'datum-key-paths', axes: 'x', nodeInteraction: true },
        },
        keys: ['series.0.xKey'],
        chartCount: 2,
        interact: async ([receiver, sender]) => {
            await hoverCentre([sender]);
            await waitForChartStability(receiver);
        },
    },
    {
        name: 'sparkline tooltip',
        factory: '__createSparkline',
        options: { data: categories, type: 'bar', xKey: 'x', yKey: 'y' },
        createOptions: { pool: false },
        keys: ['xKey', 'yKey'],
        interact: hoverCentre,
        probe: () => document.querySelector('.ag-charts-tooltip')?.textContent,
    },
    {
        name: 'quadrant chart',
        factory: 'createQuadrantChart',
        options: { data: points, xKey: 'x', yKey: 'y', sizeKey: 'size' },
        keys: ['xKey', 'yKey', 'sizeKey'],
    },
    {
        name: 'quadrant chart context menu region',
        factory: 'createQuadrantChart',
        options: {
            data: [
                { x: -3, y: 2 },
                { x: 3, y: -2 },
            ],
            xKey: 'x',
            yKey: 'y',
            contextMenu: { enabled: true, getItems: ({ region }: { region?: string }) => [{ label: `${region}` }] },
        },
        keys: ['xKey', 'yKey'],
        interact: async ([target]) => {
            const [node] = getSeriesNodeData<{ point: Point }>(target);
            if (node == null) return;
            const { canvasX, canvasY } = Transformable.toCanvasPoint(
                getSeriesAt(target).contentGroup,
                node.point.x,
                node.point.y
            );
            await contextMenuAction(canvasX, canvasY)(target);
            await waitForChartStability(target);
        },
        probe: () => document.querySelector(`.${DEFAULT_CONTEXT_MENU_CLASS}`)?.textContent?.trim(),
    },
    ...Object.entries(CHART_TYPE_KEYS).map(([chartType, priceKeys]): KeyPathCase => ({
        name: `financial ${chartType} chart`,
        factory: 'createFinancialChart',
        options: { data: prices, chartType, ...FINANCIAL_KEYS },
        keys: ['dateKey', ...priceKeys, 'volumeKey'],
    })),
    {
        name: 'financial chart status bar',
        factory: 'createFinancialChart',
        options: { data: prices, ...FINANCIAL_KEYS },
        keys: Object.keys(FINANCIAL_KEYS),
        interact: hoverCentre,
        probe: statusBarTexts,
    },
    {
        name: 'financial chart navigator',
        factory: 'createFinancialChart',
        options: { data: prices, volume: false, navigator: true, ...FINANCIAL_KEYS },
        keys: ['dateKey', 'openKey', 'highKey', 'lowKey', 'closeKey'],
    },
    {
        name: 'financial chart volume profile',
        factory: 'createFinancialChart',
        options: {
            data: prices,
            ...FINANCIAL_KEYS,
            volumeProfile: { enabled: true, data: volumeLevels, priceKey: 'price', upKey: 'up', downKey: 'down' },
        },
        keys: ['volumeProfile.priceKey', 'volumeProfile.upKey', 'volumeProfile.downKey'],
    },
    {
        name: 'volume profile chart',
        factory: 'createVolumeProfileChart',
        options: {
            data: volumeLevels,
            priceKey: 'price',
            upKey: 'up',
            downKey: 'down',
            totalSegment: { enabled: true },
        },
        keys: ['priceKey', 'upKey', 'downKey'],
    },
];

describe('datum key paths', () => {
    const ctx = setupMockCanvas();
    setupMockConsole();
    setupMockPointerEvent();

    let charts: AgChartInstance[] = [];
    afterEach(() => {
        for (const chart of charts) chart.destroy();
        charts = [];
        resetMockConsole();
    });

    function prepare(options: Options, factory: Factory) {
        const copy = deepClone(options);
        if (factory === 'createFinancialChart' || factory === 'createVolumeProfileChart')
            return prepareFinancialTestOptions(copy);
        if (factory === '__createSparkline') return prepareTestOptions(copy);
        return prepareEnterpriseTestOptions(copy);
    }

    interface Render {
        image: ImageData;
        probe: unknown;
        warnings: unknown[][];
    }

    function same(a: Render, b: Render) {
        const images = toMatchImage.call(expect.getState(), a.image, b.image, { writeDiff: false });
        return images.pass && JSON.stringify(a.probe) === JSON.stringify(b.probe);
    }

    // Bespoke: one set of charts per test, updated through each variant, as the mock canvas only snapshots the first.
    async function render(keyPathCase: KeyPathCase, variant: Options): Promise<Render> {
        const { factory = 'create', createOptions, chartCount = 1, interact, probe } = keyPathCase;
        if (charts.length === 0) {
            for (let i = 0; i < chartCount; i++)
                charts.push((AgCharts as any)[factory](prepare({ ...variant, ...createOptions }, factory)));
        } else {
            await Promise.all(charts.map((chart) => chart.update(prepare(variant, factory))));
        }
        await Promise.all(charts.map((chart) => waitForChartStability(chart)));
        await interact?.(charts);
        await Promise.all(charts.map((chart) => waitForChartStability(chart)));
        const warnings = [...(console.warn as Mock).mock.calls];
        resetMockConsole();
        const probed = probe?.(charts);
        return { image: ctx.snapshot(), probe: probed, warnings };
    }

    // Renders are shared by a key's two tests, so a dot path is only compared with a render the chart was shown to use.
    const renders = new Map<string, Promise<Record<'absent' | 'nested' | 'flat' | 'flatAgain', Render>>>();
    function renderKey(keyPathCase: KeyPathCase, keyPath: string) {
        const id = `${keyPathCase.name}:${keyPath}`;
        if (!renders.has(id)) renders.set(id, renderVariants(keyPathCase, keyPath));
        return renders.get(id)!;
    }

    async function renderVariants(keyPathCase: KeyPathCase, keyPath: string) {
        const { options, interact } = keyPathCase;
        // Absent first, so text a dot path fails to resolve cannot be left over from a flat render.
        const absentOptions = withKey(options, keyPath, 'absent');
        if (interact != null) await render(keyPathCase, absentOptions);
        const absent = await render(keyPathCase, absentOptions);
        const nested = await render(keyPathCase, withKey(options, keyPath, 'nested'));
        const flat = await render(keyPathCase, options);
        const flatAgain = await render(keyPathCase, options);
        return { absent, nested, flat, flatAgain };
    }

    describe.each([...SERIES_CASES, ...FEATURE_CASES])('$name', (keyPathCase) => {
        const { keys } = keyPathCase;

        it.each(keys)('%s is exercised by the chart', async (keyPath) => {
            const { absent, flat, flatAgain } = await renderKey(keyPathCase, keyPath);
            expectNonBlank(flat.image);
            expect(flat.warnings).toEqual([]);
            expect(same(absent, flat), 'the key must affect the chart').toBe(false);
            expect(same(flatAgain, flat), 'the chart must render the same options the same way').toBe(true);
        });

        it.each(keys)('%s accepts a dot path', async (keyPath) => {
            const { nested, flat } = await renderKey(keyPathCase, keyPath);
            renders.delete(`${keyPathCase.name}:${keyPath}`);
            expect(nested.warnings).toEqual([]);
            expect(same(nested, flat), 'a dot path must render as the flat key does').toBe(true);
        });
    });

    const SUPPRESSED_CASES: KeyPathCase[] = [
        {
            name: 'bar with error bars',
            options: {
                data: categories,
                series: [{ type: 'bar', xKey: 'x', yKey: 'y', errorBar: { yLowerKey: 'low', yUpperKey: 'high' } }],
            },
            keys: ['series.0.yKey', 'series.0.errorBar.yLowerKey', 'series.0.errorBar.yUpperKey'],
        },
        ...FEATURE_CASES.filter(({ factory = 'create' }) => factory !== 'create'),
    ];

    it.each(SUPPRESSED_CASES)(
        '$name reads literal dotted keys when dot notation is suppressed',
        async (keyPathCase) => {
            // Suppressed first, so text a literal key fails to resolve cannot be left over from a flat render.
            const suppressed = await render(keyPathCase, withLiteralKeys(keyPathCase.options, keyPathCase.keys));
            const flat = await render(keyPathCase, keyPathCase.options);

            expectNonBlank(flat.image);
            expect(suppressed.warnings).toEqual([]);
            expect(same(suppressed, flat), 'a literal key must render as the flat key does').toBe(true);
        }
    );
});
