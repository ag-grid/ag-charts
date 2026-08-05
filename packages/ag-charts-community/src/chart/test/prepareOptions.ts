import { ambientLog } from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import { ChartOptions } from '../../module/optionsModule';
import { __clearStructuralCacheForTests } from '../../module/optionsStructuralCache';
import { __clearSanitizedThemeCacheForTests } from '../factory/processModuleOptions';

/**
 * Resolves user options through the options graph without constructing a chart. `validationIssues` comes back
 * with the tree because it is the only channel that reports a refused value unconditionally.
 *
 * The three caches are cleared per call because each one can swallow a diagnostic that a caller comparing two
 * resolutions needs: `*Once` messages dedupe for the life of the process, a structural-cache hit skips the
 * validation loops outright, and a sanitized theme is reused verbatim. Resetting here rather than in the
 * caller is deliberate — the ambient logger is a per-module-instance singleton, so only a reset from inside
 * this package reaches the instance the options graph logs through.
 */
export function prepareProcessedOptions(options: unknown) {
    ambientLog.reset();
    __clearStructuralCacheForTests();
    __clearSanitizedThemeCacheForTests();

    const { processedOptions, validationIssues } = new ChartOptions(
        options as AgChartOptions,
        {} as AgChartOptions,
        {},
        {},
        {}
    );
    return { processedOptions, validationIssues };
}
