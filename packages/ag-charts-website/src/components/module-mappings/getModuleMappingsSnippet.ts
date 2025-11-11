import { ALL_COMMUNITY_AND_ENTERPRISE_MODULE, ALL_COMMUNITY_MODULE, ALL_ENTERPRISE_MODULE } from './constants';

export interface SelectedModules {
    community: string[];
    enterprise: string[];
}

interface Params {
    selectedModules: SelectedModules;
}

const TAB_SPACING = '    ';
const BUNDLE_SPREAD = new Set([ALL_COMMUNITY_MODULE, ALL_ENTERPRISE_MODULE, ALL_COMMUNITY_AND_ENTERPRISE_MODULE]);

function formatRegistrationEntry(name: string) {
    return `${TAB_SPACING}${BUNDLE_SPREAD.has(name) ? '...' : ''}${name},`;
}

function formatImports(imports: string[], packageName: string) {
    return `import {\n${imports.map((name) => `${TAB_SPACING}${name},`).join('\n')}\n} from 'ag-charts-${packageName}';`;
}

export function getModuleMappingsSnippet({ selectedModules }: Params): string | undefined {
    const { community, enterprise } = selectedModules;
    if (!community.length && !enterprise.length) return;

    const communityImports = enterprise.length && !community.length ? community : ['ModuleRegistry'].concat(community);
    const enterpriseImports = community.length ? enterprise : ['ModuleRegistry'].concat(enterprise);

    const allSelectedModules = community.concat(enterprise);

    const registrationEntry =
        allSelectedModules.length === 1 && BUNDLE_SPREAD.has(allSelectedModules[0])
            ? allSelectedModules[0]
            : `[\n${allSelectedModules.map(formatRegistrationEntry).join('\n')}\n]`;

    const imports = [
        community.length && formatImports(communityImports, 'community'),
        enterprise.length && formatImports(enterpriseImports, 'enterprise'),
    ]
        .filter(Boolean)
        .join('\n');

    return `${imports}\n\nModuleRegistry.registerModules(${registrationEntry});`;
}
