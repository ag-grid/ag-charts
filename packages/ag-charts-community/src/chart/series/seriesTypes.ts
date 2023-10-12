import type { InteractionRange } from '../../options/chart/types';
import type { BBox } from '../../scene/bbox';
import type { Group } from '../../scene/group';
import type { ChartAxis } from '../chartAxis';
import type { ChartAxisDirection } from '../chartAxisDirection';
import type { ChartLegendDatum, ChartLegendType } from '../legendDatum';
import type { SeriesTooltip } from './seriesTooltip';

export interface ISeries<TDatum> {
    id: string;
    axes: Record<ChartAxisDirection, ChartAxis | undefined>;
    cursor: string;
    contentGroup: Group;
    tooltip: SeriesTooltip<any>;
    nodeClickRange: InteractionRange;
    hasEventListener(type: string): boolean;
    update(opts: { seriesRect?: BBox }): Promise<void>;
    fireNodeClickEvent(event: Event, datum: TDatum): void;
    fireNodeDoubleClickEvent(event: Event, datum: TDatum): void;
    getLegendData<T extends ChartLegendType>(legendType: T): ChartLegendDatum<T>[];
    getLegendData(legendType: ChartLegendType): ChartLegendDatum<ChartLegendType>[];
}
