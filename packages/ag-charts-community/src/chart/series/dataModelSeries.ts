import { clamp } from 'ag-charts-core';

import { ContinuousScale } from '../../scale/continuousScale';
import type { Scale } from '../../scale/scale';
import type { BBox } from '../../scene/bbox';
import type { Path } from '../../scene/shape/path';
import { objectsEqual } from '../../util/object';
import { ChartAxisDirection } from '../chartAxisDirection';
import type { DataController } from '../data/dataController';
import type { DataModel, DataModelOptions, ProcessedData, PropertyDefinition } from '../data/dataModel';
import type { PickFocusInputs, PickFocusOutputs, SeriesConstructorOpts, SeriesNodeDataContext } from './series';
import { Series } from './series';
import type { SeriesProperties } from './seriesProperties';
import type { SeriesNodeDatum } from './seriesTypes';

export interface DataModelSeriesNodeDatum extends SeriesNodeDatum<number> {}

export interface DataModelSeriesNodeDataContext<TDatum, TLabel = TDatum>
    extends SeriesNodeDataContext<number, TDatum, TLabel> {}

export type DataModelSeriesConstructorOpts<TProps extends SeriesProperties<any>> = SeriesConstructorOpts<TProps> & {
    categoryKey: string | undefined;
    clipFocusBox?: boolean;
};

export abstract class DataModelSeries<
    TDatum extends SeriesNodeDatum<number>,
    TProps extends SeriesProperties<any>,
    TLabel = TDatum,
    TContext extends DataModelSeriesNodeDataContext<TDatum, TLabel> = DataModelSeriesNodeDataContext<TDatum, TLabel>,
> extends Series<number, TDatum, TProps, TLabel, TContext> {
    protected dataModel?: DataModel<any, any, any>;
    protected processedData?: ProcessedData<any>;
    private readonly categoryKey: string | undefined;
    private readonly clipFocusBox: boolean;

    protected constructor({ clipFocusBox, categoryKey, ...seriesOpts }: DataModelSeriesConstructorOpts<TProps>) {
        super(seriesOpts);

        this.categoryKey = categoryKey;
        this.clipFocusBox = clipFocusBox ?? true;
    }

    dataCount() {
        return this.processedData?.dataSources?.get(this.id)?.length ?? 0;
    }

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
    >(dataController: DataController, data: D[] | undefined, opts: DataModelOptions<K, boolean | undefined, false>) {
        // Merge properties of this series with properties of all the attached series-options
        opts.props.push(...(this.getModulePropertyDefinitions() as PropertyDefinition<K>[]));

        const { dataModel, processedData } = await dataController.request<D, K, G>(this.id, data ?? [], opts);

        this.dataModel = dataModel;
        this.processedData = processedData;
        this.events.emit('data-processed', { dataModel, processedData });
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

    protected abstract computeFocusBounds(opts: PickFocusInputs): Path | BBox | undefined;

    public abstract getNodeData(): TDatum[] | undefined;

    public override pickFocus(opts: PickFocusInputs): PickFocusOutputs | undefined {
        const nodeData = this.getNodeData();
        if (nodeData === undefined || nodeData.length === 0) {
            return;
        }

        const datumIndex = this.computeFocusDatumIndex(opts, nodeData);
        if (datumIndex === undefined) {
            return;
        }

        const { clipFocusBox } = this;
        const datum = nodeData[datumIndex];
        const derivedOpts = { ...opts, datumIndex };
        const bounds = this.computeFocusBounds(derivedOpts);
        if (bounds !== undefined) {
            return { bounds, clipFocusBox, datum, datumIndex };
        }
    }

    protected isDatumEnabled(nodeData: TDatum[], datumIndex: number): boolean {
        const { missing = false, enabled = true, focusable = true } = nodeData[datumIndex];
        return !missing && enabled && focusable;
    }

    private computeFocusDatumIndex(opts: PickFocusInputs, nodeData: TDatum[]): number | undefined {
        const searchBackward = (datumIndex: number, delta: number): number | undefined => {
            while (datumIndex >= 0 && !this.isDatumEnabled(nodeData, datumIndex)) {
                datumIndex += delta;
            }
            return datumIndex === -1 ? undefined : datumIndex;
        };
        const searchForward = (datumIndex: number, delta: number): number | undefined => {
            while (datumIndex < nodeData.length && !this.isDatumEnabled(nodeData, datumIndex)) {
                datumIndex += delta;
            }
            return datumIndex === nodeData.length ? undefined : datumIndex;
        };

        // Search forward or backwards depending on the delta direction.
        let datumIndex: number | undefined;
        const clampedIndex = clamp(0, opts.datumIndex, nodeData.length - 1);
        if (opts.datumIndexDelta < 0) {
            datumIndex = searchBackward(clampedIndex, opts.datumIndexDelta);
        } else if (opts.datumIndexDelta > 0) {
            datumIndex = searchForward(clampedIndex, opts.datumIndexDelta);
        } /* opts.datumIndexDelta === 0 */ else {
            datumIndex = searchForward(clampedIndex, +1) ?? searchBackward(clampedIndex, -1);
        }

        if (datumIndex === undefined) {
            if (opts.datumIndexDelta === 0) {
                return;
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

    // Workaround - it would be nice if this difference didn't exist
    protected keysOrValues<T = any>(xKey: string): T[] {
        const key = this.dataModel!.resolveProcessedDataIndexById(this, xKey);
        return this.processedData?.keys[key]?.get(this.id) ?? this.processedData?.columns[key] ?? [];
    }

    protected getCategoryKey() {
        return this.categoryKey;
    }

    public getCategoryValue(datumIndex: number): any {
        const { processedData, dataModel } = this;
        const categoryKey = this.getCategoryKey();
        if (!processedData || !dataModel || !categoryKey) return;
        const invalid = processedData.invalidData?.get(this.id)?.[datumIndex] ?? false;
        return invalid ? undefined : this.keysOrValues(categoryKey)[datumIndex];
    }

    public datumIndexForCategoryValue(categoryValue: any): number | undefined {
        const { processedData, dataModel } = this;
        const categoryKey = this.getCategoryKey();
        if (!processedData || !dataModel || !categoryKey) return;

        categoryValue = categoryValue.valueOf();
        const invalidValues = processedData.invalidData?.get(this.id);
        const xValues = this.keysOrValues(categoryKey);
        for (let datumIndex = 0; datumIndex < xValues.length; datumIndex += 1) {
            if (invalidValues?.[datumIndex] === true) continue;

            const xValue = xValues[datumIndex]?.valueOf();
            // Handle grouped category values
            if (objectsEqual(categoryValue, xValue)) return datumIndex;
        }
    }
}
