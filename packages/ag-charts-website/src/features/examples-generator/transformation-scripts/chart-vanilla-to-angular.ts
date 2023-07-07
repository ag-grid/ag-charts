import { templatePlaceholder } from "./chart-vanilla-src-parser";
import {
  addBindingImports,
  convertFunctionToProperty,
  isInstanceMethod,
} from "./parser-utils";
import {
  toInput,
  toConst,
  toMember,
  toAssignment,
  convertTemplate,
  getImport,
} from "./angular-utils";
import { wrapOptionsUpdateCode } from "./chart-utils";

export function processFunction(code: string): string {
  return wrapOptionsUpdateCode(convertFunctionToProperty(code));
}

function getImports(
  bindings,
  componentFileNames: string[],
  { typeParts }
): string[] {
  const {
    imports: bImports = [],
    chartSettings: { enterprise = false },
  } = bindings;

  bImports.push({
    module: enterprise ? `'ag-charts-enterprise'` : `'ag-charts-community'`,
    isNamespaced: false,
    imports: typeParts,
  });

  const imports = [
    `import { Component${
      bindings.usesChartApi ? ", ViewChild" : ""
    } } from '@angular/core';`,
  ];
  if (bindings.usesChartApi) {
    imports.push("import { AgChartsAngular } from 'ag-charts-angular';");
  }

  addBindingImports([...bImports], imports, true, true);

  if (componentFileNames) {
    imports.push(...componentFileNames.map(getImport));
  }

  return imports;
}

function getTemplate(bindings: any, attributes: string[]): string {
  const agChartTag = `<ag-charts-angular
    style="height: 100%"
    ${attributes.join("\n    ")}
    ></ag-charts-angular>`;

  const template = bindings.template
    ? bindings.template.replace(templatePlaceholder, agChartTag)
    : agChartTag;

  return convertTemplate(template);
}

export function vanillaToAngular(
  bindings: any,
  componentFileNames: string[]
): () => string {
  return () => {
    const { properties, declarations, optionsTypeInfo } = bindings;
    const opsTypeInfo = optionsTypeInfo;
    const imports = getImports(bindings, componentFileNames, opsTypeInfo);

    const propertyAttributes = [];
    const propertyVars = [];
    const propertyAssignments = [];

    properties.forEach((property) => {
      if (property.value === "true" || property.value === "false") {
        propertyAttributes.push(toConst(property));
      } else if (property.value === null || property.value === "null") {
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
    const externalEventHandlers = bindings.externalEventHandlers.map(
      (handler) => processFunction(handler.body)
    );

    let appComponent = `${imports.join("\n")}${
      declarations.length > 0 ? "\n" + declarations.join("\n") : ""
    }

@Component({
    selector: 'my-app',
    template: \`${template}\`
})

export class AppComponent {
    public options: ${opsTypeInfo.typeStr};
    ${propertyVars.filter((p) => p.name === "options").join("\n")}
    ${
      bindings.usesChartApi
        ? `\n    @ViewChild(AgChartsAngular)
    public agChart!: AgChartsAngular;\n`
        : ""
    }
    constructor() {
        ${propertyAssignments.join(";\n")}
    }

    ngOnInit() {
        ${bindings.init.join(";\n    ")}
    }

    ${instanceMethods
      .concat(externalEventHandlers)
      .map((snippet) => snippet.trim())
      .join("\n\n")}
}

${bindings.globals.join("\n")}
`;
    if (bindings.usesChartApi) {
      appComponent = appComponent.replace(
        /AgChart.(\w*)\((\w*)(,|\))/g,
        "AgChart.$1(this.agChart.chart!$3"
      );
      appComponent = appComponent.replace(
        /AgEnterpriseCharts.(\w*)\((\w*)(,|\))/g,
        "AgEnterpriseCharts.$1(this.agChart.chart!$3"
      );
      appComponent = appComponent.replace(
        /\(this.agChart.chart!, options/g,
        "(this.agChart.chart!, this.options"
      );
    }
    return appComponent;
  };
}

if (typeof window !== "undefined") {
  (<any>window).vanillaToAngular = vanillaToAngular;
}
