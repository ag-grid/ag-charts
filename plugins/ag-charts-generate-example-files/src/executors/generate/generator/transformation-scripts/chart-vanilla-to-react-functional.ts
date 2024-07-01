import { getChartImports, wrapOptionsUpdateCode } from './chart-utils';
import {
    addBindingImports,
    convertFunctionToConstProperty,
    convertFunctionToProperty,
    isFinancialCharts,
} from './parser-utils';
import { convertFunctionalTemplate, getImport, styleAsObject } from './react-utils';
import { toTitleCase } from './string-utils';

export function processFunction(code: string): string {
    return wrapOptionsUpdateCode(
        convertFunctionToProperty(code),
        'const clone = deepClone(options);',
        'setOptions(clone);',
        'clone'
    );
}

function needsWrappingInFragment(bindings: any) {
    return (
        bindings.template.includes('toolbar') ||
        (Object.keys(bindings.placeholders).length > 1 && !bindings.template.includes('</'))
    );
}

function getImports(componentFilenames: string[], bindings): string[] {
    const type = isFinancialCharts(bindings) ? 'AgFinancialCharts' : 'AgCharts';
    const reactImports = ['useState'];
    if (bindings.usesChartApi) reactImports.push('useRef');
    if (needsWrappingInFragment(bindings)) reactImports.push('Fragment');

    const imports = [
        `import React, { ${reactImports.join(', ')} } from 'react';`,
        `import { createRoot } from 'react-dom/client';`,
        `import { ${type} } from 'ag-charts-react';`,
    ];

    const chartImports = bindings.imports.map((i) => ({
        ...i,
        imports: i.imports.filter((imp) => imp !== 'AgCharts'),
    }));
    const chartImport = getChartImports(chartImports, bindings.usesChartApi);
    if (chartImport) {
        imports.push(chartImport);
    } else if (bindings.chartSettings.enterprise) {
        imports.push(`import 'ag-charts-enterprise';`);
    }

    const skipModules = ["'ag-charts-community'", "'ag-charts-enterprise'"];
    addBindingImports(
        bindings.imports.filter((i) => !skipModules.includes(i.module) && !i.module.startsWith("'./")),
        imports,
        false,
        true
    );

    if (bindings.externalEventHandlers.length > 0 || bindings.instanceMethods.length > 0) {
        imports.push(`import deepClone from 'deepclone';`);
    }

    if (componentFilenames) {
        imports.push(...componentFilenames.map(getImport));
    }

    return imports;
}

function getAgChartTag(bindings: any, componentAttributes: string[]): string {
    const tag = isFinancialCharts(bindings) ? 'AgFinancialCharts' : 'AgCharts';
    return `<${tag}
        ${bindings.usesChartApi ? 'ref={chartRef}' : ''}
        ${componentAttributes.join(`
        `)}
    />`;
}

function getTemplate(bindings: any, componentAttributes: string[]): string {
    const agChartTag = getAgChartTag(bindings, componentAttributes);

    let template: string = bindings.template ?? agChartTag;
    Object.values(bindings.placeholders).forEach((placeholder: string) => {
        template = template.replace(placeholder, agChartTag);
    });

    return convertFunctionalTemplate(template);
}

function getComponentMetadata(bindings: any, id: string, property: any) {
    const stateProperties = [];
    const componentAttributes = [];

    stateProperties.push(`const [${property.name}, set${toTitleCase(property.name)}] = useState(${property.value});`);
    componentAttributes.push(`options={${property.name}}`);

    Object.entries(bindings.chartAttributes[id]).forEach(([key, value]) => {
        if (key === 'style') {
            componentAttributes.push(`style={${JSON.stringify(styleAsObject(value as any))}}`);
        } else if (key === 'class') {
            componentAttributes.push(`className=${JSON.stringify(value as any)}`);
        } else {
            throw new Error(`Unknown chart attribute: ${key}`);
        }
    });

    return {
        stateProperties,
        componentAttributes,
    };
}

export async function vanillaToReactFunctional(bindings: any, componentFilenames: string[]): Promise<string> {
    const { properties } = bindings;
    const imports = getImports(componentFilenames, bindings);
    const placeholders = Object.keys(bindings.placeholders);

    let indexFile: string;

    if (placeholders.length <= 1) {
        const { stateProperties, componentAttributes } = getComponentMetadata(
            bindings,
            placeholders[0],
            properties.find((p) => p.name === 'options')
        );

        let template = getTemplate(bindings, componentAttributes);
        if (needsWrappingInFragment(bindings)) {
            template = `<Fragment>
                ${template}
            </Fragment>`;
        }

        const externalEventHandlers = bindings.externalEventHandlers.map((handler) =>
            processFunction(convertFunctionToConstProperty(handler.body))
        );
        const instanceMethods = bindings.instanceMethods.map((m) => processFunction(convertFunctionToConstProperty(m)));

        indexFile = `
            ${imports.join(`
            `)}

            ${bindings.globals.join(`
            `)}

            const ChartExample = () => {
                ${bindings.usesChartApi ? `const chartRef = useRef(null);` : ''}
                ${stateProperties.join(',\n            ')}

                ${instanceMethods.concat(externalEventHandlers).join('\n\n    ')}

                return ${template};
            }

            const root = createRoot(document.getElementById('root'));
            root.render(<ChartExample />);
            `;
    } else {
        const components = new Map<string, string>();
        indexFile = `
            ${imports.join(`
            `)}

            ${bindings.globals.join(`
            `)}
        `;

        placeholders.forEach((id) => {
            const componentName = toTitleCase(id);

            const propertyName = bindings.chartProperties[id];
            const { stateProperties, componentAttributes } = getComponentMetadata(
                bindings,
                id,
                properties.find((p) => p.name === propertyName)
            );

            indexFile = `${indexFile}

            const ${componentName} = () => {
                ${stateProperties.join(`;
                `)}

                return ${getAgChartTag(bindings, componentAttributes)};
            }`;

            components.set(id, `<${componentName} />`);
        });

        let wrapper = convertFunctionalTemplate(bindings.template);
        Object.entries(bindings.placeholders).forEach(([id, template]: [string, string]) => {
            wrapper = wrapper.replace(template, components.get(id)!);
        });

        if (needsWrappingInFragment(bindings)) {
            wrapper = `<Fragment>
                ${wrapper}
            </Fragment>`;
        }

        indexFile = `${indexFile}

        const root = createRoot(document.getElementById('root'));
        root.render(
            ${wrapper}
        );
        `;
    }

    if (bindings.usesChartApi) {
        indexFile = indexFile.replace(/AgCharts.(\w*)\((\w*)(,|\))/g, 'AgCharts.$1(chartRef.current$3');
        indexFile = indexFile.replace(/chart.(\w*)\(/g, 'chartRef.current.$1(');
        indexFile = indexFile.replace(/this.chartRef.current/g, 'chartRef.current');
    }

    return indexFile;
}
