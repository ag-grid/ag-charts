import type { Direction } from '../../../options/chart/types';
import type { Node } from '../../../scene/node';
import { DIRECTION, Validate } from '../../../util/validation';
import type { ChartAxis } from '../../chartAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { BandScaleConfiguration, SeriesNodeDatum } from '../seriesTypes';
import type { CartesianSeriesNodeDataContext, CartesianSeriesNodeDatum } from './cartesianSeries';
import { CartesianSeries } from './cartesianSeries';

export abstract class AbstractBarSeries<
    TNode extends Node,
    TDatum extends CartesianSeriesNodeDatum,
    TLabel extends SeriesNodeDatum = TDatum,
    TContext extends CartesianSeriesNodeDataContext<TDatum, TLabel> = CartesianSeriesNodeDataContext<TDatum, TLabel>,
> extends CartesianSeries<TNode, TDatum, TLabel, TContext> {
    @Validate(DIRECTION)
    direction: Direction = 'vertical';

    override getBandScaleConfiguration(): BandScaleConfiguration {
        return { paddingInner: 0.2, paddingOuter: 0.1, bandMode: 'band' };
    }

    override shouldFlipXY(): boolean {
        return this.direction === 'horizontal';
    }

    protected getBarDirection() {
        return this.shouldFlipXY() ? ChartAxisDirection.X : ChartAxisDirection.Y;
    }

    protected getCategoryDirection() {
        return this.shouldFlipXY() ? ChartAxisDirection.Y : ChartAxisDirection.X;
    }

    protected getValueAxis(): ChartAxis | undefined {
        const direction = this.getBarDirection();
        return this.axes[direction];
    }

    protected getCategoryAxis(): ChartAxis | undefined {
        const direction = this.getCategoryDirection();
        return this.axes[direction];
    }
}
