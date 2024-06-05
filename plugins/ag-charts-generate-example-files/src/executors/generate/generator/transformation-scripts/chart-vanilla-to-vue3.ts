import { getChartImports, wrapOptionsUpdateCode } from './chart-utils';
import { getFunctionName, isInstanceMethod, removeFunctionKeyword } from './parser-utils';
import { toKebabCase, toTitleCase } from './string-utils';
import { convertTemplate, getImport, indentTemplate, toAssignment, toConst, toInput, toMember } from './vue-utils';

function processFunction(code: string): string {
    return wrapOptionsUpdateCode(removeFunctionKeyword(code));
}

function getImports(componentFileNames: string[], bindings): string[] {
    const imports = ["import { createApp } from 'vue';", "import { AgChartsVue } from 'ag-charts-vue3';"];

    const chartImport = getChartImports(bindings.imports, bindings.usesChartApi);
    if (chartImport) {
        imports.push(chartImport);
    }

    if (componentFileNames) {
        imports.push(...componentFileNames.map(getImport));
    }

    if (bindings.chartSettings.enterprise) {
        imports.push("import 'ag-charts-enterprise';");
    }

    return imports;
}

function getPropertyBindings(bindings: any, property: any) {
    const propertyAssignments = [];
    const propertyVars = [];
    const propertyAttributes = [];

    propertyVars.push(`${property.name}: ${property.value}`);
    propertyAttributes.push(`:options="${property.name}"`);

    return { propertyAssignments, propertyVars, propertyAttributes };
}

function getVueTag(bindings: any, attributes: string[]) {
    return `<ag-charts-vue\n` + (bindings.usesChartApi ? `ref="agCharts"\n` : '') + attributes.join('\n') + `\n/>`;
}

function getTemplate(bindings: any, attributes: string[]): string {
    /* prettier-ignore */
    const agChartTag = getVueTag(bindings, attributes)

    let template = bindings.template ?? agChartTag;
    Object.values(bindings.placeholders).forEach((placeholder) => {
        template = template.replace(placeholder, agChartTag);
    });

    return convertTemplate(template);
}

function getAllMethods(bindings: any): [string[], string[], string[]] {
    const externalEventHandlers = bindings.externalEventHandlers.map((event) => processFunction(event.body));
    const instanceMethods = bindings.instanceMethods.map(processFunction);

    const globalMethods = bindings.globals.map((body) => {
        const funcName = getFunctionName(body);

        if (funcName) {
            return `window.${funcName} = ${body}`;
        }

        // probably a var
        return body;
    });

    return [externalEventHandlers, instanceMethods, globalMethods];
}

export async function vanillaToVue3(bindings: any, componentFileNames: string[]): Promise<string> {
    const { properties } = bindings;
    const imports = getImports(componentFileNames, bindings);
    const [externalEventHandlers, instanceMethods, globalMethods] = getAllMethods(bindings);
    const placeholders = Object.keys(bindings.placeholders);

    const methods = instanceMethods.concat(externalEventHandlers);

    let mainFile: string;

    if (placeholders.length <= 1) {
        const options = properties.find((p) => p.name === 'options');
        const { propertyAssignments, propertyVars, propertyAttributes } = getPropertyBindings(bindings, options);
        const template = getTemplate(bindings, propertyAttributes);

        mainFile = `
            ${imports.join('\n')}

            ${globalMethods.join('\n\n')}

            const ChartExample = {
                template: \`\n${template}\n  \`,
                components: {
                    'ag-charts-vue': AgChartsVue
                },
                data() {
                    return {
                        ${propertyVars.join(`,
                        `)}
                    }
                },
                ${
                    propertyAssignments.length !== 0
                        ? `
                created() {
                    ${propertyAssignments.join(`;
                    `)}
                },`
                        : ''
                }
                ${
                    bindings.init.length !== 0
                        ? `
                mounted() {
                    ${bindings.init.join(`;
                    `)}
                },`
                        : ''
                }
                ${
                    methods.length !== 0
                        ? `
                methods: {
                    ${methods.map((snippet) => `${snippet.trim()},`).join(`
                    `)}
                },
                `
                        : ''
                }
            }

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
            const { propertyVars, propertyAttributes } = getPropertyBindings(
                bindings,
                properties.find((p) => p.name === propertyName)
            );
            const template = getVueTag(bindings, propertyAttributes);

            mainFile = `${mainFile}

            const ${className} = {
                template: \`\n${indentTemplate(template, 2, 2)}\n  \`,
                components: {
                    'ag-charts-vue': AgChartsVue
                },
                data() {
                    return {
                        ${propertyVars.join(`,
                        `)}
                    }
                },
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
        mainFile = mainFile.replace(/AgCharts.(\w*)\((\w*)(,|\))/g, 'AgCharts.$1(this.$refs.agCharts.chart$3');
        mainFile = mainFile.replace(/chart.(\w*)\(/g, 'this.$refs.agCharts.chart.$1(');
        mainFile = mainFile.replace(
            /this.\$refs.agCharts.chart.(\w*)\(options/g,
            'this.$refs.agCharts.chart.$1(this.options'
        );
    }

    return mainFile;
}
