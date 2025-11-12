export interface SelectedModules {
    community: string[];
    enterprise: string[];
}

function formatImportItem(name: string) {
    return `    ${name},`;
}

function formatImports(imports: string[], packageName: string) {
    return `import {\n${imports.map(formatImportItem).join('\n')}\n} from 'ag-charts-${packageName}';`;
}

export function getModuleMappingsSnippet({
    selectedModules,
}: {
    selectedModules: SelectedModules;
}): string | undefined {
    const { community, enterprise } = selectedModules;
    if (!community.length && !enterprise.length) return;

    const communityImports = enterprise.length && !community.length ? community : ['ModuleRegistry'].concat(community);
    const enterpriseImports = community.length ? enterprise : ['ModuleRegistry'].concat(enterprise);
    const allSelectedModules = community.concat(enterprise);

    const registrationEntry =
        allSelectedModules.length === 1
            ? `[${allSelectedModules[0]}]`
            : `[\n${allSelectedModules.map(formatImportItem).join('\n')}\n]`;

    const imports = [
        community.length && formatImports(communityImports, 'community'),
        enterprise.length && formatImports(enterpriseImports, 'enterprise'),
    ]
        .filter(Boolean)
        .join('\n');

    return `${imports}\n\nModuleRegistry.registerModules(${registrationEntry});`;
}
