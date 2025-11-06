import { getChartImports, wrapOptionsUpdateCode } from './chart-utils';
import { type ChartAPI, addBindingImports, chartApi, convertFunctionToConstPropertyTs } from './parser-utils';
import { toKebabCase, toTitleCase } from './string-utils';
import { convertTemplate, getImport, indentTemplate } from './vue-utils';

const components: Record<ChartAPI, string> = {
    gauge: 'AgGauge',
    financial: 'AgFinancialCharts',
    sparkline: 'AgSparkline',
    vanilla: 'AgCharts',
};

const tags: Record<ChartAPI, string> = {
    gauge: 'ag-gauge',
    financial: 'ag-financial-charts',
    sparkline: 'ag-sparkline',
    vanilla: 'ag-charts',
};

function processFunction(code: string, suppressOptionsClone: boolean): string {
    return wrapOptionsUpdateCode(
        convertFunctionToConstPropertyTs(code),
        'options.value',
        'options.value = optionsCopy;',
        'optionsCopy',
        !suppressOptionsClone
    );
}

function getImports(componentFileNames: string[], bindings): string[] {
    const type = components[chartApi(bindings)];
    const imports = [
        "import { createApp, defineComponent, ref } from 'vue';",
        `import { ${type} } from 'ag-charts-vue3';`,
        "import type { AgChartOptions } from 'ag-charts-types';",
    ];

    const chartImports = bindings.imports.map((i) => ({
        ...i,
        imports: i.imports.filter((imp) => imp !== 'AgCharts'),
    }));

    if (chartImports.length > 0) {
        addBindingImports(chartImports, imports, false, true);
    }

    if (componentFileNames) {
        imports.push(...componentFileNames.map(getImport));
    }

    if (bindings.externalEventHandlers.length > 0 || bindings.instanceMethods.length > 0) {
        imports.push(`import clone from 'clone';`);
    }

    return imports;
}

function getPropertyBindings(bindings: any, id: string, property: any) {
    const propertyAssignments = [];
    const propertyVars = [];
    const propertyAttributes = [];
    const propertyNames = [];

    propertyNames.push(property.name);
    propertyVars.push(
        `const ${property.name} = ref${property.name === 'options' ? '<AgChartOptions>' : ''}(${property.value});`
    );
    if (bindings.usesChartApi) {
        propertyNames.push('agCharts');
        propertyVars.push(`const agCharts = ref(null);`);
    }
    propertyAttributes.push(`:options="${property.name}"`);

    Object.entries(bindings.chartAttributes[id]).forEach(([key, value]) => {
        if (key === 'style') {
            propertyAttributes.push(`style=${JSON.stringify(value as any)}`);
        } else if (key === 'class') {
            propertyAttributes.push(`class=${JSON.stringify(value as any)}`);
        } else {
            throw new Error(`Unknown chart attribute: ${key}`);
        }
    });

    return { propertyAssignments, propertyVars, propertyAttributes, propertyNames };
}

function getVueTag(tag: string, bindings: any, attributes: string[]) {
    return `<${tag}\n` + (bindings.usesChartApi ? `ref="agCharts"\n` : '') + attributes.join('\n') + `\n/>`;
}

function getTemplate(tag: string, bindings: any, attributes: string[]): string {
    /* prettier-ignore */
    const agChartTag = getVueTag(tag, bindings, attributes)

    let template = bindings.template ?? agChartTag;
    Object.values(bindings.placeholders).forEach((placeholder) => {
        template = template.replace(placeholder, agChartTag);
    });

    return convertTemplate(template);
}

function getAllMethods(bindings: any, suppressOptionsClone: boolean): [string[], string[], string[], string[]] {
    const externalEventHandlers = bindings.externalEventHandlers.map((event) =>
        processFunction(event.body, suppressOptionsClone)
    );
    const instanceMethods = bindings.instanceMethods.map((v) => processFunction(v, suppressOptionsClone));
    // bindings.instanceMethods.map(event => console.log(event));

    const globalMethods = bindings.globals.map((body) => {
        return body;
    });

    const methodNames = bindings.externalEventHandlers.map((event) => event.name);

    return [externalEventHandlers, instanceMethods, globalMethods, methodNames];
}

export async function vanillaToVue3(
    bindings: any,
    componentFileNames: string[],
    suppressOptionsClone: boolean
): Promise<string> {
    const { properties } = bindings;
    const type = components[chartApi(bindings)];
    const tag = tags[chartApi(bindings)];
    const imports = getImports(componentFileNames, bindings);
    const [externalEventHandlers, instanceMethods, globalMethods, methodNames] = getAllMethods(
        bindings,
        suppressOptionsClone
    );
    const placeholders = Object.keys(bindings.placeholders);

    const methods = instanceMethods.concat(externalEventHandlers);

    let mainFile: string;

    // placeholders are for when a chart id is set - for example <div id="myChart"></div>
    if (placeholders.length <= 1) {
        const options = properties.find((p) => p.name === 'options');
        const { propertyVars, propertyAttributes, propertyNames } = getPropertyBindings(
            bindings,
            placeholders[0],
            options
        );
        const template = getTemplate(tag, bindings, propertyAttributes);

        mainFile = `
            ${imports.join('\n')}

            ${globalMethods.join('\n\n')}

            const ChartExample = defineComponent({
                template: \`\n${template}\n  \`,
                components: {
                    '${tag}': ${type}
                },
                setup(props) {
                    ${propertyVars.join(`;
                    `)}

                    ${methods.join(`;
                    `)}

                    ${
                        bindings.init.length > 0
                            ? `
                    ${bindings.init.join(`;
                    `)}
                    `
                            : ''
                    }

                    return {
                        ${propertyNames.concat(methodNames).join(`,
                        `)}
                    }
                }
            })

            createApp(ChartExample).mount("#app");
        `;
    } else {
        const components: Array<{ selector: string; className: string }> = [];

        let template = bindings.template.trim();
        Object.entries(bindings.placeholders).forEach(([id, placeholder]) => {
            const selector = toKebabCase(id);
            const { style } = bindings.chartAttributes[id];
            template = template.replace(placeholder, `<${selector} style="${style}"></${selector}>`);
        });

        mainFile = `
            ${imports.join('\n')}

            ${globalMethods.join('\n\n')}
        `;

        placeholders.forEach((id) => {
            const selector = toKebabCase(id);
            const className = toTitleCase(id);

            const propertyName = bindings.chartProperties[id];
            const { propertyVars, propertyAttributes, propertyNames } = getPropertyBindings(
                bindings,
                id,
                properties.find((p) => p.name === propertyName)
            );
            const template = getVueTag(tag, bindings, propertyAttributes);

            mainFile = `${mainFile}

            const ${className} = {
                template: \`\n${indentTemplate(template, 2, 2)}\n  \`,
                components: {
                    '${tag}': ${type}
                },
                setup(props) {
                    ${propertyVars.join(`
                    `)}

                    ${
                        bindings.init.length > 0
                            ? `
                    ${bindings.init.join(`
                    `)}
                    `
                            : ''
                    }

                    ${methods.join(`
                    `)}

                    return {
                        ${propertyNames.concat(methodNames).join(`,
                        `)}
                    }
                }
            }
            `;

            components.push({ selector, className });
        });

        mainFile = `${mainFile}

        const ChartExample = {
            template: \`\n${indentTemplate(template, 2, 2)}\n  \`,
            components: {
                ${components.map((c) => `'${c.selector}': ${c.className}`).join(`,
                `)}
            },
        }

        createApp(ChartExample).mount("#app");
        `;
    }

    if (bindings.usesChartApi) {
        mainFile = mainFile.replace(/AgCharts.(\w*)\((\w*)(,|\))/g, 'AgCharts.$1(agCharts.value.chart$3');
        mainFile = mainFile.replace(/chart.(\w*)\(/g, 'agCharts.value.chart.$1(');
        mainFile = mainFile.replace(
            /this.\$refs.agCharts.chart.(\w*)\(options/g,
            'agCharts.value.chart.$1(options.value'
        );
        // Split multi-variable declarations containing 'chart' to avoid breaking syntax
        mainFile = mainFile.replace(/\b(let|const|var)\s+chart\s*,\s*(\w+)/g, '$1 chart;\n    $1 $2');
        // Replace 'chart' references but not in variable declarations
        mainFile = mainFile.replace(/(?<!\blet\s)(?<!\bconst\s)(?<!\bvar\s)(?<!\.)\bchart\b/g, 'agCharts.value.chart');
    }

    return mainFile;
}
