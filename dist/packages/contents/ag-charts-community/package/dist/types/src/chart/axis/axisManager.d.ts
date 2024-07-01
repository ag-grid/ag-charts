import type { AxisContext } from '../../module/axisContext';
import { Group } from '../../scene/group';
import type { ChartAxisDirection } from '../chartAxisDirection';
type Axis = {
    createAxisContext(): AxisContext;
    attachAxis(axisGroup: Group, axisGridGroup: Group): void;
    detachAxis(axisGroup: Group, axisGridGroup: Group): void;
    destroy(): void;
};
export declare class AxisManager {
    private readonly sceneRoot;
    private readonly axes;
    readonly axisGridGroup: Group;
    readonly axisGroup: Group;
    constructor(sceneRoot: Group);
    updateAxes(oldAxes: Axis[], newAxes: Axis[]): void;
    getAxisContext(direction: ChartAxisDirection): AxisContext[];
    destroy(): void;
}
export {};
