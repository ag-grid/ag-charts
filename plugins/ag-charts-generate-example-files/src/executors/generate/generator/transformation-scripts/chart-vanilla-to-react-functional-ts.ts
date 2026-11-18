import { wrapOptionsUpdateCode } from './chart-utils';
import {
    type ChartAPI,
    addBindingImports,
    chartApi,
    convertFunctionToConstProperty,
    convertFunctionToProperty,
    ensureNamedImport,
    getPropertyOptionsType,
    getReferencedOptions,
    usesDefaultOptionsType,
} from './parser-utils';
import { convertFunctionalTemplate, getImport, styleAsObject } from './react-utils';
import { toTitleCase } from './string-utils';

const components: Record<ChartAPI, string> = {
    gauge: 'AgGauge',
    financial: 'AgFinancialCharts',
    quadrant: 'AgQuadrantChart',
    sparkline: 'AgSparkline',
    vanilla: 'AgCharts',
    'volume-profile': 'AgVolumeProfileChart',
};

export function processFunction(code: string, suppressOptionsClone: boolean): string {
    return wrapOptionsUpdateCode(
        convertFunctionToProperty(code),
        'options',
        'setOptions(nextOptions);',
        'nextOptions',
        !suppressOptionsClone
    );
}

function needsWrappingInFragment(bindings: any) {
    return (
        bindings.template.includes('example-controls') ||
        (Object.keys(bindings.placeholders).length > 1 && !bindings.template.includes('</'))
    );
}

/**
 * The component's `options` prop is a plain `AgChartOptions`, which the options of a chart typed with generic
 * arguments (`AgCartesianChartOptions<TDatum, TContext>`) or an intersection are not assignable to.
 */
function needsOptionsCast(property: any): boolean {
    return /[<&]/.test(property.typeInfo?.typeStr ?? '');
}

function getImports(componentFilenames: string[], bindings: any, styleFileNames: string[]): string[] {
    const type = components[chartApi(bindings)];
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
    const packageName = bindings.chartSettings.enterprise ? "'ag-charts-enterprise'" : "'ag-charts-community'";
    if (bindings.usesChartApi) {
        ensureNamedImport(chartImports, packageName, 'AgChartInstance');
    }
    if (usesDefaultOptionsType(bindings) || bindings.properties.some(needsOptionsCast)) {
        // `getComponentMetadata` types each options state with `AgChartOptions` when the example doesn't.
        ensureNamedImport(chartImports, packageName, 'AgChartOptions');
    }

    if (chartImports.length > 0) {
        addBindingImports(chartImports, imports, false, true);
    }

    if (bindings.externalEventHandlers.length > 0 || bindings.instanceMethods.length > 0) {
        imports.push(`import clone from 'clone';`);
    }

    if (componentFilenames) {
        imports.push(...componentFilenames.map(getImport));
    }

    styleFileNames?.forEach((styleSheet) => imports.push(`import './${styleSheet}';`));

    return imports;
}

function getAgChartTag(bindings: any, componentAttributes: string[]): string {
    const tag = components[chartApi(bindings)];
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

    template = template.replace(/<hr>/g, '<hr />');

    return convertFunctionalTemplate(template, { typed: true });
}

function getComponentMetadata(bindings: any, id: string, property: any) {
    const stateProperties = [];
    const componentAttributes = [];

    const chartOptionsType = getPropertyOptionsType(property);

    // Each chart is its own component, so one whose options read another chart's declares that chart's options too.
    for (const dependency of getReferencedOptions(bindings, property)) {
        stateProperties.push(`const ${dependency.name}: ${getPropertyOptionsType(dependency)} = ${dependency.value};`);
    }

    stateProperties.push(
        `const [${property.name}, set${toTitleCase(property.name)}] = useState<${chartOptionsType}>(${property.value});`
    );

    componentAttributes.push(`options={${property.name}${needsOptionsCast(property) ? ' as AgChartOptions' : ''}}`);
    const modules = bindings.chartModules[property.name];
    if (modules) {
        componentAttributes.push(`modules={${modules}}`);
    }

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

export async function vanillaToReactFunctionalTs(
    bindings: any,
    componentFilenames: string[],
    styleFileNames: string[],
    suppressOptionsClone: boolean
): Promise<string> {
    const { properties } = bindings;
    const imports = getImports(componentFilenames, bindings, styleFileNames);
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
            processFunction(convertFunctionToConstProperty(handler.body), suppressOptionsClone)
        );
        const instanceMethods = bindings.instanceMethods.map((m) =>
            processFunction(convertFunctionToConstProperty(m), suppressOptionsClone)
        );

        indexFile = `
            ${imports.join(`
            `)}
${bindings.declarations.length > 0 ? '\n' + bindings.declarations.join('\n') + '\n' : ''}
            ${bindings.globals.join(`
            `)}

            const ChartExample = () => {
                ${bindings.usesChartApi ? `const chartRef = useRef<AgChartInstance>(null);` : ''}
                ${stateProperties.join(',\n            ')}

                ${instanceMethods.concat(externalEventHandlers).join('\n\n    ')}

                return ${template};
            }

            const root = createRoot(document.getElementById('root')!);
            root.render(<ChartExample />);
            `;
    } else {
        const components = new Map<string, string>();
        indexFile = `
            ${imports.join(`
            `)}
${bindings.declarations.length > 0 ? '\n' + bindings.declarations.join('\n') + '\n' : ''}
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

        let wrapper = convertFunctionalTemplate(bindings.template, { typed: true });
        Object.entries(bindings.placeholders).forEach(([id, template]: [string, string]) => {
            wrapper = wrapper.replace(template, components.get(id)!);
        });

        if (needsWrappingInFragment(bindings)) {
            wrapper = `<Fragment>
                ${wrapper}
            </Fragment>`;
        }

        indexFile = `${indexFile}

        const root = createRoot(document.getElementById('root')!);
        root.render(
            ${wrapper}
        );
        `;
    }

    if (bindings.usesChartApi) {
        indexFile = indexFile.replace(/AgCharts.(\w*)\((\w*)(,|\))/g, 'AgCharts.$1(chartRef.current!$3');
        indexFile = indexFile.replace(/chart.(\w*)\(/g, 'chartRef.current!.$1(');
        indexFile = indexFile.replace(/this.chartRef.current/g, 'chartRef.current!');
        // Split multi-variable declarations containing 'chart' to avoid breaking syntax
        indexFile = indexFile.replace(/\b(let|const|var)\s+chart\s*,\s*(\w+)/g, '$1 chart;\n    $1 $2');
        // Replace `chart` references but not in variable declarations or strings
        indexFile = indexFile.replace(
            /(['"])(?:\\.|(?!\1).)*\1|\b(?<!\blet\s)(?<!\bconst\s)(?<!\bvar\s)(?<!\.)\bchart\b/g,
            (match) => (match === 'chart' ? 'chartRef.current!' : match)
        );
    }

    return indexFile;
}
