import type { EventEmitter } from '../util/eventEmitter';

export interface IStage {
    readonly canvas: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
    readonly events: EventEmitter<StageEventMap>;
    readonly rootElement: HTMLDivElement;
    readonly rootNode: object;

    resize(width: number, height: number): void;
    update(): void;
}

export interface StageEventMap {
    resize: { width: number; height: number };
    update: {};
}
