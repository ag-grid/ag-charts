import { getChartImports, wrapOptionsUpdateCode } from './chart-utils';
import { getFunctionName, isInstanceMethod, removeFunctionKeyword } from './parser-utils';
import { convertTemplate, getImport, toAssignment, toConst, toInput, toMember } from './vue-utils';

function processFunction(code: string): string {
    return wrapOptionsUpdateCode(removeFunctionKeyword(code));
}

function getImports(componentFileNames: string[], bindings): string[] {
    const imports = ["import Vue from 'vue';", "import { AgChartsVue } from 'ag-charts-vue';"];

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

function getPropertyBindings(bindings: any): [string[], string[], string[]] {
    const propertyAssignments = [];
    const propertyVars = [];
    const propertyAttributes = [];

    bindings.properties.forEach((property) => {
        if (property.name === 'options') {
            propertyAttributes.push(toInput(property));
            propertyVars.push(`${property.name}: ${property.value}`);
        } else if (property.value === 'true' || property.value === 'false') {
            propertyAttributes.push(toConst(property));
        } else if (property.value === null || property.value === 'null') {
            propertyAttributes.push(toInput(property));
        } else {
            // for when binding a method
            // see javascript-grid-keyboard-navigation for an example
            // tabToNextCell needs to be bound to the react component
            if (!isInstanceMethod(bindings.instanceMethods, property)) {
                propertyAttributes.push(toInput(property));
                propertyVars.push(toMember(property));
            }

            propertyAssignments.push(toAssignment(property));
        }
    });

    return [propertyAssignments, propertyVars, propertyAttributes];
}

function getTemplate(bindings: any, attributes: string[]): string {
    /* prettier-ignore */
    const agChartTag = `<ag-charts-vue${bindings.usesChartApi ? `
    ref="agCharts"` : ''}
    ${attributes.join('\n')}
/>`;

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

export async function vanillaToVue(bindings: any, componentFileNames: string[]): Promise<string> {
    const imports = getImports(componentFileNames, bindings);
    const [propertyAssignments, propertyVars, propertyAttributes] = getPropertyBindings(bindings);
    const [externalEventHandlers, instanceMethods, globalMethods] = getAllMethods(bindings);
    const template = getTemplate(bindings, propertyAttributes);

    const methods = instanceMethods.concat(externalEventHandlers);

    /* prettier-ignore */
    let mainFile = `${imports.join('\n')}

const ChartExample = {
    template: \`
        ${template}
    \`,
    components: {
        'ag-charts-vue': AgChartsVue
    },
    data() {
        return {
            ${propertyVars.join(',\n            ')}
        }
    },
    ${propertyAssignments.length !== 0 ? `
    created() {
        ${propertyAssignments.join(';\n           ')}
    },` : ''}
    ${bindings.init.length !== 0 ? `
    mounted() {
        ${bindings.init.join(';\n        ')}
    },` : ''}
    ${methods.length !== 0 ? `
    methods: {
        ${methods
            .map((snippet) => `${snippet.trim()},`)
            .join('        ')}
    },
    ` : ''}
}

${globalMethods.join('\n\n')}

new Vue({
    el: '#app',
    components: {
        'my-component': ChartExample
    }
});
`;

    if (bindings.usesChartApi) {
        mainFile = mainFile.replace(/AgCharts.(\w*)\((\w*)(,|\))/g, 'AgCharts.$1(this.$refs.agCharts.chart$3');
        mainFile = mainFile.replace(
            /\(this.\$refs.agCharts.chart, options/g,
            '(this.$refs.agCharts.chart, this.options'
        );
    }

    return mainFile;
}
