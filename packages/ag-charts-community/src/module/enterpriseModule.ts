import type { AgChartOptions } from '../options/chart/chartBuilderOptions';

interface EnterpriseModuleOptions {
    isEnterprise: boolean;
    licenseManager?: (options: AgChartOptions) => void;
}

export const enterpriseModule: EnterpriseModuleOptions = {
    isEnterprise: false,
};
