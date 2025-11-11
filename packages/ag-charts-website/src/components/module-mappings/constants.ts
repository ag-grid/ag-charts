interface Option {
    name: string;
    moduleName: string;
    isEnterprise?: boolean;
}

export type BundleOptionValue =
    | ''
    | typeof ALL_COMMUNITY_MODULE
    | typeof ALL_ENTERPRISE_MODULE
    | typeof ALL_COMMUNITY_AND_ENTERPRISE_MODULE;

export const ALL_COMMUNITY_MODULE = 'AllCommunityModules';
export const ALL_ENTERPRISE_MODULE = 'AllEnterpriseModules';
export const ALL_COMMUNITY_AND_ENTERPRISE_MODULE = 'AllCommunityAndEnterpriseModules';

export const BUNDLE_OPTIONS: Option[] = [
    { name: 'None', moduleName: '' },
    { name: 'All Community Modules', moduleName: ALL_COMMUNITY_MODULE },
    { name: 'All Enterprise Modules', moduleName: ALL_ENTERPRISE_MODULE, isEnterprise: true },
    { name: 'All Modules', moduleName: ALL_COMMUNITY_AND_ENTERPRISE_MODULE, isEnterprise: true },
];

export type ChartModuleName = 'Gauge Preset' | 'Price-Volume Preset';

interface ChartOption extends Option {
    name: ChartModuleName;
}

export type ChartOptions = Record<ChartModuleName, boolean>;

export const CHART_OPTIONS: ChartOption[] = [
    {
        name: 'Gauge Preset',
        moduleName: 'GaugePresetModule',
        isEnterprise: true,
    },
    {
        name: 'Price-Volume Preset',
        moduleName: 'PriceVolumePresetModule',
        isEnterprise: true,
    },
];

export const DEFAULT_CHART_OPTIONS = Object.fromEntries(CHART_OPTIONS.map(({ name }) => [name, false])) as ChartOptions;
