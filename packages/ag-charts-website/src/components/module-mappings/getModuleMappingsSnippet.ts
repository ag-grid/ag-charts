export interface SelectedModules {
    community: string[];
    enterprise: string[];
}

function formatImportItem(name: string) {
    return `    ${name},`;
}

function formatImports(imports: string[], packageName: string) {
    return imports.length
        ? `import {\n${imports.map(formatImportItem).join('\n')}\n} from 'ag-charts-${packageName}';`
        : null;
}

export function getModuleMappingsSnippet({
    selectedModules,
}: {
    selectedModules: SelectedModules;
}): string | undefined {
    const { community, enterprise } = selectedModules;
    const allSelectedModules = community.concat(enterprise);

    let communityImports = community;
    let enterpriseImports = enterprise;
    if (enterprise.length && !community.length) {
        enterpriseImports = ['ModuleRegistry'].concat(enterprise);
    } else {
        communityImports = ['ModuleRegistry'].concat(community);
    }

    const imports = [formatImports(communityImports, 'community'), formatImports(enterpriseImports, 'enterprise')]
        .filter(Boolean)
        .join('\n');

    const moduleList = allSelectedModules.length
        ? allSelectedModules.map(formatImportItem).join('\n')
        : '    // no modules selected';

    return `${imports}\n\nModuleRegistry.registerModules([\n${moduleList}\n]);`;
}
