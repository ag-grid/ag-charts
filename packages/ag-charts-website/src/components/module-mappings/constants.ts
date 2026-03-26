interface Option {
    name: string;
    moduleName: string;
    isEnterprise?: boolean;
}

export type BundleOptionValue = '' | typeof ALL_COMMUNITY_MODULE | typeof ALL_ENTERPRISE_MODULE;

export const ALL_COMMUNITY_MODULE = 'AllCommunityModule';
export const ALL_ENTERPRISE_MODULE = 'AllEnterpriseModule';

export const BUNDLE_OPTIONS: Option[] = [
    { name: 'None', moduleName: '' },
    { name: 'All Community Features', moduleName: ALL_COMMUNITY_MODULE },
    { name: 'All Enterprise Features', moduleName: ALL_ENTERPRISE_MODULE, isEnterprise: true },
];
