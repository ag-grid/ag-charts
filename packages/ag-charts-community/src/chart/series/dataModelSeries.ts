import type { Scale } from 'ag-charts-core';
import { ChartAxisDirection, type Point, clamp, objectsEqual } from 'ag-charts-core';
import type { AgActiveItemState } from 'ag-charts-types';

import { ContinuousScale } from '../../scale/continuousScale';
import type { BBox } from '../../scene/bbox';
import type { Path } from '../../scene/shape/path';
import type { DataController } from '../data/dataController';
import type { DataModel, DataModelOptions, ProcessedData } from '../data/dataModel';
import type { PropertyDefinition } from '../data/dataModelTypes';
import { DataSet } from '../data/dataSet';
import type { PickFocusInputs, PickFocusOutputs, SeriesNodePickMatch } from './pickTypes';
import { SeriesNodeDatumSentinel } from './pickTypes';
import type { SeriesConstructorOpts, SeriesNodeDataContext } from './series';
import { Series } from './series';
import { type SeriesNodeDatum } from './seriesTypes';
import { findNodeDatumInArray } from './util';

export interface DataModelSeriesNodeDatum extends SeriesNodeDatum {
    // Optional: only aggregated series (e.g. histogram bins) set it; 1:1 series match on datumIndex instead.
    itemId?: string;
}

export interface DataModelSeriesNodeDataContext<TDatum, TLabel = TDatum> extends SeriesNodeDataContext<
    TDatum,
    TLabel
> {}

export type DataModelSeriesConstructorOpts<TOpts extends object> = SeriesConstructorOpts<TOpts> & {
    categoryKey: string | undefined;
    clipFocusBox?: boolean;
};

export abstract class DataModelSeries<
    TDatum extends SeriesNodeDatum,
    TOpts extends object,
    TLabel = TDatum,
    TContext extends DataModelSeriesNodeDataContext<TDatum, TLabel> = DataModelSeriesNodeDataContext<TDatum, TLabel>,
> extends Series<TDatum, TOpts, TLabel, TContext> {
    protected dataModel?: DataModel<any, any, any>;
    protected processedData?: ProcessedData<any>;
    private categoryValueLookup?: {
        xValues: any[];
        invalidValues: boolean[] | undefined;
        byValue: CategoryValueIndex;
    };
    private readonly categoryKey: string | undefined;
    private readonly clipFocusBox: boolean;

    protected constructor({ clipFocusBox, categoryKey, ...seriesOpts }: DataModelSeriesConstructorOpts<TOpts>) {
        super(seriesOpts);

        this.categoryKey = categoryKey;
        this.clipFocusBox = clipFocusBox ?? true;
    }

    dataCount() {
        return this.processedData?.dataSources?.get(this.id)?.data?.length ?? 0;
    }

    invalidDataCount() {
        return this.processedData?.invalidDataCount?.get(this.id) ?? 0;
    }

    missingDataCount() {
        return this.dataModel?.resolveMissingDataCount(this) ?? 0;
    }

    override get hasData() {
        return Math.max(0, this.dataCount() - this.invalidDataCount() - this.missingDataCount()) > 0;
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
            .mapModules((m) => m.getPropertyDefinitions(this.getScaleInformation({ xScale, yScale })))
            .flat();
    }

    // Request data, but with message dispatching to series-options (modules).
    protected async requestDataModel<
        D extends object,
        K extends keyof D & string = keyof D & string,
        G extends boolean | undefined = undefined,
    >(
        dataController: DataController,
        dataSet: DataSet<D> | undefined,
        opts: DataModelOptions<K, boolean | undefined, false>
    ) {
        // Merge properties of this series with properties of all the attached series-options
        opts.props.push(...(this.getModulePropertyDefinitions() as PropertyDefinition<K>[]));

        dataSet ??= DataSet.empty(this.ctx.logger);
        const { dataModel, processedData } = await dataController.request<D, K, G>(this.id, dataSet, opts);

        this.dataModel = dataModel;
        this.processedData = processedData;
        // Incremental reprocessing mutates the existing columns, so identity alone cannot detect the change.
        this.categoryValueLookup = undefined;
        this.events.emit('data-processed', { dataModel, processedData });
        return { dataModel, processedData };
    }

    protected isProcessedDataAnimatable() {
        const { processedData, ctx } = this;
        if (!processedData) return false;

        const nodeData = this.getNodeData();
        if (nodeData != null && nodeData.length > ctx.animationManager.maxAnimatableItems) return false;

        const validationResults = processedData.reduced?.animationValidation;
        if (!validationResults) return true;

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

    override findNodeDatum(itemId: AgActiveItemState['itemId']): TDatum | undefined {
        return findNodeDatumInArray(itemId, this.getNodeData(), this.data?.dataIdKey);
    }

    public override pickFocus(opts: PickFocusInputs): PickFocusOutputs | undefined {
        const nodeData = this.getNodeData();
        if (nodeData === undefined || nodeData.length === 0) {
            return;
        }

        const { clipFocusBox } = this;
        const { datum, datumIndex } = this.findFocus(opts, nodeData);
        const derivedOpts = { ...opts, datumIndex };
        const bounds = this.computeFocusBounds(derivedOpts);
        if (bounds !== undefined) {
            return { bounds, clipFocusBox, datum, datumIndex };
        }
    }

    protected override pickNodesExactShape(point: Point): SeriesNodePickMatch[] {
        const matches = super.pickNodesExactShape(point);
        matches.sort((a, b) => a.datum.datumIndex - b.datum.datumIndex);
        return matches;
    }

    protected isDatumEnabled(nodeData: TDatum[], nodeDatumIndex: number): boolean {
        const { missing = false, enabled = true, focusable = true } = nodeData[nodeDatumIndex];
        return !missing && enabled && focusable;
    }

    private findNodeDataIndexBounds(targetDatumIndex: number, nodeData: TDatum[]) {
        if (nodeData.length === 0) return [undefined, undefined];

        const result: [undefined | number, undefined | number] = [undefined, undefined];
        let low = 0;
        let upp = nodeData.length - 1;
        while (low <= upp) {
            const mid = (low + upp) >> 1;
            const midNode = nodeData[mid];
            if (midNode.datumIndex < targetDatumIndex) {
                result[0] = mid;
                low = mid + 1;
            } else if (midNode.datumIndex > targetDatumIndex) {
                result[1] = mid;
                upp = mid - 1;
            } /* midNode.datumIndex === targetDatumIndex */ else {
                // Exact match found, but there might be duplicate `datumIndex` entries (e.g. range-area), so search for
                // the 1st duplicate:
                let firstIdx = mid;
                while (firstIdx > 0 && nodeData[firstIdx - 1].datumIndex === targetDatumIndex) {
                    firstIdx--;
                }
                return [firstIdx, firstIdx];
            }
        }
        return result;
    }

    private findFocus(opts: PickFocusInputs, nodeData: TDatum[]): Pick<PickFocusOutputs, 'datum' | 'datumIndex'> {
        const clampedDatumIndex = clamp(0, opts.datumIndex, this.dataCount() - 1);
        const [lower, upper] = this.findNodeDataIndexBounds(clampedDatumIndex, nodeData);

        const searchBackward = (nodeDatumIndex: number, delta: number): number | undefined => {
            while (nodeDatumIndex >= 0 && !this.isDatumEnabled(nodeData, nodeDatumIndex)) {
                nodeDatumIndex += delta;
            }
            return nodeDatumIndex === -1 ? undefined : nodeDatumIndex;
        };
        const searchForward = (nodeDatumIndex: number, delta: number): number | undefined => {
            while (nodeDatumIndex < nodeData.length && !this.isDatumEnabled(nodeData, nodeDatumIndex)) {
                nodeDatumIndex += delta;
            }
            return nodeDatumIndex === nodeData.length ? undefined : nodeDatumIndex;
        };

        let nextNodeIndex: number | undefined;
        // Search forward or backwards depending on the delta direction.
        if (lower !== undefined && upper !== undefined) {
            if (opts.datumIndexDelta < 0) {
                nextNodeIndex = searchBackward(lower, opts.datumIndexDelta);
            } else if (opts.datumIndexDelta > 0) {
                nextNodeIndex = searchForward(upper, opts.datumIndexDelta);
            } /* opts.datumIndexDelta === 0 */ else {
                if (nodeData[lower].datumIndex === clampedDatumIndex) {
                    nextNodeIndex = lower;
                }
                if (nodeData[upper].datumIndex === clampedDatumIndex) {
                    nextNodeIndex = upper;
                }
            }
        }

        if (nextNodeIndex === undefined) {
            return { datum: SeriesNodeDatumSentinel.CULLED, datumIndex: clampedDatumIndex };
        } else {
            const nextNode = nodeData[nextNodeIndex];
            return { datum: nextNode, datumIndex: nextNode.datumIndex };
        }
    }

    // Workaround - it would be nice if this difference didn't exist
    private dataModelPropertyIsKey(key: string) {
        const { processedData } = this;
        if (!processedData) return false;
        return processedData.defs.keys.some((def) => def.id === key && def.idsMap?.get(this.id)?.has(key) === true);
    }

    protected keysOrValues<T = any>(xKey: string): T[] {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) return [];
        return this.dataModelPropertyIsKey(xKey)
            ? dataModel.resolveKeysById(this, xKey, processedData)
            : dataModel.resolveColumnById(this, xKey, processedData, 'object');
    }

    protected sortOrder(xKey: string): -1 | 1 | undefined {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) return;
        return this.dataModelPropertyIsKey(xKey)
            ? dataModel.getKeySortOrder(this, xKey, processedData)
            : dataModel.getColumnSortOrder(this, xKey, processedData);
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

        const byValue = this.categoryValueIndex(xValues, invalidValues);
        if (byValue != null) return byValue.get(categoryValue);

        for (let datumIndex = 0; datumIndex < xValues.length; datumIndex += 1) {
            if (invalidValues?.[datumIndex] === true) continue;

            const xValue = xValues[datumIndex]?.valueOf();
            // Handle grouped category values
            if (objectsEqual(categoryValue, xValue)) return datumIndex;
        }
    }

    /**
     * OPTIMIZATION: shared category grouping resolves every series against the hovered category on each
     * highlight change, so scanning per lookup costs O(series x datums) per pointer move.
     */
    private categoryValueIndex(xValues: any[], invalidValues: boolean[] | undefined): CategoryValueIndex {
        let lookup = this.categoryValueLookup;
        if (lookup?.xValues !== xValues || lookup.invalidValues !== invalidValues) {
            lookup = { xValues, invalidValues, byValue: buildCategoryValueIndex(xValues, invalidValues) };
            this.categoryValueLookup = lookup;
        }
        return lookup.byValue;
    }
}

/** `undefined` for non-primitive category values, which only `objectsEqual` can compare. */
type CategoryValueIndex = Map<unknown, number> | undefined;

function buildCategoryValueIndex(xValues: any[], invalidValues: boolean[] | undefined): CategoryValueIndex {
    const byValue = new Map<unknown, number>();
    for (let datumIndex = 0; datumIndex < xValues.length; datumIndex += 1) {
        if (invalidValues?.[datumIndex] === true) continue;

        const xValue = xValues[datumIndex]?.valueOf();
        if (xValue !== null && typeof xValue === 'object') return undefined;
        // `Map` matches NaN against itself where the `objectsEqual` fallback does not.
        if (typeof xValue === 'number' && Number.isNaN(xValue)) continue;
        if (!byValue.has(xValue)) byValue.set(xValue, datumIndex);
    }
    return byValue;
}
