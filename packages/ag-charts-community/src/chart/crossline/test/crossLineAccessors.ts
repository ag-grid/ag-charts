import type { ChartAxis } from '../../chartAxis';
import type { CrossLine } from '../crossLine';
import type { CrossLinesPlugin } from '../crossLinesPlugin';

// `CartesianCrossLine.fitted` is the private cache (other cross line kinds have none) of the label as fitted to its `maxWidth`/`maxHeight`.
interface FittedLabelHost {
    fitted?: object;
}

/**
 * The cache of the cross line's label fitted to its size limits, `undefined` until a label has been fitted. The cache
 * is replaced, never edited, when the label has to be fitted again, so a different object means a refit.
 */
export function getCrossLineFittedLabel(crossLine: CrossLine): object | undefined {
    return (crossLine as unknown as FittedLabelHost).fitted;
}

/** The cross-lines plugin of `axis`, registered as `crossLines` on cartesian axes and `polarCrossLines` on polar ones. */
export function getCrossLinesPlugin(axis: ChartAxis): CrossLinesPlugin | undefined {
    const moduleMap = axis.getModuleMap();
    return (
        moduleMap.getModule<CrossLinesPlugin>('crossLines') ?? moduleMap.getModule<CrossLinesPlugin>('polarCrossLines')
    );
}
