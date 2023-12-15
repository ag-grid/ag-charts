import type { InternalFramework } from '@ag-grid-types';
import { DEV_FILE_BASE_PATH, NPM_CDN, PUBLISHED_URLS, SITE_BASE_URL } from '@constants';
import { isBuildServerBuild, isPreProductionBuild, isUsingPublishedPackages } from '@utils/pages';
import { pathJoin } from '@utils/pathJoin';

interface Props {
    isDev: boolean;
    boilerplatePath: string;
    appLocation: string;
    startFile: string;
    internalFramework: InternalFramework;
}

type Paths = Record<string, string>;

interface Configuration {
    chartMap: Paths;
    chartPaths: Paths;
}

const localPrefix = pathJoin(import.meta.env?.PUBLIC_SITE_URL, SITE_BASE_URL, DEV_FILE_BASE_PATH);

const localConfiguration: Configuration = {
    chartMap: {
        'ag-charts-react': `${localPrefix}/ag-charts-react`,
        'ag-charts-angular': `${localPrefix}/ag-charts-angular`,
        'ag-charts-vue': `${localPrefix}/ag-charts-vue`,
        'ag-charts-vue3': `${localPrefix}/ag-charts-vue3`,
    },
    chartPaths: {
        'ag-charts-community': `${localPrefix}/ag-charts-community/dist/package/main.cjs.js`,
        'ag-charts-enterprise': `${localPrefix}/ag-charts-enterprise/dist/package/main.cjs.js`,
    },
};

const buildAndArchivesConfiguration: Configuration = {
    chartMap: {
        'ag-charts-react': `${localPrefix}/ag-charts-react`,
        'ag-charts-angular': `${localPrefix}/ag-charts-angular`,
        'ag-charts-vue': `${localPrefix}/ag-charts-vue`,
        'ag-charts-vue3': `${localPrefix}/ag-charts-vue3`,
    },
    chartPaths: {
        'ag-charts-community': `${localPrefix}/ag-charts-community/dist/package/main.cjs.js`,
        'ag-charts-enterprise': `${localPrefix}/ag-charts-enterprise/dist/package/main.cjs.js`,
    },
};

const publishedConfiguration = {
    chartMap: PUBLISHED_URLS,
    chartPaths: {},
};

function getRelevantConfig(configuration: Configuration, framework: InternalFramework) {
    const filterByFramework = ([k]: string[]) => {
        const inverseFrameworks: Record<string, string[]> = {
            react: ['angular', 'vue', 'vue3'],
            angular: ['react', 'vue', 'vue3'],
            vue: ['angular', 'react', 'vue3'],
            vue3: ['angular', 'react', 'vue'],
            typescript: ['angular', 'react', 'vue', 'vue3'],
        };
        return !inverseFrameworks[framework].some((f) => k.endsWith(f));
    };

    const buildChartCopy = (config: Paths) => {
        const valid = {} as Paths;
        Object.entries(config)
            .filter(filterByFramework)
            .sort(([k1], [k2]) => (k1 < k2 ? -1 : 1))
            .forEach(([k, v]) => {
                valid[k] = v;
            });
        return valid;
    };

    return {
        chartMap: buildChartCopy(configuration.chartMap),
        chartPaths: buildChartCopy(configuration.chartPaths),
    };
}

/**
 * Our framework examples use SystemJS to load the various dependencies. This component is used to insert the required
 * code to load SystemJS and the relevant modules depending on the framework.
 */
export const SystemJs = ({ boilerplatePath, appLocation, startFile, internalFramework, isDev }: Props) => {
    const systemJsPath = pathJoin(boilerplatePath, `systemjs.config${isDev ? '.dev' : ''}.js`);
    const systemJsVersion =
        internalFramework === 'angular'
            ? `${NPM_CDN}/systemjs@6.14.2/dist/system.js`
            : `${NPM_CDN}/systemjs@6.14.2/dist/system.js`;

    let configuration = isUsingPublishedPackages()
        ? publishedConfiguration
        : isBuildServerBuild() || isPreProductionBuild()
          ? buildAndArchivesConfiguration
          : localConfiguration;

    if (isDev) {
        configuration.chartMap = {
            ...configuration.chartMap,
            'ag-charts-community': `${localPrefix}/ag-charts-community`,
            'ag-charts-enterprise': `${localPrefix}/ag-charts-enterprise`,
        };
    }
    configuration = getRelevantConfig(configuration, internalFramework);

    return (
        <>
            <script
                dangerouslySetInnerHTML={{
                    __html: `
            var appLocation = '${appLocation}';
            var boilerplatePath = '${boilerplatePath}';
            var systemJsMap = ${format(configuration.chartMap!)};
            ${
                Object.keys(configuration.chartPaths).length > 0
                    ? `var systemJsPaths = ${format(configuration.chartPaths)};`
                    : ''
            }
        `,
                }}
            />
            <script src={systemJsVersion} />
            <script src={systemJsPath} />
            <script
                type="systemjs-importmap"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        imports: {
                            react: 'https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.development.min.js',
                            'react-dom/client':
                                'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.development.min.js',
                            'prop-types': 'https://cdn.jsdelivr.net/npm/prop-types@15.8.1',
                            'ag-charts-community': `${localPrefix}/ag-charts-community/dist/package/main.esm.js`,
                            'ag-charts-enterprise': `${localPrefix}/ag-charts-enterprise/dist/package/main.esm.js`,
                            'ag-charts-react': `${localPrefix}/ag-charts-react/dist/index.mjs`,
                        },
                    }),
                }}
            />
            <script src={`${NPM_CDN}/systemjs-babel@0.3.2/dist/systemjs-babel.js`} />
            <script src={`${NPM_CDN}/systemjs@6.14.2/dist/extras/amd.js`}></script>
            <script type="systemjs-module" src={startFile} />
        </>
    );
};

const format = (value: object) => JSON.stringify(value, null, 4).replace(/\n/g, '\n            ');
