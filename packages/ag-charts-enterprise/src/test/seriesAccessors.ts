import { type ChartOrProxy, deproxy } from 'ag-charts-community-test';
import { classCast } from 'ag-charts-test';

import { type HierarchyNode, HierarchySeries } from '../series/hierarchy/hierarchySeries';

/**
 * The root of the tree a hierarchy series (treemap, sunburst) built from its data, `undefined` before the series has
 * laid out. Fails for a series that is not a hierarchy series.
 */
export function getHierarchyRootNode(chartOrProxy: ChartOrProxy<any>, index = 0): HierarchyNode | undefined {
    return classCast(deproxy(chartOrProxy).series[index], HierarchySeries).rootNode;
}
