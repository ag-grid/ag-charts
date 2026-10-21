import type { ChartAxis } from '../chartAxis';
import { CrossLinesPlugin } from './crossLinesPlugin';

/**
 * Resolves the {@link CrossLinesPlugin} attached to an axis, if any. Used by chart-level callers
 * (cartesian chart's overflow handling, the navigator mini-chart, the keyboard proxies) that need to interact with
 * cross-lines without the axis carrying a typed plugin reference.
 */
export function getCrossLinesPlugin(axis: ChartAxis): CrossLinesPlugin | undefined {
    // The enterprise polar module shares the plugin class under its own registry name.
    const moduleMap = axis.getModuleMap();
    const module = moduleMap.getModule('crossLines') ?? moduleMap.getModule('polarCrossLines');
    return module instanceof CrossLinesPlugin ? module : undefined;
}
