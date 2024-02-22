import type { InternalFramework } from '../types';
interface Params {
    isEnterprise: boolean;
    internalFramework: InternalFramework;
}
export declare function getPackageJson({ isEnterprise, internalFramework }: Params): {
    name: string;
    dependencies: {
        'ag-charts-enterprise': string;
        'ag-charts-community'?: undefined;
    } | {
        'ag-charts-community': string;
        'ag-charts-enterprise'?: undefined;
    };
};
export {};
