import type { ChartAxis } from '../chartAxis';
import { CrossLinesPlugin } from './crossLinesPlugin';

/**
 * Resolves the {@link CrossLinesPlugin} attached to an axis, if any. Used by chart-level callers
 * (cartesian chart's overflow handling, the navigator mini-chart) that need to interact with
 * cross-lines without the axis carrying a typed plugin reference.
 */
export function getCrossLinesPlugin(axis: ChartAxis): CrossLinesPlugin | undefined {
    const module = axis.getModuleMap().getModule('crossLines');
    return module instanceof CrossLinesPlugin ? module : undefined;
}
