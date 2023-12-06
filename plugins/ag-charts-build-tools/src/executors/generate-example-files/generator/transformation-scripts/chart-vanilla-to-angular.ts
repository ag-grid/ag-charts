import { getDarkModeSnippet } from '@components/site-header/getDarkModeSnippet';

import { convertTemplate, getImport, toAssignment, toConst, toInput, toMember } from './angular-utils';
import { wrapOptionsUpdateCode } from './chart-utils';
import { templatePlaceholder } from './chart-vanilla-src-parser';
import { addBindingImports, convertFunctionToProperty, isInstanceMethod } from './parser-utils';

export function processFunction(code: string): string {
    return wrapOptionsUpdateCode(convertFunctionToProperty(code));
}

function getImports(bindings, componentFileNames: string[], { typeParts }): string[] {
    const {
        imports: bImports = [],
        chartSettings: { enterprise = false },
    } = bindings;

    bImports.push({
        module: enterprise ? `'ag-charts-enterprise'` : `'ag-charts-community'`,
        isNamespaced: false,
        imports: typeParts,
    });

    const imports = [`import { Component${bindings.usesChartApi ? ', ViewChild' : ''} } from '@angular/core';`];
    imports.push(
        `import { AgChartsAngularModule${bindings.usesChartApi ? ', AgChartsAngular' : ''} } from 'ag-charts-angular';`
    );

    addBindingImports([...bImports], imports, true, true);

    if (componentFileNames) {
        imports.push(...componentFileNames.map(getImport));
    }

    return imports;
}

function getTemplate(bindings: any, attributes: string[]): string {
    const agChartTag = `<ag-charts-angular
    style="height: 100%"
    ${attributes.join('\n    ')}
    ></ag-charts-angular>`;

    const template = bindings.template ? bindings.template.replace(templatePlaceholder, agChartTag) : agChartTag;

    return convertTemplate(template);
}

export function vanillaToAngular(bindings: any, componentFileNames: string[]): () => string {
    return () => {
        const { properties, declarations, optionsTypeInfo } = bindings;
        const opsTypeInfo = optionsTypeInfo;
        const imports = getImports(bindings, componentFileNames, opsTypeInfo);

        const propertyAttributes = [];
        const propertyVars = [];
        const propertyAssignments = [];

        properties.forEach((property) => {
            if (property.value === 'true' || property.value === 'false') {
                propertyAttributes.push(toConst(property));
            } else if (property.value === null || property.value === 'null') {
                propertyAttributes.push(toInput(property));
            } else {
                // for when binding a method
                // see javascript-grid-keyboard-navigation for an example
                // tabToNextCell needs to be bound to the angular component
                if (!isInstanceMethod(bindings.instanceMethods, property)) {
                    propertyAttributes.push(toInput(property));
                    propertyVars.push(toMember(property));
                }

                propertyAssignments.push(toAssignment(property));
            }
        });

        const instanceMethods = bindings.instanceMethods.map(processFunction);
        const template = getTemplate(bindings, propertyAttributes);
        const externalEventHandlers = bindings.externalEventHandlers.map((handler) => processFunction(handler.body));

        let appComponent = `${imports.join('\n')}${declarations.length > 0 ? '\n' + declarations.join('\n') : ''}

@Component({
    selector: 'my-app',
    standalone: true,
    imports: [AgChartsAngularModule],
    template: \`${template}\`
})

export class AppComponent {
    public options: ${opsTypeInfo.typeStr};
    ${propertyVars.filter((p) => p.name === 'options').join('\n')}
    ${
        bindings.usesChartApi
            ? `\n    @ViewChild(AgChartsAngular)
    public agCharts!: AgChartsAngular;\n`
            : ''
    }
    constructor() {
        ${propertyAssignments.join(';\n')}
    }

    ngOnInit() {
        ${bindings.init.join(';\n    ')}
        ${getDarkModeSnippet('angular')}
    }

    ${instanceMethods
        .concat(externalEventHandlers)
        .map((snippet) => snippet.trim())
        .join('\n\n')}
}

${bindings.globals.join('\n')}
`;
        if (bindings.usesChartApi) {
            appComponent = appComponent.replace(/AgCharts.(\w*)\((\w*)(,|\))/g, 'AgCharts.$1(this.agCharts.chart!$3');
            appComponent = appComponent.replace(
                /\(this.agCharts.chart!, options/g,
                '(this.agCharts.chart!, this.options'
            );
        }
        return appComponent;
    };
}
