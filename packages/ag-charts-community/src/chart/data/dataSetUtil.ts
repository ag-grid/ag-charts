import type { IDataSelectionService } from './dataSelectionServiceTypes';
import { DataSet } from './dataSet';

/**
 * @returns A deep clone of the DataSet. Selection state is preserved only when
 * `dataIdKey` is set (transferred via key mapping). Without `dataIdKey`, selections
 * are dropped because index-based transfer cannot guarantee correctness after the
 * clone's data is independently mutated.
 */
export function deepCloneDataSet<T = unknown>(service: IDataSelectionService | undefined, src: DataSet<T>): DataSet<T> {
    const clone = new DataSet<T>([...src.data], src.dataIdKey);
    service?.transferDataSet(clone, src);
    return clone;
}

/**
 * Create a new DataSet, transferring persistent state from a predecessor.
 * For subclasses that take additional constructor args (e.g. HierarchyDataSet),
 * use the two-phase pattern: construct, then call `transferFrom()` explicitly.
 */
export function replaceDataSet<T = unknown>(
    service: IDataSelectionService | undefined,
    src: DataSet<T> | undefined,
    data: T[],
    dataIdKey: string | undefined
): DataSet<T> {
    const dst = new DataSet<T>(data, dataIdKey);
    if (src) service?.transferDataSet(dst, src);
    return dst;
}
