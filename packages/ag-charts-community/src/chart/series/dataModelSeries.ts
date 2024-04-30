import { ContinuousScale } from '../../scale/continuousScale';
import type { Scale } from '../../scale/scale';
import type { BBox } from '../../scene/bbox';
import { clamp } from '../../util/number';
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
    protected showFocusBox: boolean = true;

    protected getScaleInformation({
        xScale,
        yScale,
    }: {
        xScale?: Scale<any, any, any>;
        yScale?: Scale<any, any, any>;
    }) {
        const isContinuousX = ContinuousScale.is(xScale);
        const isContinuousY = ContinuousScale.is(yScale);
        return { isContinuousX, isContinuousY, xScaleType: xScale?.type, yScaleType: yScale?.type };
    }

    private getModulePropertyDefinitions() {
        const xScale = this.axes[ChartAxisDirection.X]?.scale;
        const yScale = this.axes[ChartAxisDirection.Y]?.scale;
        return this.moduleMap
            .mapModules((mod) => mod.getPropertyDefinitions(this.getScaleInformation({ xScale, yScale })))
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
        const nodeData = this.getNodeData();
        if (nodeData === undefined || nodeData.length === 0) {
            return undefined;
        }

        const { datumIndexDelta, seriesRect } = opts;
        const datumIndex = this.computeFocusDatumIndex(opts, nodeData);
        if (datumIndex === undefined) {
            return undefined;
        }

        const { showFocusBox } = this;
        const datum = nodeData[datumIndex];
        const bbox = this.computeFocusBounds({ datumIndex, datumIndexDelta, seriesRect });
        if (bbox !== undefined) {
            return { bbox, showFocusBox, datum, datumIndex };
        }
    }

    private computeFocusDatumIndex(opts: PickFocusInputs, nodeData: TDatum[]): number | undefined {
        const isDatumEnabled = (datumIndex: number): boolean => {
            const { missing = false, enabled = true } = nodeData[datumIndex];
            return !missing && enabled;
        };
        const searchBackward = (datumIndex: number): number | undefined => {
            while (datumIndex >= 0 && !isDatumEnabled(datumIndex)) {
                datumIndex--;
            }
            return datumIndex === -1 ? undefined : datumIndex;
        };
        const searchForward = (datumIndex: number): number | undefined => {
            while (datumIndex < nodeData.length && !isDatumEnabled(datumIndex)) {
                datumIndex++;
            }
            return datumIndex === nodeData.length ? undefined : datumIndex;
        };

        // Search forward or backwards depending on the delta direction.
        let datumIndex: number | undefined;
        const clampedIndex = clamp(0, opts.datumIndex, nodeData.length - 1);
        if (opts.datumIndexDelta < 0) {
            datumIndex = searchBackward(clampedIndex);
        } else if (opts.datumIndexDelta > 0) {
            datumIndex = searchForward(clampedIndex);
        } /* opts.datumIndexDelta === 0 */ else {
            datumIndex ??= searchForward(clampedIndex);
            datumIndex ??= searchBackward(clampedIndex);
        }

        if (datumIndex === undefined) {
            if (opts.datumIndexDelta === 0) {
                return undefined;
            } else {
                // If datumIndex is undefined, then this datum is the first or last enabled datum.
                // last enabled datum. If that's the case, then reverse the keyboard delta to stay on
                // this datum.
                return opts.datumIndex - opts.datumIndexDelta;
            }
        } else {
            return datumIndex;
        }
    }
}
