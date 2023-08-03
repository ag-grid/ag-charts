import React from 'react';
import {
    agChartsAngularVersion,
    agChartsReactVersion,
    agChartsVersion,
    agChartsVueVersion,
    agGridAngularVersion,
    agGridReactVersion,
    agGridVersion,
    agGridVue3Version,
    agGridVueVersion,
    agGridEnterpriseVersion,
    SITE_BASE_URL,
    DEV_FILE_BASE_PATH,
} from '../../../../constants';
import { pathJoin } from '../../../../utils/pathJoin';

import { isUsingPublishedPackages, isBuildServerBuild, isPreProductionBuild } from '../../../../utils/pages';

const localPrefix = pathJoin(import.meta.env?.SITE_URL, SITE_BASE_URL, DEV_FILE_BASE_PATH);

const localConfiguration = {
    gridMap: {
        '@ag-grid-community/styles': `${localPrefix}/@ag-grid-community/styles`,
        '@ag-grid-community/react': `${localPrefix}/@ag-grid-community/react`,
        '@ag-grid-community/angular': `${localPrefix}/@ag-grid-community/angular`,
        '@ag-grid-community/vue': `${localPrefix}/@ag-grid-community/vue`,
        '@ag-grid-community/vue3': `${localPrefix}/@ag-grid-community/vue3`,
        'ag-charts-react': `${localPrefix}/ag-charts-react`,
        'ag-charts-angular': `${localPrefix}/ag-charts-angular`,
        'ag-charts-vue': `${localPrefix}/ag-charts-vue`,
        'ag-charts-vue3': `${localPrefix}/ag-charts-vue3`,
        'ag-grid-community': `${localPrefix}/ag-grid-community`,
        'ag-grid-enterprise': `${localPrefix}/ag-grid-enterprise`,
        'ag-grid-angular': `${localPrefix}/ag-grid-angular`,
        'ag-grid-react': `${localPrefix}/ag-grid-react`,
        'ag-grid-vue': `${localPrefix}/ag-grid-vue`,
        'ag-grid-vue3': `${localPrefix}/ag-grid-vue3`,
    },
    gridCommunityPaths: {
        /* START OF GRID COMMUNITY MODULES PATHS DEV - DO NOT DELETE */
        '@ag-grid-community/client-side-row-model': `${localPrefix}/@ag-grid-community/client-side-row-model/dist/client-side-row-model.cjs.js`,
        '@ag-grid-community/core': `${localPrefix}/@ag-grid-community/core/dist/core.cjs.js`,
        '@ag-grid-community/csv-export': `${localPrefix}/@ag-grid-community/csv-export/dist/csv-export.cjs.js`,
        '@ag-grid-community/infinite-row-model': `${localPrefix}/@ag-grid-community/infinite-row-model/dist/infinite-row-model.cjs.js`,
        /* END OF GRID COMMUNITY MODULES PATHS DEV - DO NOT DELETE */
        'ag-charts-community': `${localPrefix}/ag-charts-community/dist/ag-charts-community.cjs.js`,
    },
    gridEnterprisePaths: {
        /* START OF GRID ENTERPRISE MODULES PATHS DEV - DO NOT DELETE */
        '@ag-grid-community/client-side-row-model': `${localPrefix}/@ag-grid-community/client-side-row-model/dist/client-side-row-model.cjs.js`,
        '@ag-grid-community/core': `${localPrefix}/@ag-grid-community/core/dist/core.cjs.js`,
        '@ag-grid-community/csv-export': `${localPrefix}/@ag-grid-community/csv-export/dist/csv-export.cjs.js`,
        '@ag-grid-community/infinite-row-model': `${localPrefix}/@ag-grid-community/infinite-row-model/dist/infinite-row-model.cjs.js`,
        '@ag-grid-enterprise/charts': `${localPrefix}/@ag-grid-enterprise/charts/dist/charts.cjs.js`,
        '@ag-grid-enterprise/clipboard': `${localPrefix}/@ag-grid-enterprise/clipboard/dist/clipboard.cjs.js`,
        '@ag-grid-enterprise/column-tool-panel': `${localPrefix}/@ag-grid-enterprise/column-tool-panel/dist/column-tool-panel.cjs.js`,
        '@ag-grid-enterprise/core': `${localPrefix}/@ag-grid-enterprise/core/dist/core.cjs.js`,
        '@ag-grid-enterprise/excel-export': `${localPrefix}/@ag-grid-enterprise/excel-export/dist/excel-export.cjs.js`,
        '@ag-grid-enterprise/filter-tool-panel': `${localPrefix}/@ag-grid-enterprise/filter-tool-panel/dist/filter-tool-panel.cjs.js`,
        '@ag-grid-enterprise/master-detail': `${localPrefix}/@ag-grid-enterprise/master-detail/dist/master-detail.cjs.js`,
        '@ag-grid-enterprise/menu': `${localPrefix}/@ag-grid-enterprise/menu/dist/menu.cjs.js`,
        '@ag-grid-enterprise/multi-filter': `${localPrefix}/@ag-grid-enterprise/multi-filter/dist/multi-filter.cjs.js`,
        '@ag-grid-enterprise/range-selection': `${localPrefix}/@ag-grid-enterprise/range-selection/dist/range-selection.cjs.js`,
        '@ag-grid-enterprise/rich-select': `${localPrefix}/@ag-grid-enterprise/rich-select/dist/rich-select.cjs.js`,
        '@ag-grid-enterprise/row-grouping': `${localPrefix}/@ag-grid-enterprise/row-grouping/dist/row-grouping.cjs.js`,
        '@ag-grid-enterprise/server-side-row-model': `${localPrefix}/@ag-grid-enterprise/server-side-row-model/dist/server-side-row-model.cjs.js`,
        '@ag-grid-enterprise/set-filter': `${localPrefix}/@ag-grid-enterprise/set-filter/dist/set-filter.cjs.js`,
        '@ag-grid-enterprise/side-bar': `${localPrefix}/@ag-grid-enterprise/side-bar/dist/side-bar.cjs.js`,
        '@ag-grid-enterprise/sparklines': `${localPrefix}/@ag-grid-enterprise/sparklines/dist/sparklines.cjs.js`,
        '@ag-grid-enterprise/status-bar': `${localPrefix}/@ag-grid-enterprise/status-bar/dist/status-bar.cjs.js`,
        '@ag-grid-enterprise/viewport-row-model': `${localPrefix}/@ag-grid-enterprise/viewport-row-model/dist/viewport-row-model.cjs.js`,
        /* END OF GRID ENTERPRISE MODULES PATHS DEV - DO NOT DELETE */
        'ag-charts-community': `${localPrefix}/ag-charts-community/dist/ag-charts-community.cjs.js`,
        'ag-charts-enterprise': `${localPrefix}/ag-charts-enterprise/dist/ag-charts-enterprise.cjs.js`,
    },
    chartMap: {
        'ag-charts-react': `${localPrefix}/ag-charts-react`,
        'ag-charts-angular': `${localPrefix}/ag-charts-angular`,
        'ag-charts-vue': `${localPrefix}/ag-charts-vue`,
        'ag-charts-vue3': `${localPrefix}/ag-charts-vue3`,
    },
    chartPaths: {
        'ag-charts-community': `${localPrefix}/ag-charts-community/dist/ag-charts-community.cjs.js`,
        'ag-charts-enterprise': `${localPrefix}/ag-charts-enterprise/dist/ag-charts-enterprise.cjs.js`,
    },
};

const buildAndArchivesConfiguration = {
    gridMap: {
        '@ag-grid-community/styles': `${localPrefix}/@ag-grid-community/styles`,
        '@ag-grid-community/react': `${localPrefix}/@ag-grid-community/react`,
        '@ag-grid-community/angular': `${localPrefix}/@ag-grid-community/angular`,
        '@ag-grid-community/vue': `${localPrefix}/@ag-grid-community/vue`,
        '@ag-grid-community/vue3': `${localPrefix}/@ag-grid-community/vue3`,
        'ag-charts-react': `${localPrefix}/ag-charts-react`,
        'ag-charts-angular': `${localPrefix}/ag-charts-angular`,
        'ag-charts-vue': `${localPrefix}/ag-charts-vue`,
        'ag-charts-vue3': `${localPrefix}/ag-charts-vue3`,
        'ag-grid-community': `${localPrefix}/ag-grid-community`,
        'ag-grid-enterprise': `${localPrefix}/ag-grid-enterprise`,
        'ag-grid-angular': `${localPrefix}/ag-grid-angular`,
        'ag-grid-react': `${localPrefix}/ag-grid-react`,
        'ag-grid-vue': `${localPrefix}/ag-grid-vue`,
        'ag-grid-vue3': `${localPrefix}/ag-grid-vue3`,
    },
    gridCommunityPaths: {
        /* START OF GRID COMMUNITY MODULES PATHS DEV - DO NOT DELETE */
        '@ag-grid-community/client-side-row-model': `${localPrefix}/@ag-grid-community/client-side-row-model/dist/client-side-row-model.cjs.js`,
        '@ag-grid-community/core': `${localPrefix}/@ag-grid-community/core/dist/core.cjs.js`,
        '@ag-grid-community/csv-export': `${localPrefix}/@ag-grid-community/csv-export/dist/csv-export.cjs.js`,
        '@ag-grid-community/infinite-row-model': `${localPrefix}/@ag-grid-community/infinite-row-model/dist/infinite-row-model.cjs.js`,
        /* END OF GRID COMMUNITY MODULES PATHS DEV - DO NOT DELETE */
        'ag-charts-community': `${localPrefix}/ag-charts-community/dist/ag-charts-community.cjs.js`,
    },
    gridEnterprisePaths: {
        /* START OF GRID ENTERPRISE MODULES PATHS DEV - DO NOT DELETE */
        '@ag-grid-community/client-side-row-model': `${localPrefix}/@ag-grid-community/client-side-row-model/dist/client-side-row-model.cjs.js`,
        '@ag-grid-community/core': `${localPrefix}/@ag-grid-community/core/dist/core.cjs.js`,
        '@ag-grid-community/csv-export': `${localPrefix}/@ag-grid-community/csv-export/dist/csv-export.cjs.js`,
        '@ag-grid-community/infinite-row-model': `${localPrefix}/@ag-grid-community/infinite-row-model/dist/infinite-row-model.cjs.js`,
        '@ag-grid-enterprise/charts': `${localPrefix}/@ag-grid-enterprise/charts/dist/charts.cjs.js`,
        '@ag-grid-enterprise/clipboard': `${localPrefix}/@ag-grid-enterprise/clipboard/dist/clipboard.cjs.js`,
        '@ag-grid-enterprise/column-tool-panel': `${localPrefix}/@ag-grid-enterprise/column-tool-panel/dist/column-tool-panel.cjs.js`,
        '@ag-grid-enterprise/core': `${localPrefix}/@ag-grid-enterprise/core/dist/core.cjs.js`,
        '@ag-grid-enterprise/excel-export': `${localPrefix}/@ag-grid-enterprise/excel-export/dist/excel-export.cjs.js`,
        '@ag-grid-enterprise/filter-tool-panel': `${localPrefix}/@ag-grid-enterprise/filter-tool-panel/dist/filter-tool-panel.cjs.js`,
        '@ag-grid-enterprise/master-detail': `${localPrefix}/@ag-grid-enterprise/master-detail/dist/master-detail.cjs.js`,
        '@ag-grid-enterprise/menu': `${localPrefix}/@ag-grid-enterprise/menu/dist/menu.cjs.js`,
        '@ag-grid-enterprise/multi-filter': `${localPrefix}/@ag-grid-enterprise/multi-filter/dist/multi-filter.cjs.js`,
        '@ag-grid-enterprise/range-selection': `${localPrefix}/@ag-grid-enterprise/range-selection/dist/range-selection.cjs.js`,
        '@ag-grid-enterprise/rich-select': `${localPrefix}/@ag-grid-enterprise/rich-select/dist/rich-select.cjs.js`,
        '@ag-grid-enterprise/row-grouping': `${localPrefix}/@ag-grid-enterprise/row-grouping/dist/row-grouping.cjs.js`,
        '@ag-grid-enterprise/server-side-row-model': `${localPrefix}/@ag-grid-enterprise/server-side-row-model/dist/server-side-row-model.cjs.js`,
        '@ag-grid-enterprise/set-filter': `${localPrefix}/@ag-grid-enterprise/set-filter/dist/set-filter.cjs.js`,
        '@ag-grid-enterprise/side-bar': `${localPrefix}/@ag-grid-enterprise/side-bar/dist/side-bar.cjs.js`,
        '@ag-grid-enterprise/sparklines': `${localPrefix}/@ag-grid-enterprise/sparklines/dist/sparklines.cjs.js`,
        '@ag-grid-enterprise/status-bar': `${localPrefix}/@ag-grid-enterprise/status-bar/dist/status-bar.cjs.js`,
        '@ag-grid-enterprise/viewport-row-model': `${localPrefix}/@ag-grid-enterprise/viewport-row-model/dist/viewport-row-model.cjs.js`,
        /* END OF GRID ENTERPRISE MODULES PATHS DEV - DO NOT DELETE */
        'ag-charts-community': `${localPrefix}/ag-charts-community/dist/ag-charts-community.cjs.js`,
        'ag-charts-enterprise': `${localPrefix}/ag-charts-enterprise/dist/ag-charts-enterprise.cjs.js`,
    },
    chartMap: {
        'ag-charts-react': `${localPrefix}/ag-charts-react`,
        'ag-charts-angular': `${localPrefix}/ag-charts-angular`,
        'ag-charts-vue': `${localPrefix}/ag-charts-vue`,
        'ag-charts-vue3': `${localPrefix}/ag-charts-vue3`,
    },
    chartPaths: {
        'ag-charts-community': `${localPrefix}/ag-charts-community/dist/ag-charts-community.cjs.js`,
        'ag-charts-enterprise': `${localPrefix}/ag-charts-enterprise/dist/ag-charts-enterprise.cjs.js`,
    },
};

const NPM_CDN = 'https://cdn.jsdelivr.net/npm';

const publishedConfiguration = {
    gridMap: {
        '@ag-grid-community/styles': `${NPM_CDN}/@ag-grid-community/styles@${agGridVersion}`,
        '@ag-grid-community/react': `${NPM_CDN}/@ag-grid-community/react@${agGridReactVersion}/`,
        '@ag-grid-community/angular': `${NPM_CDN}/@ag-grid-community/angular@${agGridAngularVersion}/`,
        '@ag-grid-community/vue': `${NPM_CDN}/@ag-grid-community/vue@${agGridVueVersion}/`,
        '@ag-grid-community/vue3': `${NPM_CDN}/@ag-grid-community/vue3@${agGridVue3Version}/`,
        'ag-grid-community': `${NPM_CDN}/ag-grid-community@${agGridVersion}`,
        'ag-grid-enterprise': `${NPM_CDN}/ag-grid-enterprise@${agGridEnterpriseVersion}/`,
        'ag-grid-angular': `${NPM_CDN}/ag-grid-angular@${agGridAngularVersion}/`,
        'ag-grid-react': `${NPM_CDN}/ag-grid-react@${agGridReactVersion}/`,
        'ag-grid-vue': `${NPM_CDN}/ag-grid-vue@${agGridVueVersion}/`,
        'ag-grid-vue3': `${NPM_CDN}/ag-grid-vue3@${agGridVue3Version}/`,
    },
    gridCommunityPaths: {
        /* START OF GRID COMMUNITY MODULES PATHS PROD - DO NOT DELETE */
        '@ag-grid-community/client-side-row-model': `https://cdn.jsdelivr.net/npm/@ag-grid-community/client-side-row-model@${agGridVersion}/dist/client-side-row-model.cjs.min.js`,
        '@ag-grid-community/core': `https://cdn.jsdelivr.net/npm/@ag-grid-community/core@${agGridVersion}/dist/core.cjs.min.js`,
        '@ag-grid-community/csv-export': `https://cdn.jsdelivr.net/npm/@ag-grid-community/csv-export@${agGridVersion}/dist/csv-export.cjs.min.js`,
        '@ag-grid-community/infinite-row-model': `https://cdn.jsdelivr.net/npm/@ag-grid-community/infinite-row-model@${agGridVersion}/dist/infinite-row-model.cjs.min.js`,
        /* END OF GRID COMMUNITY MODULES PATHS PROD - DO NOT DELETE */
    },
    gridEnterprisePaths: {
        /* START OF GRID ENTERPRISE MODULES PATHS PROD - DO NOT DELETE */
        '@ag-grid-community/client-side-row-model': `https://cdn.jsdelivr.net/npm/@ag-grid-community/client-side-row-model@${agGridVersion}/dist/client-side-row-model.cjs.min.js`,
        '@ag-grid-community/core': `https://cdn.jsdelivr.net/npm/@ag-grid-community/core@${agGridVersion}/dist/core.cjs.min.js`,
        '@ag-grid-community/csv-export': `https://cdn.jsdelivr.net/npm/@ag-grid-community/csv-export@${agGridVersion}/dist/csv-export.cjs.min.js`,
        '@ag-grid-community/infinite-row-model': `https://cdn.jsdelivr.net/npm/@ag-grid-community/infinite-row-model@${agGridVersion}/dist/infinite-row-model.cjs.min.js`,
        '@ag-grid-enterprise/charts': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/charts@${agGridVersion}/dist/charts.cjs.min.js`,
        '@ag-grid-enterprise/clipboard': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/clipboard@${agGridVersion}/dist/clipboard.cjs.min.js`,
        '@ag-grid-enterprise/column-tool-panel': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/column-tool-panel@${agGridVersion}/dist/column-tool-panel.cjs.min.js`,
        '@ag-grid-enterprise/core': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/core@${agGridVersion}/dist/core.cjs.min.js`,
        '@ag-grid-enterprise/excel-export': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/excel-export@${agGridVersion}/dist/excel-export.cjs.min.js`,
        '@ag-grid-enterprise/filter-tool-panel': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/filter-tool-panel@${agGridVersion}/dist/filter-tool-panel.cjs.min.js`,
        '@ag-grid-enterprise/master-detail': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/master-detail@${agGridVersion}/dist/master-detail.cjs.min.js`,
        '@ag-grid-enterprise/menu': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/menu@${agGridVersion}/dist/menu.cjs.min.js`,
        '@ag-grid-enterprise/multi-filter': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/multi-filter@${agGridVersion}/dist/multi-filter.cjs.min.js`,
        '@ag-grid-enterprise/range-selection': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/range-selection@${agGridVersion}/dist/range-selection.cjs.min.js`,
        '@ag-grid-enterprise/rich-select': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/rich-select@${agGridVersion}/dist/rich-select.cjs.min.js`,
        '@ag-grid-enterprise/row-grouping': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/row-grouping@${agGridVersion}/dist/row-grouping.cjs.min.js`,
        '@ag-grid-enterprise/server-side-row-model': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/server-side-row-model@${agGridVersion}/dist/server-side-row-model.cjs.min.js`,
        '@ag-grid-enterprise/set-filter': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/set-filter@${agGridVersion}/dist/set-filter.cjs.min.js`,
        '@ag-grid-enterprise/side-bar': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/side-bar@${agGridVersion}/dist/side-bar.cjs.min.js`,
        '@ag-grid-enterprise/sparklines': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/sparklines@${agGridVersion}/dist/sparklines.cjs.min.js`,
        '@ag-grid-enterprise/status-bar': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/status-bar@${agGridVersion}/dist/status-bar.cjs.min.js`,
        '@ag-grid-enterprise/viewport-row-model': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/viewport-row-model@${agGridVersion}/dist/viewport-row-model.cjs.min.js`,
        /* END OF GRID ENTERPRISE MODULES PATHS PROD - DO NOT DELETE */
    },
    chartMap: {
        'ag-charts-react': `${NPM_CDN}/ag-charts-react@${agChartsReactVersion}/`,
        'ag-charts-angular': `${NPM_CDN}/ag-charts-angular@${agChartsAngularVersion}/`,
        'ag-charts-vue': `${NPM_CDN}/ag-charts-vue@${agChartsVueVersion}/`,
        'ag-charts-vue3': `${NPM_CDN}/ag-charts-vue3@${agChartsVueVersion}/`,
        'ag-charts-community': `${NPM_CDN}/ag-charts-community@${agChartsVersion}/dist/ag-charts-community.cjs.min.js`,
        'ag-charts-enterprise': `${NPM_CDN}/ag-charts-enterprise@${agChartsVersion}/dist/ag-charts-enterprise.cjs.min.js`,
    },
    chartPaths: {},
};

function getRelevantConfig(configuration, framework) {
    const filterByFramework = ([k, v]) => {
        const inverseFrameworks = {
            react: ['angular', 'vue', 'vue3'],
            angular: ['react', 'vue', 'vue3'],
            vue: ['angular', 'react', 'vue3'],
            vue3: ['angular', 'react', 'vue'],
            typescript: ['angular', 'react', 'vue', 'vue3'],
        };
        return !inverseFrameworks[framework].some((f) => k.endsWith(f));
    };

    const filterOutChartWrapper = ([k, v]) => {
        // integrated does not need the charts framework wrapper
        if (k.includes('ag-charts')) {
            return k !== `ag-charts-${framework}`;
        }
        return true;
    };

    const buildCopy = (config) => {
        let valid = {};
        Object.entries(config)
            .filter(filterOutChartWrapper)
            .filter(filterByFramework)
            .sort(([k1, v1], [k2, v2]) => (k1 < k2 ? -1 : 1))
            .forEach(([k, v]) => {
                valid[k] = v;
            });
        return valid;
    };

    const buildChartCopy = (config) => {
        let valid = {};
        Object.entries(config)
            .filter(filterByFramework)
            .sort(([k1, v1], [k2, v2]) => (k1 < k2 ? -1 : 1))
            .forEach(([k, v]) => {
                valid[k] = v;
            });
        return valid;
    };

    return {
        gridMap: buildCopy(configuration.gridMap),
        gridCommunityPaths: buildCopy(configuration.gridCommunityPaths),
        gridEnterprisePaths: buildCopy(configuration.gridEnterprisePaths),
        chartMap: buildChartCopy(configuration.chartMap),
        chartPaths: buildChartCopy(configuration.chartPaths),
    };
}

/**
 * Our framework examples use SystemJS to load the various dependencies. This component is used to insert the required
 * code to load SystemJS and the relevant modules depending on the framework.
 */
export const SystemJs = ({ library, boilerplatePath, appLocation, startFile, options, framework, isDev }) => {
    const { enterprise: isEnterprise } = options;
    const systemJsPath = pathJoin(boilerplatePath, `systemjs.config${isDev ? '.dev' : ''}.js`);
    let configuration = isUsingPublishedPackages()
        ? publishedConfiguration
        : isBuildServerBuild() || isPreProductionBuild()
        ? buildAndArchivesConfiguration
        : localConfiguration;

    if (isDev) {
        configuration.gridCommunityPaths = {
            ...configuration.gridCommunityPaths,
            '@ag-grid-community/all-modules': `${localPrefix}/@ag-grid-community/all-modules/dist/ag-grid-community.cjs.js`,
        };
        configuration.gridEnterprisePaths = {
            ...configuration.gridEnterprisePaths,
            '@ag-grid-community/all-modules': `${localPrefix}/@ag-grid-community/all-modules/dist/ag-grid-community.cjs.js`,
            '@ag-grid-enterprise/all-modules': `${localPrefix}/@ag-grid-enterprise/all-modules/dist/ag-grid-enterprise.cjs.js`,
        };
        configuration.gridMap = {
            ...configuration.gridMap,
            /* START OF GRID MODULES DEV - DO NOT DELETE */
            '@ag-grid-community/all-modules': `${localPrefix}/@ag-grid-community/all-modules`,
            '@ag-grid-community/client-side-row-model': `${localPrefix}/@ag-grid-community/client-side-row-model`,
            '@ag-grid-community/core': `${localPrefix}/@ag-grid-community/core`,
            '@ag-grid-community/csv-export': `${localPrefix}/@ag-grid-community/csv-export`,
            '@ag-grid-community/infinite-row-model': `${localPrefix}/@ag-grid-community/infinite-row-model`,
            'ag-charts-community': `${localPrefix}/ag-charts-community`,
            '@ag-grid-enterprise/all-modules': `${localPrefix}/@ag-grid-enterprise/all-modules`,
            '@ag-grid-enterprise/charts': `${localPrefix}/@ag-grid-enterprise/charts`,
            '@ag-grid-enterprise/clipboard': `${localPrefix}/@ag-grid-enterprise/clipboard`,
            '@ag-grid-enterprise/column-tool-panel': `${localPrefix}/@ag-grid-enterprise/column-tool-panel`,
            '@ag-grid-enterprise/core': `${localPrefix}/@ag-grid-enterprise/core`,
            '@ag-grid-enterprise/excel-export': `${localPrefix}/@ag-grid-enterprise/excel-export`,
            '@ag-grid-enterprise/filter-tool-panel': `${localPrefix}/@ag-grid-enterprise/filter-tool-panel`,
            '@ag-grid-enterprise/master-detail': `${localPrefix}/@ag-grid-enterprise/master-detail`,
            '@ag-grid-enterprise/menu': `${localPrefix}/@ag-grid-enterprise/menu`,
            '@ag-grid-enterprise/multi-filter': `${localPrefix}/@ag-grid-enterprise/multi-filter`,
            '@ag-grid-enterprise/range-selection': `${localPrefix}/@ag-grid-enterprise/range-selection`,
            '@ag-grid-enterprise/rich-select': `${localPrefix}/@ag-grid-enterprise/rich-select`,
            '@ag-grid-enterprise/row-grouping': `${localPrefix}/@ag-grid-enterprise/row-grouping`,
            '@ag-grid-enterprise/server-side-row-model': `${localPrefix}/@ag-grid-enterprise/server-side-row-model`,
            '@ag-grid-enterprise/set-filter': `${localPrefix}/@ag-grid-enterprise/set-filter`,
            '@ag-grid-enterprise/side-bar': `${localPrefix}/@ag-grid-enterprise/side-bar`,
            '@ag-grid-enterprise/sparklines': `${localPrefix}/@ag-grid-enterprise/sparklines`,
            '@ag-grid-enterprise/status-bar': `${localPrefix}/@ag-grid-enterprise/status-bar`,
            '@ag-grid-enterprise/viewport-row-model': `${localPrefix}/@ag-grid-enterprise/viewport-row-model`,
            'ag-charts-enterprise': `${localPrefix}/ag-charts-enterprise`,
            /* END OF GRID MODULES DEV - DO NOT DELETE */
        };

        configuration.chartMap = {
            ...configuration.chartMap,
            'ag-charts-community': `${localPrefix}/ag-charts-community`,
            'ag-charts-enterprise': `${localPrefix}/ag-charts-enterprise`,
        };
    }
    configuration = getRelevantConfig(configuration, framework);

    let systemJsMap;
    let systemJsPaths;
    if (library === 'charts' || options.enableChartApi) {
        systemJsMap = configuration.chartMap;
        systemJsPaths = configuration.chartPaths;
    }

    if (library === 'grid') {
        systemJsMap = { ...systemJsMap, ...configuration.gridMap };
        systemJsPaths = {
            ...systemJsPaths,
            ...(isEnterprise ? configuration.gridEnterprisePaths : configuration.gridCommunityPaths),
        };
    }

    let systemJsVersion = `${NPM_CDN}/systemjs@0.19.47/dist/system.js`;
    if (framework === 'angular') {
        // Angular needs a later version to be able to import @esm-bundle/angular__compiler which
        // it requires to correctly renderer dynamic components.
        systemJsVersion = `${NPM_CDN}/systemjs@0.21.6/dist/system.js`;
    }

    return (
        <>
            <script
                dangerouslySetInnerHTML={{
                    __html: `
            var appLocation = '${appLocation}';
            var boilerplatePath = '${boilerplatePath}';
            var systemJsMap = ${format(systemJsMap)};
            ${Object.keys(systemJsPaths).length > 0 ? `var systemJsPaths = ${format(systemJsPaths)};` : ''}
        `,
                }}
            />
            <script src={systemJsVersion} />
            <script src={systemJsPath} />
            <script
                dangerouslySetInnerHTML={{
                    __html: `System.import('${startFile}').catch(function(err) { console.error(err); });`,
                }}
            />
        </>
    );
};

const format = (value) => JSON.stringify(value, null, 4).replace(/\n/g, '\n            ');
