import { addBindingImports, ensureNamedImport, getPropertyOptionsType, usesDefaultOptionsType } from './parser-utils';

function processFunction(code: string): string {
    const updateCall = 'chart.update(options);';

    if (!/\boptions[.[]/.test(code) || code.includes(updateCall)) {
        return code;
    }

    return code.replace(/}\s*$/, `    ${updateCall}\n}`);
}

function getFactory(bindings: any): string {
    const typeStr = bindings.optionsTypeInfo?.typeStr ?? '';
    const importNames = new Set((bindings.imports ?? []).flatMap((imp: { imports?: string[] }) => imp.imports ?? []));

    if (typeStr.includes('Financial') || importNames.has('AgFinancialChartOptions')) {
        return 'AgCharts.createFinancialChart';
    }

    if (
        typeStr.includes('Gauge') ||
        ['AgGaugeOptions', 'AgRadialGaugeOptions', 'AgLinearGaugeOptions'].some((name) => importNames.has(name))
    ) {
        return 'AgCharts.createGauge';
    }

    if (typeStr.includes('Quadrant') || importNames.has('AgQuadrantChartOptions')) {
        return 'AgCharts.createQuadrantChart';
    }

    if (typeStr.includes('Sparkline') || importNames.has('AgSparklineOptions')) {
        return 'AgCharts.__createSparkline';
    }

    if (typeStr.includes('VolumeProfileChart') || importNames.has('AgVolumeProfileChartOptions')) {
        return 'AgCharts.createVolumeProfileChart';
    }

    return 'AgCharts.create';
}

function getCreateCall(bindings: any, propertyName: string, isPrimary: boolean, optionsArg: string): string {
    const factory = getFactory(bindings);
    const modules = bindings.chartModules[propertyName];
    const args = modules ? `${optionsArg}, { modules: ${modules} }` : optionsArg;

    if (isPrimary) {
        return `const chart = ${factory}(${args});`;
    }

    return `${factory}(${args});`;
}

export function vanillaToTypescript(bindings: any): string {
    const sections: string[] = [];

    const imports: string[] = [];
    const bindingImports = bindings.imports.map((i) => ({ ...i, imports: [...i.imports] }));
    if (usesDefaultOptionsType(bindings)) {
        // Options the example leaves untyped are annotated, so that `container` can be assigned to them.
        const packageName = bindings.chartSettings.enterprise ? "'ag-charts-enterprise'" : "'ag-charts-community'";
        ensureNamedImport(bindingImports, packageName, 'AgChartOptions');
    }
    addBindingImports(bindingImports, imports, false, false);
    if (imports.length > 0) {
        sections.push(imports.join('\n'));
    }

    if (bindings.declarations.length > 0) {
        sections.push(bindings.declarations.join('\n'));
    }

    if (bindings.globals.length > 0) {
        sections.push(bindings.globals.join('\n'));
    }

    const optionDefinitions: string[] = [];
    const createStatements: string[] = [];

    for (const id of Object.keys(bindings.chartProperties ?? {})) {
        const propertyName = bindings.chartProperties[id];
        const property = bindings.properties.find((p) => p.name === propertyName);

        if (!property) continue;

        const isPrimary = propertyName === 'options';

        optionDefinitions.push(`const ${propertyName}: ${getPropertyOptionsType(property)} = ${property.value};`);
        optionDefinitions.push(`${propertyName}.container = document.getElementById('${id}');`);

        // The example's own cast, if it made one, types the chart instance that its handlers then update
        const optionsArg = bindings.chartCreateArgs?.[propertyName] ?? propertyName;
        createStatements.push(getCreateCall(bindings, propertyName, isPrimary, optionsArg));
    }

    if (optionDefinitions.length > 0) {
        sections.push(optionDefinitions.join('\n\n'));
    }

    if (bindings.init.length > 0) {
        createStatements.push(...bindings.init);
    }

    if (createStatements.length > 0) {
        sections.push(createStatements.join('\n'));
    }

    const methodSnippets: string[] = [];

    for (const method of bindings.instanceMethods) {
        methodSnippets.push(processFunction(method));
    }

    for (const handler of bindings.externalEventHandlers) {
        methodSnippets.push(processFunction(handler.body));
    }

    if (methodSnippets.length > 0) {
        sections.push(methodSnippets.join('\n\n'));
    }

    return sections.filter(Boolean).join('\n\n');
}
