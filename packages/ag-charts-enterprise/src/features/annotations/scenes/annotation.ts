import { _ModuleSupport, _Scene } from 'ag-charts-community';

import type { Coords } from '../annotationTypes';

const { isObject } = _ModuleSupport;

export abstract class Annotation extends _Scene.Group {
    static isCheck(value: unknown, type: string) {
        return isObject(value) && Object.hasOwn(value, 'type') && value.type === type;
    }

    public locked: boolean = false;

    public abstract type: string;
    public abstract activeHandle?: string;

    // TODO: stats

    abstract override containsPoint(x: number, y: number): boolean;

    public abstract toggleHandles(show: boolean | Record<string, boolean>): void;
    public abstract toggleActive(active: boolean): void;
    public abstract dragHandle(datum: any, target: Coords, invertPoint: (point: Coords) => Coords | undefined): void;
    public abstract stopDragging(): void;
    public abstract getCursor(): string;
}
