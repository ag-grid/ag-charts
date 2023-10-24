import { ContinuousScale } from '../../scale/continuousScale';
import { ChartAxisDirection } from '../chartAxisDirection';
import type { DataController } from '../data/dataController';
import type { DataModel, DataModelOptions, ProcessedData } from '../data/dataModel';
import type { SeriesNodeDataContext } from './series';
import { Series } from './series';
import type { SeriesNodeDatum } from './seriesTypes';

export abstract class DataModelSeries<
    TDatum extends SeriesNodeDatum,
    TLabel = TDatum,
    TContext extends SeriesNodeDataContext<TDatum, TLabel> = SeriesNodeDataContext<TDatum, TLabel>,
> extends Series<TDatum, TLabel, TContext> {
    protected dataModel?: DataModel<any, any, any>;
    protected processedData?: ProcessedData<any>;

    protected isContinuous(): { isContinuousX: boolean; isContinuousY: boolean } {
        const isContinuousX = ContinuousScale.is(this.axes[ChartAxisDirection.X]?.scale);
        const isContinuousY = ContinuousScale.is(this.axes[ChartAxisDirection.Y]?.scale);
        return { isContinuousX, isContinuousY };
    }

    // Request data, but with message dispatching to series-options (modules).
    protected async requestDataModel<
        D extends object,
        K extends keyof D & string = keyof D & string,
        G extends boolean | undefined = undefined,
    >(dataController: DataController, data: D[] | undefined, opts: DataModelOptions<K, any>) {
        // Merge properties of this series with properties of all the attached series-options
        const props = opts.props;
        const listenerProps: (typeof props)[] = this.dispatch('data-prerequest', this.isContinuous()) ?? [];
        for (const moreProps of listenerProps) {
            props.push(...moreProps);
        }

        const { dataModel, processedData } = await dataController.request<D, K, G>(this.id, data ?? [], {
            ...opts,
            props,
        });

        this.dataModel = dataModel;
        this.processedData = processedData;
        this.dispatch('data-processed', { dataModel, processedData });
        return { dataModel, processedData };
    }
}
