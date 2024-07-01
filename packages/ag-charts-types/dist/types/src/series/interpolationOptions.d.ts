import type { Ratio } from '../chart/types';
export type AgInterpolationType = AgLineLinearType | AgLineSmoothType | AgLineStepType;
interface AgLineLinearType {
    type: 'linear';
}
interface AgLineSmoothType {
    type: 'smooth';
    tension?: Ratio;
}
interface AgLineStepType {
    type: 'step';
    position?: 'start' | 'middle' | 'end';
}
export {};
