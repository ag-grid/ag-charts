import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type App, createApp, defineComponent, h, isReactive, isRef, nextTick, reactive, ref, toRaw } from 'vue';

import { AgCharts as AgChartsAPI } from 'ag-charts-community';
import type { AgCartesianChartOptions, AgChartInstance, AgChartOptions } from 'ag-charts-community';
import {
    getSeriesNodeData,
    setupMockCanvas,
    setupMockConsole,
    syncGroupSize,
    syncedPeakChartOptions,
    syncedYDomain,
    waitForChartStability,
} from 'ag-charts-community-test';

import { AgCharts, AgFinancialCharts, AgGauge, AgQuadrantChart, AgVolumeProfileChart } from './index';
import { unwrapOptions, unwrapTransaction } from './unwrap';

describe('AgCharts', () => {
    setupMockConsole();
    setupMockCanvas();

    describe('synchronised charts', () => {
        let groupCount = 0;
        let groupId: string;
        let host: HTMLElement;
        let app: App | undefined;
        let components: (InstanceType<typeof AgCharts> | null)[];
        const peaks = ref<number[]>([]);

        beforeEach(() => {
            groupId = `vue-${groupCount++}`;
            host = document.body.appendChild(document.createElement('div'));
            components = [];
        });

        afterEach(() => {
            app?.unmount();
            app = undefined;
            host.remove();
        });

        // Like a typical app, every render passes each chart a freshly built options object.
        const SyncedCharts = defineComponent({
            render() {
                return h(
                    'div',
                    peaks.value.map((peak, i) =>
                        h(AgCharts, {
                            key: i,
                            ref: (component) => {
                                components[i] = component as InstanceType<typeof AgCharts> | null;
                            },
                            options: syncedPeakChartOptions(peak, groupId, `${peaks.value.length} charts`),
                        })
                    )
                );
            },
        });

        // The chart is created in the component's `mounted` hook, after its template ref is set.
        const mountedCharts = () =>
            components.map((component) => component?.chart).filter((chart): chart is AgChartInstance => chart != null);

        const waitForAllChartStability = async () => {
            for (const chart of mountedCharts()) {
                await waitForChartStability(chart);
            }
        };

        const render = async (initialPeaks: number[]) => {
            peaks.value = initialPeaks;
            app = createApp(SyncedCharts);
            app.mount(host);
            await waitForAllChartStability();
        };

        const changePeaks = async (nextPeaks: number[]) => {
            peaks.value = nextPeaks;
            await nextTick();
            components.length = nextPeaks.length;
            await waitForAllChartStability();
        };

        it('should widen every chart to the domain of a chart added to the group', async () => {
            await render([10, 20, 50]);
            expect(mountedCharts().map(syncedYDomain)).toEqual([
                [0, 50],
                [0, 50],
                [0, 50],
            ]);

            await changePeaks([10, 20, 50, 100]);

            expect(mountedCharts().map(syncedYDomain)).toEqual([
                [0, 100],
                [0, 100],
                [0, 100],
                [0, 100],
            ]);
            expect(mountedCharts().map((chart) => syncGroupSize(chart, groupId))).toEqual([4, 4, 4, 4]);
        });

        it('should shrink the remaining charts to their own domain when a chart is removed from the group', async () => {
            await render([10, 20, 50]);

            await changePeaks([10, 20]);

            expect(mountedCharts().map(syncedYDomain)).toEqual([
                [0, 20],
                [0, 20],
            ]);
            expect(mountedCharts().map((chart) => syncGroupSize(chart, groupId))).toEqual([2, 2]);
        });
    });

    describe('data transactions', () => {
        interface Datum {
            category: string;
            value: number;
        }

        let host: HTMLElement;
        let app: App | undefined;

        beforeEach(() => {
            host = document.body.appendChild(document.createElement('div'));
        });

        afterEach(() => {
            app?.unmount();
            app = undefined;
            host.remove();
        });

        const createData = (count: number, first = 0): Datum[] =>
            Array.from({ length: count }, (_, i) => ({ category: `c${first + i}`, value: first + i }));

        const barOptions = (data: Datum[], extra: Partial<AgCartesianChartOptions> = {}): AgCartesianChartOptions => ({
            width: 400,
            height: 300,
            animation: { enabled: false },
            data,
            series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
            ...extra,
        });

        const mount = async (getOptions: () => AgChartOptions) => {
            let component: InstanceType<typeof AgCharts> | null = null;
            app = createApp({
                render: () =>
                    h(AgCharts, {
                        options: getOptions(),
                        ref: (c) => {
                            component = c as InstanceType<typeof AgCharts> | null;
                        },
                    }),
            });
            app.mount(host);
            const chart = component!.chart!;
            await waitForChartStability(chart);
            return chart;
        };

        const values = (chart: AgChartInstance) => getSeriesNodeData<{ yValue: number }>(chart).map((d) => d.yValue);

        // A raw item is one the app kept hold of; a proxied item is one it read back through the reactive options.
        const OPTIONS_KINDS = [
            ['reactive', (options: AgChartOptions) => ref(options).value],
            ['plain', (options: AgChartOptions) => options],
        ] as const;
        const ITEM_KINDS = [
            ['raw', (item: Datum) => item],
            ['proxied', (item: Datum) => reactive(item)],
        ] as const;

        describe.each(OPTIONS_KINDS)('%s options', (_optionsKind, makeOptions) => {
            it.each(ITEM_KINDS)('should remove a %s item', async (_itemKind, makeItem) => {
                const data = createData(5);
                const options = makeOptions(barOptions(data));
                const chart = await mount(() => options);

                await chart.applyTransaction({ remove: [makeItem(data[0])] });
                await waitForChartStability(chart);

                expect(values(chart)).toEqual([1, 2, 3, 4]);
            });

            it.each(ITEM_KINDS)('should update a %s item', async (_itemKind, makeItem) => {
                const data = createData(5);
                const options = makeOptions(barOptions(data));
                const chart = await mount(() => options);

                data[0].value = 99;
                await chart.applyTransaction({ update: [makeItem(data[0])] });
                await waitForChartStability(chart);

                expect(values(chart)).toEqual([99, 1, 2, 3, 4]);
            });
        });

        it('should remove an item read back through the reactive options', async () => {
            const options = ref(barOptions(createData(5))).value as AgCartesianChartOptions;
            const chart = await mount(() => options);

            expect(isReactive(options.data![0])).toBe(true);
            await chart.applyTransaction({ remove: [options.data![0]] });
            await waitForChartStability(chart);

            expect(values(chart)).toEqual([1, 2, 3, 4]);
        });

        it('should keep a rolling window at its size under reactive options', async () => {
            const window = 20;
            const data = createData(window);
            const options = ref(barOptions(data)).value;
            const chart = await mount(() => options);

            let next = window;
            for (let tick = 0; tick < 3; tick++) {
                const removed = data.splice(0, 5);
                const added = createData(5, next);
                next += 5;
                data.push(...added);
                await chart.applyTransaction({ remove: removed, add: added });
                await waitForChartStability(chart);
            }

            expect(values(chart)).toEqual(data.map((d) => d.value));
            expect(values(chart)).toHaveLength(window);
        });

        it('should unwrap items added to the chart', async () => {
            const data = createData(3);
            const chart = await mount(() => ref(barOptions(data)).value);

            const added = reactive(createData(1, 3)[0]);
            await chart.applyTransaction({ add: [added] });
            await chart.applyTransaction({ remove: [toRaw(added)] });
            await waitForChartStability(chart);

            expect(values(chart)).toEqual([0, 1, 2]);
        });

        it('should apply a transaction held in reactive state', async () => {
            const data = createData(5);
            const chart = await mount(() => ref(barOptions(data)).value);

            await chart.applyTransaction(reactive({ remove: [data[0], data[1]] }));
            await waitForChartStability(chart);

            expect(values(chart)).toEqual([2, 3, 4]);
        });

        it('should reject a malformed transaction as the chart does', async () => {
            const chart = await mount(() => ref(barOptions(createData(2))).value);

            expect(() => chart.applyTransaction(null as any)).toThrow('applyTransaction expects a transaction object');
            expect(() => chart.applyTransaction({ add: 'x' } as any)).toThrow('"add" must be an array');
            expect(() => chart.applyTransaction({ remove: {} } as any)).toThrow('"remove" must be an array');
            expect(() => chart.applyTransaction({ update: 1 } as any)).toThrow('"update" must be an array');
        });

        it('should return the chart promise and leave the other methods of the instance alone', async () => {
            const chart = await mount(() => ref(barOptions(createData(2))).value);
            const proto = Object.getPrototypeOf(chart);

            expect(chart.applyTransaction({ add: [] })).toBeInstanceOf(Promise);
            for (const method of ['destroy', 'download', 'getOptions', 'waitForUpdate', 'resetAnimations'] as const) {
                expect(Object.hasOwn(chart, method), method).toBe(false);
                expect(chart[method], method).toBe(proto[method]);
            }
        });

        it('should keep the same chart when the options change', async () => {
            const options = ref(barOptions(createData(2)));
            let component: InstanceType<typeof AgCharts> | null = null;
            app = createApp({
                render: () =>
                    h(AgCharts, {
                        options: options.value,
                        ref: (c) => {
                            component = c as InstanceType<typeof AgCharts> | null;
                        },
                    }),
            });
            app.mount(host);
            const chart = component!.chart!;
            await waitForChartStability(chart);

            options.value = barOptions(createData(3));
            await nextTick();
            await waitForChartStability(chart);

            expect(component!.chart).toBe(chart);
            expect(values(chart)).toEqual([0, 1, 2]);
        });

        it('should hand callbacks the raw datum rather than a proxy', async () => {
            const seen: unknown[] = [];
            const data = createData(2);
            const options = ref(
                barOptions(data, {
                    series: [
                        {
                            type: 'bar',
                            xKey: 'category',
                            yKey: 'value',
                            itemStyler: ({ datum }) => {
                                seen.push(datum);
                                return {};
                            },
                        },
                    ],
                })
            ).value;
            const chart = await mount(() => options);
            await waitForChartStability(chart);

            expect(seen.length).toBeGreaterThan(0);
            expect(seen.every((datum) => !isReactive(datum))).toBe(true);
            expect(new Set(seen)).toEqual(new Set(data));
        });

        it('should leave the caller options untouched', async () => {
            const data = createData(3);
            const options = ref(barOptions(data)).value;
            const chart = await mount(() => options);
            await chart.applyTransaction({ remove: [data[0]] });

            expect(isReactive(options)).toBe(true);
            expect(isReactive(options.data![0])).toBe(true);
            expect(data).toHaveLength(3);
        });
    });
});

describe('unwrapOptions', () => {
    class Custom {
        constructor(public readonly name: string) {}
    }

    it('should return options that hold no proxies as they are', () => {
        const options = { data: [{ a: 1 }], series: [{ type: 'bar', data: [{ b: 2 }] }], title: { text: 'x' } };

        expect(unwrapOptions(options)).toBe(options);
    });

    it('should unwrap proxies at every depth without copying branches that need none', () => {
        const item = { a: 1 };
        const title = { text: 'title' };
        const options: any = {
            title,
            series: [{ type: 'bar', data: reactive([item]) }],
            axes: [{ type: 'number', label: reactive({ rotation: 5 }) }],
        };

        const result = unwrapOptions(options);

        expect(result).not.toBe(options);
        expect(result.title).toBe(title);
        expect(isReactive(result.axes[0].label)).toBe(false);
        expect(isReactive(result.series[0].data)).toBe(false);
        expect(result.series[0].data[0]).toBe(item);
        expect(isReactive(options.axes[0].label)).toBe(true);
        expect(isReactive(options.series[0].data)).toBe(true);
    });

    it('should unwrap the datums of a data array but not walk inside them', () => {
        const inner = reactive({ nested: 1 });
        const proxied = reactive({ a: 1 });
        const datums = [proxied, { inner }];

        const result = unwrapOptions({ data: datums }).data as any[];

        expect(result[0]).toBe(toRaw(proxied));
        expect(result[1]).toBe(datums[1]);
        expect(result[1].inner).toBe(inner);
        expect(datums[0]).toBe(proxied);
    });

    it('should pass through anything that is not plain data by identity', () => {
        const callback = () => 1;
        const instance = new Custom('c');
        const date = new Date(0);
        const map = new Map([[1, 2]]);
        const element = document.createElement('div');
        const options = reactive({
            formatter: callback,
            instance,
            date,
            map,
            element,
            array: new Float64Array(2),
            data: [1],
        });

        const result: any = unwrapOptions(options);

        expect(result.formatter).toBe(callback);
        expect(result.instance).toBe(instance);
        expect(result.date).toBe(date);
        expect(result.map).toBe(map);
        expect(result.element).toBe(element);
        expect(result.array).toBe(toRaw(options).array);
    });

    it('should return the target of a proxied class instance', () => {
        const instance = new Custom('c');

        expect((unwrapOptions({ instance: reactive(instance) }) as any).instance).toBe(instance);
    });

    it('should unwrap refs held in reactive state, as reading through the proxy does', () => {
        const options = reactive({ title: { text: ref('hello') } });

        expect((unwrapOptions(options) as any).title.text).toBe('hello');
    });

    it('should not hang on cycles', () => {
        const options: any = { title: { text: 'x' }, items: [] };
        options.self = options;
        options.items.push(options.title, options);
        const proxied = reactive({ nested: { parent: null as unknown } });
        proxied.nested.parent = proxied;

        expect(() => unwrapOptions(options)).not.toThrow();
        expect(() => unwrapOptions(proxied)).not.toThrow();
        expect(unwrapOptions(options)).toBe(options);
    });

    it('should not mutate the options it is given', () => {
        const data = reactive([{ a: 1 }]);
        const options = { data, series: [{ type: 'bar', data }] };

        const result = unwrapOptions(options);

        expect(result).not.toBe(options);
        expect(options.data).toBe(data);
        expect(options.series[0].data).toBe(data);
    });
});

describe('unwrapTransaction', () => {
    it('should return the raw target of each item without changing the transaction passed', () => {
        const [a, b, c] = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const transaction = { add: [reactive(a)], remove: [b], update: reactive([c]), addIndex: 1 };

        const result = unwrapTransaction(transaction as any);

        expect(result).toEqual({ add: [a], remove: [b], update: [c], addIndex: 1 });
        expect(result.add![0]).toBe(a);
        expect(result.remove).toBe(transaction.remove);
        expect(transaction.add[0]).not.toBe(a);
    });

    it.each([[null], [undefined], ['x'], [5]])('should pass %s through', (value) => {
        expect(unwrapTransaction(value as any)).toBe(value);
    });

    it('should read the operations of a reactive transaction as the chart would, refs included', () => {
        const [a, b, c] = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const transaction = reactive({ add: ref([a]), remove: ref([b]), update: [c], addIndex: ref(1) });

        const result = unwrapTransaction(transaction as any);

        expect(result).toEqual({ add: [a], remove: [b], update: [c], addIndex: 1 });
        expect(result.add![0]).toBe(a);
        expect(result.remove![0]).toBe(b);
        expect(result.update![0]).toBe(c);
        expect(isRef(result.add)).toBe(false);
        expect(isRef(toRaw(transaction).remove)).toBe(true);
    });

    it('should pass non-array operations through for the chart to reject', () => {
        const transaction = { add: 'x', remove: { length: 1 } };

        expect(unwrapTransaction(transaction as any)).toBe(transaction);
    });
});

// The enterprise-only components cannot be created here, so each factory is stubbed. What matters is what the wrapper
// hands to it and to the instance it returns.
describe.each([
    ['AgCharts', AgCharts, 'create'],
    ['AgFinancialCharts', AgFinancialCharts, 'createFinancialChart'],
    ['AgGauge', AgGauge, 'createGauge'],
    ['AgQuadrantChart', AgQuadrantChart, 'createQuadrantChart'],
    ['AgVolumeProfileChart', AgVolumeProfileChart, 'createVolumeProfileChart'],
] as const)('%s', (_name, Component, factory) => {
    let host: HTMLElement;
    let app: App | undefined;
    // The wrapper replaces `chart.applyTransaction`, so the stub's own function is kept to read the calls back.
    let applyTransaction: ReturnType<typeof vi.fn>;
    let chart: { applyTransaction: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; destroy: () => void };

    beforeEach(() => {
        host = document.body.appendChild(document.createElement('div'));
        applyTransaction = vi.fn(() => Promise.resolve());
        chart = { applyTransaction, update: vi.fn(), destroy: vi.fn() };
        vi.spyOn(AgChartsAPI, factory).mockReturnValue(chart as any);
    });

    afterEach(() => {
        app?.unmount();
        app = undefined;
        host.remove();
        vi.restoreAllMocks();
    });

    it('should give the chart raw options and raw transaction items under reactive options', async () => {
        const datum = { x: 1 };
        const next = { x: 2 };
        const options = ref<any>({ data: [datum] });
        let component: any;
        app = createApp({
            render: () => h(Component as any, { options: options.value, ref: (c: unknown) => (component = c) }),
        });
        app.mount(host);

        const created = vi.mocked(AgChartsAPI[factory]).mock.calls[0][0] as any;
        expect(created.data[0]).toBe(datum);

        options.value = { data: [next] };
        await nextTick();
        const updated = chart.update.mock.calls[0][0];
        expect(updated.data[0]).toBe(next);

        const proxied = options.value.data[0];
        expect(proxied).not.toBe(next);
        await component.chart.applyTransaction({ remove: [proxied] });
        await component.chart.applyTransaction({ update: [reactive(next)], add: [reactive(datum)] });
        const [removal, change] = applyTransaction.mock.calls.map(([tx]) => tx);
        expect(removal.remove[0]).toBe(next);
        expect(change.update[0]).toBe(next);
        expect(change.add[0]).toBe(datum);
    });
});
