import { DataPipeline } from '../data/dataPipeline';
import { CategoryProcessor, NumberProcessor } from '../data/dataProcessor';
import type { CommonChartOptions } from '../defs/commonOptions';
import type { Scene } from '../render/scene';
import type { ChartEventMap, IChart, IScale } from '../types';
import { EventEmitter } from '../util/eventEmitter';
import { SizeObserver } from '../util/resizeObserver';
import { Stage, StageQueue } from '../util/stageQueue';
import type { ChartOptions } from './chartOptions';

export abstract class BaseChart<T extends CommonChartOptions> implements IChart {
    private static sizeObserver = new SizeObserver();

    readonly events = new EventEmitter<ChartEventMap>();
    readonly stageQueue = new StageQueue();

    private pendingOptions: ChartOptions<T> | null = null;

    protected dataPipeline = new DataPipeline();
    protected scales?: any[];
    protected series?: any[];

    constructor(
        public readonly scene: Scene,
        public options: ChartOptions<T>
    ) {
        this.setOptions(options);
    }

    setOptions(options: ChartOptions<T>) {
        this.pendingOptions = options;
        this.stageQueue.enqueue(Stage.OPTIONS_UPDATE, this.applyPendingOptions);
    }

    remove() {}

    protected determineScale(): IScale {
        return null as any;
    }

    protected applyOptions(options: ChartOptions<T>) {
        const { fullOptions, optionsDiff } = options;

        this.options = options;

        if (options.prevOptions) {
            const prevOptions = options.prevOptions.fullOptions;

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

        // 'x' and 'y' represent the values inside `xKey` and `yKey`
        this.dataPipeline.addProcessor('x', new CategoryProcessor());
        this.dataPipeline.addProcessor('y', new NumberProcessor());

        if (!optionsDiff || optionsDiff.data) {
            this.dataPipeline.processData(fullOptions.data);
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
                this.scene.resize(width ?? pendingSize.width, height ?? pendingSize.height);
                pendingSize = null;
            };

            // If called multiple times it'll only register once, storing latest size.
            BaseChart.sizeObserver.observe(this.scene.rootElement, (size) => {
                pendingSize = size;
                this.stageQueue.enqueue(Stage.PRE_RENDER, onResize);
            });
        } else {
            BaseChart.sizeObserver.unobserve(this.scene.rootElement);
            this.stageQueue.enqueue(Stage.PRE_RENDER, () => this.scene.resize(width, height));
        }
    }

    private setContainer(container: HTMLElement, prevContainer?: HTMLElement) {
        container.setAttribute('data-ag-charts', '');
        container.appendChild(this.scene.rootElement);
        prevContainer?.removeAttribute('data-ag-charts');
    }
}
