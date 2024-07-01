import type { LayoutCompleteEvent, LayoutService } from '../layout/layoutService';
import type { ChartLike, UpdateProcessor } from './processor';
export declare class BaseLayoutProcessor implements UpdateProcessor {
    private readonly chartLike;
    private readonly layoutService;
    private readonly destroyFns;
    constructor(chartLike: ChartLike, layoutService: LayoutService);
    destroy(): void;
    private positionPadding;
    private positionCaptions;
    alignCaptions(ctx: LayoutCompleteEvent): void;
}
