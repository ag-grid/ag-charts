import type { Scale } from '../../scale/scale';
import type { BBox } from '../../scene/bbox';
import type { DataController } from '../data/dataController';
import type { DataModel, DataModelOptions, ProcessedData } from '../data/dataModel';
import type { PickFocusInputs, PickFocusOutputs, SeriesNodeDataContext } from './series';
import { Series } from './series';
import type { SeriesProperties } from './seriesProperties';
import type { SeriesNodeDatum } from './seriesTypes';
export declare abstract class DataModelSeries<TDatum extends SeriesNodeDatum, TProps extends SeriesProperties<any>, TLabel = TDatum, TContext extends SeriesNodeDataContext<TDatum, TLabel> = SeriesNodeDataContext<TDatum, TLabel>> extends Series<TDatum, TProps, TLabel, TContext> {
    protected dataModel?: DataModel<any, any, any>;
    protected processedData?: ProcessedData<any>;
    protected showFocusBox: boolean;
    protected getScaleInformation({ xScale, yScale, }: {
        xScale?: Scale<any, any, any>;
        yScale?: Scale<any, any, any>;
    }): {
        isContinuousX: boolean;
        isContinuousY: boolean;
        xScaleType: import("../../scale/scale").ScaleType | undefined;
        yScaleType: import("../../scale/scale").ScaleType | undefined;
    };
    private getModulePropertyDefinitions;
    protected requestDataModel<D extends object, K extends keyof D & string = keyof D & string, G extends boolean | undefined = undefined>(dataController: DataController, data: D[] | undefined, opts: DataModelOptions<K, boolean | undefined>): Promise<{
        dataModel: DataModel<D, K, G>;
        processedData: ProcessedData<D>;
    }>;
    protected isProcessedDataAnimatable(): boolean;
    protected checkProcessedDataAnimatable(): void;
    protected abstract computeFocusBounds(opts: PickFocusInputs): BBox | undefined;
    abstract getNodeData(): TDatum[] | undefined;
    pickFocus(opts: PickFocusInputs): PickFocusOutputs<TDatum> | undefined;
    private doPickFocus;
    private computeFocusDatumIndex;
}
