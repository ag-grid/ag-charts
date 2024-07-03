import { ContinuousScale } from './continuousScale';
/**
 * Maps continuous domain to a continuous range.
 */
export declare class LinearScale extends ContinuousScale<number> {
    readonly type = "number";
    constructor();
    toDomain(d: number): number;
    ticks(): number[];
    update(): void;
    protected getTickStep(start: number, stop: number): number;
    /**
     * Extends the domain so that it starts and ends on nice round values.
     */
    protected updateNiceDomain(): void;
    tickFormat({ ticks: specifiedTicks, specifier }: {
        ticks?: any[];
        specifier?: string;
    }): (n: number | {
        valueOf(): number;
    }) => string;
}