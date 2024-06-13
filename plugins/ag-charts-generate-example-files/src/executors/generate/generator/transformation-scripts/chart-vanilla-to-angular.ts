import { convertTemplate, getImport } from './angular-utils';
import { wrapOptionsUpdateCode } from './chart-utils';
import { addBindingImports, convertFunctionToProperty, isFinancialCharts, isInstanceMethod } from './parser-utils';
import { toKebabCase, toTitleCase } from './string-utils';

export function processFunction(code: string): string {
    return wrapOptionsUpdateCode(convertFunctionToProperty(code));
}

function getImports(bindings, componentFileNames: string[], { typeParts }): string[] {
    const {
        chartSettings: { enterprise = false },
    } = bindings;

    const type = isFinancialCharts(bindings) ? 'AgFinancialCharts' : 'AgCharts';
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
    const tag = isFinancialCharts(bindings) ? 'ag-financial-charts' : 'ag-charts';
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

export async function vanillaToAngular(bindings: any, componentFileNames: string[]): Promise<string> {
    const { properties, declarations, optionsTypeInfo } = bindings;
    const type = isFinancialCharts(bindings) ? 'AgFinancialCharts' : 'AgCharts';
    const opsTypeInfo = optionsTypeInfo;
    const imports = getImports(bindings, componentFileNames, opsTypeInfo);
    const placeholders = Object.keys(bindings.placeholders);

    let indexFile: string;

    if (placeholders.length <= 1) {
        const options = properties.find((p) => p.name === 'options');
        const { propertyAttributes, propertyAssignments, propertyVars } = getComponentMetadata(bindings, options);
        const template = getTemplate(bindings, placeholders[0], propertyAttributes);

        const instanceMethods = bindings.instanceMethods.map(processFunction);
        const externalEventHandlers = bindings.externalEventHandlers.map((handler) => processFunction(handler.body));

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
    } else {
        const components: Array<{ selector: string; className: string }> = [];

        let template = bindings.template.trim();
        Object.entries(bindings.placeholders).forEach(([id, placeholder]) => {
            const selector = toKebabCase(id);
            const { style } = bindings.chartAttributes[id];
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
    }

    return indexFile;
}
