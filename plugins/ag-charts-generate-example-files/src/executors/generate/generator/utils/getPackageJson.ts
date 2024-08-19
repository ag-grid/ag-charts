import { readFileSync } from 'fs';

import { INTERNAL_FRAMEWORK_DEPENDENCIES } from '../constants';
import type { InternalFramework } from '../types';

interface Params {
    isEnterprise: boolean;
    internalFramework: InternalFramework;
}

function getPackageJsonVersion(packageName: string) {
    const path = `${process.cwd()}/packages/${packageName}/package.json`;
    const packageJsonStr = readFileSync(path, 'utf-8');
    const packageJson = JSON.parse(packageJsonStr);
    return '^' + packageJson.version;
}

function getFrameworkDependencies(internalFramework: InternalFramework) {
    const frameworkDependencies = {
        ...INTERNAL_FRAMEWORK_DEPENDENCIES[internalFramework],
    };

    if (internalFramework === 'angular') {
        frameworkDependencies['ag-charts-angular'] = getPackageJsonVersion('ag-charts-angular');
        frameworkDependencies['clone'] = '^2.1.2';
    } else if (internalFramework === 'reactFunctional' || internalFramework === 'reactFunctionalTs') {
        frameworkDependencies['ag-charts-react'] = getPackageJsonVersion('ag-charts-react');
        frameworkDependencies['clone'] = '^2.1.2';
    } else if (internalFramework === 'vue3') {
        frameworkDependencies['ag-charts-vue3'] = getPackageJsonVersion('ag-charts-vue3');
        frameworkDependencies['clone'] = '^2.1.2';
    }

    return frameworkDependencies;
}

export function getPackageJson({ isEnterprise, internalFramework }: Params) {
    const agChartsCommunityVersion = getPackageJsonVersion('ag-charts-community');
    const agChartsEnterpriseVersion = getPackageJsonVersion('ag-charts-enterprise');
    const chartsLibrary = isEnterprise
        ? {
              'ag-charts-enterprise': agChartsEnterpriseVersion,
          }
        : {
              'ag-charts-community': agChartsCommunityVersion,
          };

    const frameworkDependencies = getFrameworkDependencies(internalFramework);
    const dependencies = {
        ...frameworkDependencies,
        ...chartsLibrary,
    };

    const packageJson = {
        name: `ag-charts-example`,
        dependencies,
    };

    return packageJson;
}
