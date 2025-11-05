import { convertTemplate, getImport } from './angular-utils';
import { wrapOptionsUpdateCode } from './chart-utils';
import {
    type ChartAPI,
    addBindingImports,
    chartApi,
    convertFunctionToProperty,
    isInstanceMethod,
} from './parser-utils';
import { toKebabCase, toTitleCase } from './string-utils';

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

function processFunction(code: string, suppressOptionsClone: boolean, methodNames: string[] = []): string {
    let processed = wrapOptionsUpdateCode(
        convertFunctionToProperty(code),
        'this.options',
        undefined,
        undefined,
        !suppressOptionsClone
    );

    // Add this. prefix to instance method calls within this function
    methodNames.forEach((methodName) => {
        if (!GLOBAL_FUNCTIONS.includes(methodName)) {
            // Negative lookbehind: not preceded by '.' (covers this.method, obj.method, etc.)
            // Negative lookahead: not followed by '=' or ':' (for declarations like 'method = ')
            const regex = new RegExp(`(?<!\\.)\\b${methodName}\\b(?!\\s*[=:])`, 'g');
            processed = processed.replace(regex, `this.${methodName}`);
        }
    });

    return processed;
}

function getImports(bindings, componentFileNames: string[], { typeParts }): string[] {
    const {
        chartSettings: { enterprise = false },
    } = bindings;

    const type = components[chartApi(bindings)];
    const bImports = bindings.imports.map((i) => ({
        ...i,
        imports: i.imports.filter((imp) => imp !== 'AgCharts'),
    }));
    bImports.push({
        module: enterprise ? `'ag-charts-enterprise'` : `'ag-charts-community'`,
        isNamespaced: false,
        imports: typeParts,
    });

    const imports = [`import { Component${bindings.usesChartApi ? ', ViewChild' : ''} } from '@angular/core';`];
    imports.push(`import { ${type} } from 'ag-charts-angular';`);

    addBindingImports([...bImports], imports, true, true);

    if (componentFileNames) {
        imports.push(...componentFileNames.map(getImport));
    }

    if (bindings.externalEventHandlers.length > 0 || bindings.instanceMethods.length > 0) {
        imports.push(`import clone from 'clone';`);
    }

    return imports;
}

function getComponentMetadata(bindings: any, property: any) {
    const propertyAttributes = [];
    const propertyVars = [];
    const propertyAssignments = [];

    if (!isInstanceMethod(bindings.instanceMethods, property)) {
        propertyAttributes.push(`[options]="${property.name}"`);
        propertyVars.push(`public ${property.name};`);
        propertyAssignments.push(`this.${property.name} = ${property.value};`);
    }

    return { propertyAttributes, propertyVars, propertyAssignments };
}

function getAngularTag(bindings: any, attributes: string[]) {
    const tag = tags[chartApi(bindings)];
    return `<${tag}
        ${attributes.join(`
        `)}
    ></${tag}>`;
}

function getTemplate(bindings: any, id: string, attributes: string[]): string {
    attributes = [...attributes];

    Object.entries(bindings.chartAttributes[id]).forEach(([key, value]) => {
        if (key === 'style') {
            attributes.push(`style=${JSON.stringify(value as any)}`);
        } else if (key === 'class') {
            attributes.push(`class=${JSON.stringify(value as any)}`);
        } else {
            throw new Error(`Unknown chart attribute: ${key}`);
        }
    });

    const agChartTag = getAngularTag(bindings, attributes);

    let template = bindings.template ?? agChartTag;
    Object.values(bindings.placeholders).forEach((placeholder) => {
        template = template.replace(placeholder, agChartTag);
    });

    return convertTemplate(template);
}

// Built-in/global functions that should NOT be transformed with this. prefix
const GLOBAL_FUNCTIONS = [
    'requestAnimationFrame',
    'cancelAnimationFrame',
    'setTimeout',
    'setInterval',
    'clearTimeout',
    'clearInterval',
    'performance',
    'console',
    'Math',
    'JSON',
    'Object',
    'Array',
    'Date',
    'String',
    'Number',
    'Boolean',
    'Error',
    'parseInt',
    'parseFloat',
    'isNaN',
    'isFinite',
    'encodeURIComponent',
    'decodeURIComponent',
    'clone', // from imports
];

function getInstanceMethodNames(bindings: any): string[] {
    const eventHandlerNames = bindings.externalEventHandlers.map((h) => h.name);
    const instanceMethodNames = bindings.instanceMethods
        .map((m) => {
            // Extract function name from declaration
            // Handles: "function methodName()" (including async), "methodName = () =>", and "methodName: () =>"
            const fnDeclMatch = m.match(/^\s*(?:async\s+)?function\s+(\w+)\s*\(/);
            if (fnDeclMatch) {
                return fnDeclMatch[1];
            }
            const match = m.match(/^\s*(\w+)\s*[=:]/);
            return match ? match[1] : null;
        })
        .filter(Boolean);
    return [...eventHandlerNames, ...instanceMethodNames];
}

export async function vanillaToAngular(
    bindings: any,
    componentFileNames: string[],
    suppressOptionsClone: boolean
): Promise<string> {
    const { properties, declarations, optionsTypeInfo } = bindings;
    const type = components[chartApi(bindings)];
    const opsTypeInfo = optionsTypeInfo;
    const imports = getImports(bindings, componentFileNames, opsTypeInfo);
    const placeholders = Object.keys(bindings.placeholders);

    let indexFile: string;

    if (placeholders.length <= 1) {
        const options = properties.find((p) => p.name === 'options');
        const { propertyAttributes, propertyAssignments, propertyVars } = getComponentMetadata(bindings, options);
        const template = getTemplate(bindings, placeholders[0], propertyAttributes);

        // Get method names first so we can transform calls within method bodies
        const methodNames = getInstanceMethodNames(bindings);

        const instanceMethods = bindings.instanceMethods.map((v) =>
            processFunction(v, suppressOptionsClone, methodNames)
        );
        const externalEventHandlers = bindings.externalEventHandlers.map((handler) =>
            processFunction(handler.body, suppressOptionsClone, methodNames)
        );

        indexFile = `${imports.join('\n')}${declarations.length > 0 ? '\n' + declarations.join('\n') : ''}

        ${bindings.globals.join('\n')}

        @Component({
            selector: 'my-app',
            standalone: true,
            imports: [${type}],
            template: \`${template}\`
        })
        export class AppComponent {
            ${propertyVars.join(`
            `)}

            ${
                bindings.usesChartApi
                    ? `\n    @ViewChild(${type})
            public agCharts!: ${type};\n`
                    : ''
            }
            constructor() {
                ${propertyAssignments.join(';\n')}
            }

            ${
                bindings.init.length !== 0
                    ? `
            ngOnInit() {
                ${bindings.init.join(';\n    ')}
            }
            `
                    : ''
            }

            ${instanceMethods
                .concat(externalEventHandlers)
                .map((snippet) => snippet.trim())
                .join('\n\n')}
        }
        `;

        // @todo(AG-14126) - handle listener events correctly
        indexFile = indexFile.replace('toggleDatum(event, event.datum);', 'this.toggleDatum(event, event.datum);');
    } else {
        const components: Array<{ selector: string; className: string }> = [];

        let template = bindings.template.trim();
        Object.entries(bindings.placeholders).forEach(([id, placeholder]) => {
            const selector = toKebabCase(id);
            let { style } = bindings.chartAttributes[id];
            // display: grid needed because Angular adds additional dom nodes compared to other frameworks
            style = `display: grid; ${style}`.trim();
            template = template.replace(placeholder, `<${selector} style="${style}"></${selector}>`);
        });

        indexFile = `${imports.join('\n')}${declarations.length > 0 ? '\n' + declarations.join('\n') : ''}

        ${bindings.globals.join('\n')}
        `;

        placeholders.forEach((id) => {
            const selector = toKebabCase(id);
            const className = toTitleCase(id);

            const propertyName = bindings.chartProperties[id];
            const { propertyAttributes, propertyAssignments, propertyVars } = getComponentMetadata(
                bindings,
                properties.find((p) => p.name === propertyName)
            );

            const template = getAngularTag(bindings, propertyAttributes);

            indexFile = `${indexFile}

            @Component({
                selector: '${selector}',
                standalone: true,
                imports: [${type}],
                template: \`${template}\`
            })
            class ${className} {
                ${propertyVars.join(`
                `)}

                constructor() {
                    ${propertyAssignments.join(';\n')}
                }
            }`;

            components.push({ selector, className });
        });

        indexFile = `${indexFile}

        @Component({
            selector: 'my-app',
            standalone: true,
            imports: [${components.map((c) => c.className).join(', ')}],
            template: \`${template}\`
        })
        export class AppComponent {
        }
        `;
    }

    if (bindings.usesChartApi) {
        indexFile = indexFile.replace(/AgCharts.(\w*)\((\w*)(,|\))/g, 'AgCharts.$1(this.agCharts.chart!$3');
        indexFile = indexFile.replace(/chart.(\w*)\(/g, 'this.agCharts.chart!.$1(');
        indexFile = indexFile.replace(/this.agCharts.chart!.(\w*)\(options/g, 'this.agCharts.chart!.$1(this.options');
        indexFile = indexFile.replace(/(?<!\.)\bchart\b/g, 'this.agCharts.chart!');
    }

    return indexFile;
}
