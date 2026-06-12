import { ENABLE_HOT_RELOAD, PRODUCTION_SITE_URLS, SITE_BASE_URL, SITE_URL, STAGING_SITE_URL } from '../constants';

export { GRID_STAGING_SITE_URL } from '../constants';

export const getIsDev = () => import.meta.env?.DEV;
export const getHmrEnabled = () => ENABLE_HOT_RELOAD && getIsDev();
export const getIsStaging = () => SITE_URL === STAGING_SITE_URL;
/**
 * Production environment, including archive
 */
export const getIsProduction = () => PRODUCTION_SITE_URLS.includes(SITE_URL);
export const getIsArchive = () => getIsProduction() && SITE_BASE_URL.includes('archive');

/**
 * Benchmark-only builds emit just the `/vanilla/benchmarks` example pages and the
 * `dev/` library bundles, skipping all other static paths — building the full site
 * would dominate benchmark CI wall-clock time.
 *
 * Read from `process.env` (guarded): the flag is only meaningful during the
 * build-time `getStaticPaths` pass, never in client code.
 */
export const getIsBenchmarkOnlyBuild = () =>
    typeof process !== 'undefined' && ['1', 'true'].includes(process.env.AG_BENCHMARK_ONLY_BUILD ?? '');
