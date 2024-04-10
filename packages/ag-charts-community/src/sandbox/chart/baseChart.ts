import { DataPipeline } from '../data/dataPipeline';
import { moduleRegistry } from '../modules/moduleRegistry';
import type { Stage } from '../render/stage';
import type { ChartEventMap, IChart, IScale } from '../types';
import type { AgChartOptions } from '../types/agChartsTypes';
import type { SeriesModule } from '../types/moduleTypes';
import { EventEmitter } from '../util/eventEmitter';
import { PipelinePhase, PipelineQueue } from '../util/pipelineQueue';
import { SizeObserver } from '../util/resizeObserver';
import type { ChartOptions } from './chartOptions';

export abstract class BaseChart<T extends AgChartOptions> implements IChart<T> {
    static DefaultAxes?: object[];
    static DefaultKeysMap?: object;

    private static sizeObserver = new SizeObserver();

    readonly events = new EventEmitter<ChartEventMap<T>>();
    readonly pipeline = new PipelineQueue();

    private pendingOptions: ChartOptions<T> | null = null;

    protected dataPipeline = new DataPipeline();
    protected scales?: any[];
    protected series?: any[];

    constructor(
        public readonly stage: Stage,
        public options: ChartOptions<T>
    ) {
        this.setOptions(options);
    }

    setOptions(options: ChartOptions<T>) {
        this.pendingOptions = options;
        this.pipeline.enqueue(PipelinePhase.OptionsUpdate, this.applyPendingOptions);
    }

    waitForUpdate(timeoutMs = 10_000): Promise<void> {
        const message = `Chart.waitForUpdate() timeout of ${timeoutMs}ms reached - chart update is taking too long.`;
        return new Promise((resolve, reject) => {
            const timerId = setTimeout(() => reject(new Error(message)), timeoutMs);
            this.pipeline.enqueue(PipelinePhase.Notify, () => {
                clearTimeout(timerId);
                resolve();
            });
        });
    }

    remove() {}

    protected determineScale(): IScale {
        return null as any;
    }

    protected processData() {
        const { fullOptions } = this.options;

        if (!fullOptions.data?.length || !fullOptions.series?.length) return;

        const { DefaultAxes, DefaultKeysMap } = this.constructor as any;
        const { axes = DefaultAxes, series } = fullOptions;
        const keysMap = new Map<string, Set<string>>();

        for (const seriesOptions of series) {
            const seriesModule = moduleRegistry.getModule<SeriesModule<any>>(seriesOptions.type);
            const seriesKeysMap = Object.entries<string[]>(seriesModule?.axesKeysMap ?? DefaultKeysMap);
            for (const [axisCoordinate, axisKeys] of seriesKeysMap) {
                const axisCoordinateKeys =
                    keysMap.get(axisCoordinate) ?? keysMap.set(axisCoordinate, new Set()).get(axisCoordinate)!;
                for (let key of axisKeys) {
                    key += 'Key';
                    if (Object.hasOwn(seriesOptions, key)) {
                        axisCoordinateKeys.add((seriesOptions as any)[key]);
                    }
                }
            }
        }

        /**
         * Order:
         * create data processors
         * create / modify axes
         * create / modify series
         */

        const axisInstances = axes;

        console.log({ axes, series, keysMap, axisInstances });

        this.dataPipeline.processData(fullOptions.data);

        // if (fullOptions.axes ?? DefaultAxes) {
        //     // 'x' and 'y' represent the values inside `xKey` and `yKey`
        //     this.dataPipeline.addProcessor('x', new CategoryProcessor());
        //     this.dataPipeline.addProcessor('y', new NumberProcessor());
        // }
    }

    protected applyOptions(options: ChartOptions<T>) {
        const { fullOptions, optionsDiff } = options;

        this.options = options;

        if (options.lastOptions) {
            const prevOptions = options.lastOptions.fullOptions;

            if (fullOptions.width !== prevOptions.width || fullOptions.height !== prevOptions.height) {
                this.setSceneSize(fullOptions.width, fullOptions.height);
            }
            if (fullOptions.container != prevOptions.container) {
                this.setContainer(fullOptions.container, prevOptions.container);
            }
        } else {
            this.setSceneSize(fullOptions.width, fullOptions.height);
            this.setContainer(fullOptions.container);
        }

        if (!optionsDiff || optionsDiff.data) {
            this.processData();
        }

        this.events.emit('change', this.options);
    }

    private applyPendingOptions = () => {
        if (!this.pendingOptions) return;
        this.applyOptions(this.pendingOptions);
        this.pendingOptions = null;
    };

    private setSceneSize(width?: number, height?: number) {
        if (!width || !height) {
            let pendingSize: DOMRect | null;

            const onResize = () => {
                if (pendingSize == null) return;
                this.stage.resize(width ?? pendingSize.width, height ?? pendingSize.height);
                pendingSize = null;
            };

            // If called multiple times it'll only register once, storing latest size.
            BaseChart.sizeObserver.observe(this.stage.rootElement, (size) => {
                pendingSize = size;
                this.pipeline.enqueue(PipelinePhase.PreRender, onResize);
            });
        } else {
            BaseChart.sizeObserver.unobserve(this.stage.rootElement);
            this.pipeline.enqueue(PipelinePhase.PreRender, () => this.stage.resize(width, height));
        }
    }

    private setContainer(container?: HTMLElement, prevContainer?: HTMLElement) {
        container?.setAttribute('data-ag-charts', '');
        container?.appendChild(this.stage.rootElement);
        prevContainer?.removeAttribute('data-ag-charts');
    }
}
