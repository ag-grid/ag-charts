export interface SelectedModules {
    community: string[];
    enterprise: string[];
}

function formatImportItem(name: string) {
    return `    ${name},`;
}

function formatImports(imports: string[], packageName: string) {
    return imports.length === 0
        ? null
        : `import {\n${imports.map(formatImportItem).join('\n')}\n} from 'ag-charts-${packageName}';`;
}

export function getModuleMappingsSnippet({
    selectedModules,
}: {
    selectedModules: SelectedModules;
}): string | undefined {
    const { community, enterprise } = selectedModules;
    const allSelectedModules = community.concat(enterprise);
    const imports = formatImports(
        ['ModuleRegistry'].concat(allSelectedModules),
        enterprise.length === 0 ? 'community' : 'enterprise'
    );
    const moduleList =
        allSelectedModules.length === 0
            ? '    // no modules selected'
            : allSelectedModules.map(formatImportItem).join('\n');
    return `${imports}\n\nModuleRegistry.registerModules([\n${moduleList}\n]);`;
}
