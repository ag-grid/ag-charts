import type { ChartOptions } from './chart/chartOptions';
import type { AgChartOptions } from './types/agChartsTypes';
import type { EventEmitter } from './util/eventEmitter';
import type { StageQueue } from './util/stageQueue';

/**
 * TODO: Split options API navigation into sections:
 * - Common options
 * - Per chart type
 * - Modules config
 */

export enum ChartType {
    Cartesian,
    Polar,
    Hierarchy,
    Topology,
}

export interface IChart<T extends AgChartOptions> {
    events: EventEmitter<ChartEventMap<T>>;
    options: ChartOptions<T>;
    scene: IScene;
    stageQueue: StageQueue;
    setOptions(options: ChartOptions<T>): void;
    waitForUpdate(): Promise<void>;
    remove(): void;
}

export interface ChartEventMap<T extends AgChartOptions> {
    change: ChartOptions<T>;
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
