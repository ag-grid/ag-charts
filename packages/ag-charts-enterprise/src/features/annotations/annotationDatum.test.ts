import { afterEach, describe, expect, it } from 'vitest';

import { type AgAnnotation, type AgCartesianChartOptions, AgCharts } from 'ag-charts-community';
import {
    clickAction,
    compareImageSnapshot,
    deproxy,
    expectWarningsCalls,
    hoverAction,
    keyDownAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

const X_START = { __type: 'date' as const, value: '2024-03-01' };
const X_MID = { __type: 'date' as const, value: '2024-06-01' };
const X_END = { __type: 'date' as const, value: '2024-09-01' };

// One annotation of every type, using only the fields its option type requires.
const MINIMAL_ANNOTATIONS = {
    line: { type: 'line', start: { x: X_START, y: 30 }, end: { x: X_END, y: 70 } },
    arrow: { type: 'arrow', start: { x: X_START, y: 30 }, end: { x: X_END, y: 70 } },
    'horizontal-line': { type: 'horizontal-line', value: 50 },
    'vertical-line': { type: 'vertical-line', value: X_MID },
    'parallel-channel': {
        type: 'parallel-channel',
        start: { x: X_START, y: 60 },
        end: { x: X_END, y: 80 },
        height: 20,
    },
    'disjoint-channel': {
        type: 'disjoint-channel',
        start: { x: X_START, y: 60 },
        end: { x: X_END, y: 80 },
        startHeight: 20,
        endHeight: 40,
    },
    'fibonacci-retracement': { type: 'fibonacci-retracement', start: { x: X_START, y: 20 }, end: { x: X_END, y: 80 } },
    'fibonacci-retracement-trend-based': {
        type: 'fibonacci-retracement-trend-based',
        start: { x: X_START, y: 20 },
        end: { x: X_MID, y: 80 },
        endRetracement: { x: X_END, y: 50 },
    },
    text: { type: 'text', x: X_MID, y: 50, text: 'Text' },
    comment: { type: 'comment', x: X_MID, y: 50, text: 'Comment' },
    callout: { type: 'callout', start: { x: X_START, y: 30 }, end: { x: X_END, y: 70 }, text: 'Callout' },
    note: { type: 'note', x: X_MID, y: 50, text: 'Note' },
    'arrow-up': { type: 'arrow-up', x: X_MID, y: 50 },
    'arrow-down': { type: 'arrow-down', x: X_MID, y: 50 },
    'date-range': { type: 'date-range', start: { x: X_START, y: 30 }, end: { x: X_END, y: 70 } },
    'price-range': { type: 'price-range', start: { x: X_START, y: 30 }, end: { x: X_END, y: 70 } },
    'date-price-range': { type: 'date-price-range', start: { x: X_START, y: 30 }, end: { x: X_END, y: 70 } },
    'quick-date-price-range': {
        type: 'quick-date-price-range',
        start: { x: X_START, y: 30 },
        end: { x: X_END, y: 70 },
    },
} satisfies Record<string, AgAnnotation>;

type AnnotationTypeName = keyof typeof MINIMAL_ANNOTATIONS;
const ANNOTATION_TYPES = Object.keys(MINIMAL_ANNOTATIONS) as AnnotationTypeName[];

const withArticle = (type: string) => `${/^[aeiou]/.test(type) ? 'an' : 'a'} ${type}`;

// Non-default values for the nested groups each model family owns.
const RICH_ANNOTATIONS = [
    {
        ...MINIMAL_ANNOTATIONS.line,
        stroke: 'red',
        strokeWidth: 4,
        lineDash: [8, 2],
        extendStart: true,
        locked: true,
        handle: { fill: 'blue' },
        text: { label: 'Trend', position: 'bottom', alignment: 'right', color: 'green', fontSize: 18 },
    },
    {
        ...MINIMAL_ANNOTATIONS['horizontal-line'],
        lineStyle: 'dotted',
        axisLabel: { enabled: true, fill: 'orange' },
        text: { label: 'Level', position: 'center' },
    },
    {
        ...MINIMAL_ANNOTATIONS['parallel-channel'],
        extendEnd: true,
        background: { fill: 'pink', fillOpacity: 0.5 },
        middle: { visible: false },
        text: { label: 'Channel', position: 'inside', alignment: 'center' },
    },
    {
        ...MINIMAL_ANNOTATIONS['fibonacci-retracement'],
        bands: 6,
        reverse: true,
        showFill: false,
        isMultiColor: false,
        label: { color: 'purple' },
    },
    { ...MINIMAL_ANNOTATIONS.note, fill: 'yellow', background: { fill: 'black', stroke: 'white' } },
    { ...MINIMAL_ANNOTATIONS.callout, fontSize: 20, fill: 'cyan', visible: false },
    {
        ...MINIMAL_ANNOTATIONS['date-range'],
        extendAbove: true,
        statistics: { color: 'red', divider: { stroke: 'blue' } },
    },
    { ...MINIMAL_ANNOTATIONS['quick-date-price-range'], up: { fill: 'green', statistics: { fill: 'white' } } },
] satisfies AgAnnotation[];

// Dates serialise in normalised ISO form, so compare everything but the positions.
const POSITION_KEYS = new Set(['start', 'end', 'x', 'value']);
const withoutPositions = (annotation: object) =>
    Object.fromEntries(Object.entries(annotation).filter(([key]) => !POSITION_KEYS.has(key)));

describe('Annotation datum lifecycle', () => {
    setupMockConsole();
    let chart: any;
    const ctx = setupMockCanvas();

    const EXAMPLE_OPTIONS: AgCartesianChartOptions = {
        data: [
            { x: new Date('2024-01-05'), y: 5 },
            { x: new Date('2024-06-15'), y: 50 },
            { x: new Date('2024-12-25'), y: 95 },
        ],
        series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }],
        axes: { y: { type: 'number' }, x: { type: 'time' } },
        annotations: { enabled: true, toolbar: { enabled: false } },
    };

    async function prepareChart(annotations: AgAnnotation[], baseOptions = EXAMPLE_OPTIONS) {
        const options: AgCartesianChartOptions = { ...baseOptions, initialState: { annotations } };
        prepareEnterpriseTestOptions(options);
        chart = AgCharts.create(options);
        await waitForChartStability(chart);
    }

    // Canvas position of a data point, read from the axes so the test does not encode layout sizes.
    function toCanvas(x: Date, y: number) {
        const axes = deproxy(chart).axes;
        const xAxis = axes.find((axis: any) => axis.direction === 'x');
        const yAxis = axes.find((axis: any) => axis.direction === 'y');
        expect(xAxis).toBeDefined();
        expect(yAxis).toBeDefined();
        return {
            x: xAxis!.translation.x + xAxis!.scale.convert(x),
            y: yAxis!.translation.y + yAxis!.scale.convert(y),
        };
    }

    async function restore(annotations: object[]) {
        await chart.setState({ ...chart.getState(), annotations });
        await waitForChartStability(chart);
        return ctx.snapshot();
    }

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const compare = async () => {
        await compareImageSnapshot(chart, ctx, { failureThreshold: 0, failureThresholdType: 'percent' });
    };

    describe('serialised state', () => {
        it.each(ANNOTATION_TYPES.map((type) => [withArticle(type), type] as const))(
            'serialises %s annotation created from minimal options',
            async (_name, type) => {
                await prepareChart([MINIMAL_ANNOTATIONS[type]]);
                expect(chart.getState().annotations).toMatchSnapshot();
            }
        );

        it('round-trips every annotation type through chart state unchanged', async () => {
            await prepareChart(Object.values(MINIMAL_ANNOTATIONS));
            const before = chart.getState();
            const image = ctx.snapshot();

            const restored = await restore(before.annotations);

            expect(chart.getState().annotations).toEqual(before.annotations);
            expect(restored).toMatchImage(image);
        });

        it('round-trips non-default options into a new chart unchanged', async () => {
            await prepareChart(RICH_ANNOTATIONS);
            const serialised = chart.getState().annotations;
            expect(serialised).toMatchObject(RICH_ANNOTATIONS.map(withoutPositions));
            chart.destroy();

            await prepareChart(serialised);

            expect(chart.getState().annotations).toEqual(serialised);
        });
    });

    describe('restoring state', () => {
        it('rebuilds the annotations when the restored list has a different shape', async () => {
            await prepareChart([MINIMAL_ANNOTATIONS.line]);
            const lineImage = ctx.snapshot();

            const emptyImage = await restore([]);
            expect(chart.getState().annotations).toEqual([]);
            expect(emptyImage).not.toMatchImage(lineImage, { writeDiff: false });

            const restoredImage = await restore([MINIMAL_ANNOTATIONS.line]);
            expect(restoredImage).toMatchImage(lineImage);
        });

        it('replaces an annotation when the type at its index changes', async () => {
            await prepareChart([MINIMAL_ANNOTATIONS.line]);
            await restore([MINIMAL_ANNOTATIONS.comment]);

            const annotations = chart.getState().annotations as AgAnnotation[];
            expect(annotations).toHaveLength(1);
            expect(annotations[0]).toMatchObject(withoutPositions(MINIMAL_ANNOTATIONS.comment));
            expect(annotations[0]).not.toHaveProperty('start');
            expect(annotations[0]).not.toHaveProperty('end');
        });

        it('patches an annotation in place when the type at its index is unchanged', async () => {
            await prepareChart([{ ...MINIMAL_ANNOTATIONS.line, text: { label: 'Kept' } }]);
            await restore([MINIMAL_ANNOTATIONS.line]);

            const [annotation] = chart.getState().annotations as Array<AgAnnotation & { text?: { label?: string } }>;
            expect(annotation.text?.label).toBe('Kept');
        });

        it('restores state containing an unknown property without warning', async () => {
            await prepareChart([MINIMAL_ANNOTATIONS.line]);
            await restore([{ ...MINIMAL_ANNOTATIONS.line, bogus: 1 }]);

            expectWarningsCalls().toEqual([]);
            expect(chart.getState().annotations).toHaveLength(1);
        });
    });

    describe('copy and paste', () => {
        it('pastes a copy of the selected annotation offset from the original', async () => {
            await prepareChart([MINIMAL_ANNOTATIONS['horizontal-line']]);
            const rect = deproxy(chart).seriesRect;
            expect(rect).toBeDefined();
            const centre = { x: rect!.x + rect!.width / 2, y: rect!.y + rect!.height / 2 };

            await hoverAction(centre.x, centre.y)(chart);
            await clickAction(centre.x, centre.y)(chart);
            await keyDownAction(centre.x, centre.y, { key: 'c', code: 'KeyC', ctrlKey: true })(chart);
            await keyDownAction(centre.x, centre.y, { key: 'v', code: 'KeyV', ctrlKey: true })(chart);
            await waitForChartStability(chart);

            const annotations = chart.getState().annotations as Array<AgAnnotation & { value?: number }>;
            expect(annotations).toHaveLength(2);
            expect(annotations[1].type).toBe('horizontal-line');
            expect(annotations[1].value).not.toBe(annotations[0].value);
        });
    });

    describe('options toolbar edits', () => {
        const body = () => deproxy(chart).ctx.agDocument.body;
        const toolbarButton = (title: string) => body().querySelector<HTMLElement>(`button[title="${title}"]`);
        const menuRowByLabel = (label: string) => () =>
            Array.from(body().querySelectorAll<HTMLElement>('.ag-charts-menu__row')).find(
                (row) => row.querySelector('.ag-charts-menu__label')?.textContent === label
            );
        const menuRowByValue = (value: string) => () =>
            body().querySelector<HTMLElement>(`.ag-charts-menu__row[data-popover-id="${value}"]`) ?? undefined;

        async function selectHorizontalLine() {
            await prepareChart([MINIMAL_ANNOTATIONS['horizontal-line']]);
            const rect = deproxy(chart).seriesRect;
            expect(rect).toBeDefined();
            const centre = { x: rect!.x + rect!.width / 2, y: rect!.y + rect!.height / 2 };
            await hoverAction(centre.x, centre.y)(chart);
            await clickAction(centre.x, centre.y)(chart);
            await waitForChartStability(chart);
        }

        async function pick(buttonTitle: string, findRow: () => HTMLElement | undefined) {
            toolbarButton(buttonTitle)!.click();
            await waitForChartStability(chart);
            const row = findRow();
            expect(row).toBeDefined();
            row!.click();
            await waitForChartStability(chart);
        }

        it('serialises a line style picked from the toolbar', async () => {
            await selectHorizontalLine();
            await pick('Line Style', menuRowByValue('dashed'));

            const [annotation] = chart.getState().annotations;
            expect(annotation).toMatchObject({ type: 'horizontal-line', lineStyle: 'dashed' });
            expect(annotation.lineDash).toBeUndefined();
        });

        it('serialises a stroke width picked from the toolbar', async () => {
            await selectHorizontalLine();
            await pick('Line Stroke Width', menuRowByLabel('4'));

            expect(chart.getState().annotations[0]).toMatchObject({ type: 'horizontal-line', strokeWidth: 4 });
        });

        it('serialises a lock set from the toolbar', async () => {
            await selectHorizontalLine();
            body().querySelector<HTMLElement>('button[aria-checked]')!.click();
            await waitForChartStability(chart);

            expect(chart.getState().annotations[0]).toMatchObject({ type: 'horizontal-line', locked: true });
        });
    });

    describe('toolbar drawing', () => {
        it('serialises a horizontal line drawn from the toolbar', async () => {
            await prepareChart([], { ...EXAMPLE_OPTIONS, annotations: { enabled: true } });
            const body = deproxy(chart).ctx.agDocument.body;
            body.querySelector<HTMLElement>('button[title="Trend Lines"]')!.click();
            await waitForChartStability(chart);
            const item = Array.from(body.querySelectorAll<HTMLElement>('.ag-charts-menu__row')).find(
                (row) => row.textContent === 'Horizontal Line'
            );
            expect(item).toBeDefined();
            item!.click();
            await waitForChartStability(chart);

            const point = toCanvas(new Date(X_MID.value), 40);
            await hoverAction(point.x, point.y)(chart);
            await clickAction(point.x, point.y)(chart);
            await waitForChartStability(chart);

            const annotations = chart.getState().annotations;
            expect(annotations).toHaveLength(1);
            expect(annotations[0].type).toBe('horizontal-line');
            expect(annotations[0].value).toBeCloseTo(40, 0);
            expect(annotations).toMatchSnapshot();
        });
    });

    describe('line styles', () => {
        const STYLED_TYPES = [
            'line',
            'horizontal-line',
            'parallel-channel',
            'disjoint-channel',
            'fibonacci-retracement',
            'date-range',
            'price-range',
        ] as const;

        it.each(STYLED_TYPES)('renders a dashed %s annotation', async (type) => {
            await prepareChart([{ ...MINIMAL_ANNOTATIONS[type], lineStyle: 'dashed', strokeWidth: 3 }]);
            await compare();
        });

        it.each(STYLED_TYPES)('renders a dotted %s annotation', async (type) => {
            await prepareChart([{ ...MINIMAL_ANNOTATIONS[type], lineStyle: 'dotted', strokeWidth: 3 }]);
            await compare();
        });
    });

    describe('rendering', () => {
        it.each(
            (['arrow', 'arrow-up', 'arrow-down', 'quick-date-price-range'] as const).map(
                (type) => [withArticle(type), type] as const
            )
        )('renders %s annotation', async (_name, type) => {
            await prepareChart([MINIMAL_ANNOTATIONS[type]]);
            await compare();
        });

        it('places the hovered note text below the point when there is no room above it', async () => {
            await prepareChart([{ ...MINIMAL_ANNOTATIONS.note, y: 98 }]);
            // The note icon hangs above its data point.
            const point = toCanvas(new Date(X_MID.value), 98);
            await hoverAction(point.x, point.y - 8)(chart);
            await compare();
        });

        it('renders the placeholder for an empty comment annotation', async () => {
            await prepareChart([{ ...MINIMAL_ANNOTATIONS.comment, text: '' }]);
            await compare();
        });

        it('renders the placeholder for an empty callout annotation', async () => {
            await prepareChart([{ ...MINIMAL_ANNOTATIONS.callout, text: '' }]);
            await compare();
        });

        it('shows the summed volume of the dates inside a date range', async () => {
            const data = [
                { x: new Date('2024-01-05'), y: 5, volume: 100 },
                { x: new Date('2024-06-15'), y: 50, volume: 250 },
                { x: new Date('2024-12-25'), y: 95, volume: 400 },
            ];
            // The data plumbing is undocumented and normally supplied by the price-volume preset.
            const volumeOptions = { data, xKey: 'x', volumeKey: 'volume' } as object;
            const options: AgCartesianChartOptions = {
                data,
                series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }],
                axes: { y: { type: 'number' }, x: { type: 'time' } },
                annotations: { enabled: true, toolbar: { enabled: false }, ...volumeOptions },
            };
            await prepareChart([MINIMAL_ANNOTATIONS['date-range']], options);
            await compare();
        });
    });
});
