import type { AgChartOptions } from './types/agChartsTypes';
import type { ChartType } from './types/enums';
import type { EventEmitter } from './util/eventEmitter';
import type { StageQueue } from './util/stageQueue';

/**
 * TODO: Split options API navigation into sections:
 * - Common options
 * - Per chart type
 * - Modules config
 */

export interface IChartOptions<T extends AgChartOptions> {
    fullOptions: T;
    userOptions: Partial<T>;
    prevOptions?: IChartOptions<T>;
    optionsDiff: Partial<T> | null;
    readonly chartType: ChartType;
    validate(options: Partial<T>): boolean;
}

export interface IChart<T extends AgChartOptions> {
    events: EventEmitter<ChartEventMap<T>>;
    options: IChartOptions<T>;
    scene: IScene;
    stageQueue: StageQueue;
    setOptions(options: IChartOptions<T>): void;
    waitForUpdate(): Promise<void>;
    remove(): void;
}

export interface ChartEventMap<T extends AgChartOptions> {
    change: IChartOptions<T>;
}

export interface IScene {
    readonly canvas: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
    readonly events: EventEmitter<SceneEventMap>;
    readonly rootElement: HTMLDivElement;
    readonly rootNode: object;

    resize(width: number, height: number): void;
    update(): void;
}

export interface SceneEventMap {
    resize: { width: number; height: number };
    update: {};
}

export interface IScale {}

export interface IModule {}

export interface ISeries extends IModule {}

export interface IAxis extends IModule {}
