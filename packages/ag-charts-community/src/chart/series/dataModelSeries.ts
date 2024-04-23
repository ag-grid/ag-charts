import { ContinuousScale } from '../../scale/continuousScale';
import type { Scale } from '../../scale/scale';
import type { BBox } from '../../scene/bbox';
import { Logger } from '../../util/logger';
import { ChartAxisDirection } from '../chartAxisDirection';
import type { DataController } from '../data/dataController';
import type { DataModel, DataModelOptions, ProcessedData, PropertyDefinition } from '../data/dataModel';
import type { PickFocusInputs, PickFocusOutputs, SeriesNodeDataContext } from './series';
import { Series } from './series';
import type { SeriesProperties } from './seriesProperties';
import type { SeriesNodeDatum } from './seriesTypes';

export abstract class DataModelSeries<
    TDatum extends SeriesNodeDatum,
    TProps extends SeriesProperties<any>,
    TLabel = TDatum,
    TContext extends SeriesNodeDataContext<TDatum, TLabel> = SeriesNodeDataContext<TDatum, TLabel>,
> extends Series<TDatum, TProps, TLabel, TContext> {
    protected dataModel?: DataModel<any, any, any>;
    protected processedData?: ProcessedData<any>;

    protected isContinuous({ xScale, yScale }: { xScale?: Scale<any, any, any>; yScale?: Scale<any, any, any> }): {
        isContinuousX: boolean;
        isContinuousY: boolean;
    } {
        const isContinuousX = ContinuousScale.is(xScale);
        const isContinuousY = ContinuousScale.is(yScale);
        return { isContinuousX, isContinuousY };
    }

    private getModulePropertyDefinitions() {
        const xScale = this.axes[ChartAxisDirection.X]?.scale;
        const yScale = this.axes[ChartAxisDirection.Y]?.scale;
        return this.moduleMap
            .mapModules((mod) => mod.getPropertyDefinitions(this.isContinuous({ xScale, yScale })))
            .flat();
    }

    // Request data, but with message dispatching to series-options (modules).
    protected async requestDataModel<
        D extends object,
        K extends keyof D & string = keyof D & string,
        G extends boolean | undefined = undefined,
    >(dataController: DataController, data: D[] | undefined, opts: DataModelOptions<K, boolean | undefined>) {
        // Merge properties of this series with properties of all the attached series-options
        opts.props.push(...(this.getModulePropertyDefinitions() as PropertyDefinition<K>[]));

        const { dataModel, processedData } = await dataController.request<D, K, G>(this.id, data ?? [], opts);

        this.dataModel = dataModel;
        this.processedData = processedData;
        this.dispatch('data-processed', { dataModel, processedData });
        return { dataModel, processedData };
    }

    protected isProcessedDataAnimatable() {
        const validationResults = this.processedData?.reduced?.animationValidation;
        if (!validationResults) {
            return true;
        }

        const { orderedKeys, uniqueKeys } = validationResults;
        return orderedKeys && uniqueKeys;
    }

    protected checkProcessedDataAnimatable() {
        if (!this.isProcessedDataAnimatable()) {
            this.ctx.animationManager.skipCurrentBatch();
        }
    }

    protected abstract computeFocusBounds(opts: PickFocusInputs): BBox | undefined;

    public abstract getNodeData(): TDatum[] | undefined;

    public override pickFocus(opts: PickFocusInputs): PickFocusOutputs<TDatum> | undefined {
        return this.doPickFocus(opts, this);
    }

    // The legend behaves differently for Pie and Donut series. We need to use a seriesItemEnabled
    // array to determine whether a datum has been toggled on/off using the legend.
    private doPickFocus<TSeries>(
        opts: PickFocusInputs,
        derivedSeries: TSeries & { readonly seriesItemEnabled?: readonly boolean[] }
    ): PickFocusOutputs<TDatum> | undefined {
        const nodeData = this.getNodeData();
        if (nodeData === undefined || nodeData.length === 0) {
            return undefined;
        }

        const { datumIndexDelta, seriesRect } = opts;
        const datumIndex = this.computeFocusDatumIndex(opts, nodeData, derivedSeries.seriesItemEnabled);

        const datum = nodeData[datumIndex];
        const bbox = this.computeFocusBounds({ datumIndex, datumIndexDelta, seriesRect });
        if (bbox !== undefined) {
            return { bbox, datum, datumIndex };
        }
    }

    private computeFocusDatumIndex(
        opts: PickFocusInputs,
        nodeData: TDatum[],
        seriesItemEnabled: readonly boolean[] | undefined
    ): number {
        if (nodeData.length !== seriesItemEnabled?.length) {
            Logger.error(
                `invalid state: nodeData.length (${nodeData.length} !== seriesItemEnabled.length (${seriesItemEnabled?.length})`
            );
        }
        const isDatumEnabled = (datumIndex: number): boolean => {
            return (
                nodeData[datumIndex].missing === false &&
                (seriesItemEnabled === undefined || seriesItemEnabled[datumIndex])
            );
        };

        // Search forward or backwards depending on the delta direction.
        let datumIndex: number = opts.datumIndex;
        if (opts.datumIndexDelta >= 0) {
            while (datumIndex < nodeData.length && !isDatumEnabled(datumIndex)) {
                datumIndex++;
            }
        } else {
            while (datumIndex >= 0 && !isDatumEnabled(datumIndex)) {
                datumIndex--;
            }
        }

        // datumIndex can be equal to -1 or seriesItemEnabled.length if opts.datumIndex is the first or
        // last enabled datum. If that's the case, then reverse the keyboard delta to stay on this datum.
        if (datumIndex >= 0 && datumIndex < nodeData.length) {
            return datumIndex;
        } else {
            return opts.datumIndex - opts.datumIndexDelta;
        }
    }
}
