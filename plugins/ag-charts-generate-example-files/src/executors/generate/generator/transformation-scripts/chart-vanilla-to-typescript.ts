import { addBindingImports } from './parser-utils';

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

    if (typeStr.includes('Sparkline') || importNames.has('AgSparklineOptions')) {
        return 'AgCharts.__createSparkline';
    }

    return 'AgCharts.create';
}

function getCreateCall(bindings: any, propertyName: string, isPrimary: boolean): string {
    const factory = getFactory(bindings);

    if (isPrimary) {
        return `const chart = ${factory}(${propertyName});`;
    }

    return `${factory}(${propertyName});`;
}

export function vanillaToTypescript(bindings: any): string {
    const sections: string[] = [];

    const imports: string[] = [];
    addBindingImports(bindings.imports, imports, false, false);
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

    const optionType = bindings.optionsTypeInfo?.typeStr;

    for (const id of Object.keys(bindings.chartProperties ?? {})) {
        const propertyName = bindings.chartProperties[id];
        const property = bindings.properties.find((p) => p.name === propertyName);

        if (!property) continue;

        const isPrimary = propertyName === 'options';
        const typeAnnotation = isPrimary && optionType ? `: ${optionType}` : '';

        optionDefinitions.push(`const ${propertyName}${typeAnnotation} = ${property.value};`);
        optionDefinitions.push(`${propertyName}.container = document.getElementById('${id}');`);

        createStatements.push(getCreateCall(bindings, propertyName, isPrimary));
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
