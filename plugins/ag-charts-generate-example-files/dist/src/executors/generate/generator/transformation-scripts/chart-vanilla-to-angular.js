"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    processFunction: function() {
        return processFunction;
    },
    vanillaToAngular: function() {
        return vanillaToAngular;
    }
});
const _angularutils = require("./angular-utils");
const _chartutils = require("./chart-utils");
const _parserutils = require("./parser-utils");
const _stringutils = require("./string-utils");
function processFunction(code) {
    return (0, _chartutils.wrapOptionsUpdateCode)((0, _parserutils.convertFunctionToProperty)(code));
}
function getImports(bindings, componentFileNames, { typeParts }) {
    const { imports: bImports = [], chartSettings: { enterprise = false } } = bindings;
    bImports.push({
        module: enterprise ? `'ag-charts-enterprise'` : `'ag-charts-community'`,
        isNamespaced: false,
        imports: typeParts
    });
    const imports = [
        `import { Component${bindings.usesChartApi ? ', ViewChild' : ''} } from '@angular/core';`
    ];
    imports.push(`import { AgChartsAngular } from 'ag-charts-angular';`);
    (0, _parserutils.addBindingImports)([
        ...bImports
    ], imports, true, true);
    if (componentFileNames) {
        imports.push(...componentFileNames.map(_angularutils.getImport));
    }
    return imports;
}
function getComponentMetadata(bindings, property) {
    const propertyAttributes = [];
    const propertyVars = [];
    const propertyAssignments = [];
    if (!(0, _parserutils.isInstanceMethod)(bindings.instanceMethods, property)) {
        propertyAttributes.push(`[options]="${property.name}"`);
        propertyVars.push(`public ${property.name};`);
        propertyAssignments.push(`this.${property.name} = ${property.value};`);
    }
    return {
        propertyAttributes,
        propertyVars,
        propertyAssignments
    };
}
function getAngularTag(attributes) {
    return `<ag-charts-angular
        style="height: 100%;"
        ${attributes.join(`
        `)}
    ></ag-charts-angular>`;
}
function getTemplate(bindings, attributes) {
    const agChartTag = getAngularTag(attributes);
    var _bindings_template;
    let template = (_bindings_template = bindings.template) != null ? _bindings_template : agChartTag;
    Object.values(bindings.placeholders).forEach((placeholder)=>{
        template = template.replace(placeholder, agChartTag);
    });
    return (0, _angularutils.convertTemplate)(template);
}
async function vanillaToAngular(bindings, componentFileNames) {
    const { properties, declarations, optionsTypeInfo } = bindings;
    const opsTypeInfo = optionsTypeInfo;
    const imports = getImports(bindings, componentFileNames, opsTypeInfo);
    const placeholders = Object.keys(bindings.placeholders);
    let indexFile;
    if (placeholders.length <= 1) {
        const options = properties.find((p)=>p.name === 'options');
        const { propertyAttributes, propertyAssignments, propertyVars } = getComponentMetadata(bindings, options);
        const template = getTemplate(bindings, propertyAttributes);
        const instanceMethods = bindings.instanceMethods.map(processFunction);
        const externalEventHandlers = bindings.externalEventHandlers.map((handler)=>processFunction(handler.body));
        indexFile = `${imports.join('\n')}${declarations.length > 0 ? '\n' + declarations.join('\n') : ''}

        ${bindings.globals.join('\n')}

        @Component({
            selector: 'my-app',
            standalone: true,
            imports: [AgChartsAngular],
            template: \`${template}\`
        })
        export class AppComponent {
            ${propertyVars.join(`
            `)}

            ${bindings.usesChartApi ? `\n    @ViewChild(AgChartsAngular)
            public agCharts!: AgChartsAngular;\n` : ''}
            constructor() {
                ${propertyAssignments.join(';\n')}
            }

            ${bindings.init.length !== 0 ? `
            ngOnInit() {
                ${bindings.init.join(';\n    ')}
            }
            ` : ''}

            ${instanceMethods.concat(externalEventHandlers).map((snippet)=>snippet.trim()).join('\n\n')}
        }
        `;
    } else {
        const components = [];
        let template = bindings.template.trim();
        Object.entries(bindings.placeholders).forEach(([id, placeholder])=>{
            const selector = (0, _stringutils.toKebabCase)(id);
            const { style } = bindings.chartAttributes[id];
            template = template.replace(placeholder, `<${selector} style="${style}"></${selector}>`);
        });
        indexFile = `${imports.join('\n')}${declarations.length > 0 ? '\n' + declarations.join('\n') : ''}

        ${bindings.globals.join('\n')}
        `;
        placeholders.forEach((id)=>{
            const selector = (0, _stringutils.toKebabCase)(id);
            const className = (0, _stringutils.toTitleCase)(id);
            const propertyName = bindings.chartProperties[id];
            const { propertyAttributes, propertyAssignments, propertyVars } = getComponentMetadata(bindings, properties.find((p)=>p.name === propertyName));
            const template = getAngularTag(propertyAttributes);
            indexFile = `${indexFile}

            @Component({
                selector: '${selector}',
                standalone: true,
                imports: [AgChartsAngular],
                template: \`${template}\`
            })
            class ${className} {
                ${propertyVars.join(`
                `)}

                constructor() {
                    ${propertyAssignments.join(';\n')}
                }
            }`;
            components.push({
                selector,
                className
            });
        });
        indexFile = `${indexFile}

        @Component({
            selector: 'my-app',
            standalone: true,
            imports: [${components.map((c)=>c.className).join(', ')}],
            template: \`${template}\`
        })
        export class AppComponent {
        }
        `;
    }
    if (bindings.usesChartApi) {
        indexFile = indexFile.replace(/AgCharts.(\w*)\((\w*)(,|\))/g, 'AgCharts.$1(this.agCharts.chart!$3');
        indexFile = indexFile.replace(/\(this.agCharts.chart!, options/g, '(this.agCharts.chart!, this.options');
    }
    return indexFile;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL3RyYW5zZm9ybWF0aW9uLXNjcmlwdHMvY2hhcnQtdmFuaWxsYS10by1hbmd1bGFyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNvbnZlcnRUZW1wbGF0ZSwgZ2V0SW1wb3J0IH0gZnJvbSAnLi9hbmd1bGFyLXV0aWxzJztcbmltcG9ydCB7IHdyYXBPcHRpb25zVXBkYXRlQ29kZSB9IGZyb20gJy4vY2hhcnQtdXRpbHMnO1xuaW1wb3J0IHsgYWRkQmluZGluZ0ltcG9ydHMsIGNvbnZlcnRGdW5jdGlvblRvUHJvcGVydHksIGlzSW5zdGFuY2VNZXRob2QgfSBmcm9tICcuL3BhcnNlci11dGlscyc7XG5pbXBvcnQgeyB0b0tlYmFiQ2FzZSwgdG9UaXRsZUNhc2UgfSBmcm9tICcuL3N0cmluZy11dGlscyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm9jZXNzRnVuY3Rpb24oY29kZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gd3JhcE9wdGlvbnNVcGRhdGVDb2RlKGNvbnZlcnRGdW5jdGlvblRvUHJvcGVydHkoY29kZSkpO1xufVxuXG5mdW5jdGlvbiBnZXRJbXBvcnRzKGJpbmRpbmdzLCBjb21wb25lbnRGaWxlTmFtZXM6IHN0cmluZ1tdLCB7IHR5cGVQYXJ0cyB9KTogc3RyaW5nW10ge1xuICAgIGNvbnN0IHtcbiAgICAgICAgaW1wb3J0czogYkltcG9ydHMgPSBbXSxcbiAgICAgICAgY2hhcnRTZXR0aW5nczogeyBlbnRlcnByaXNlID0gZmFsc2UgfSxcbiAgICB9ID0gYmluZGluZ3M7XG5cbiAgICBiSW1wb3J0cy5wdXNoKHtcbiAgICAgICAgbW9kdWxlOiBlbnRlcnByaXNlID8gYCdhZy1jaGFydHMtZW50ZXJwcmlzZSdgIDogYCdhZy1jaGFydHMtY29tbXVuaXR5J2AsXG4gICAgICAgIGlzTmFtZXNwYWNlZDogZmFsc2UsXG4gICAgICAgIGltcG9ydHM6IHR5cGVQYXJ0cyxcbiAgICB9KTtcblxuICAgIGNvbnN0IGltcG9ydHMgPSBbYGltcG9ydCB7IENvbXBvbmVudCR7YmluZGluZ3MudXNlc0NoYXJ0QXBpID8gJywgVmlld0NoaWxkJyA6ICcnfSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO2BdO1xuICAgIGltcG9ydHMucHVzaChgaW1wb3J0IHsgQWdDaGFydHNBbmd1bGFyIH0gZnJvbSAnYWctY2hhcnRzLWFuZ3VsYXInO2ApO1xuXG4gICAgYWRkQmluZGluZ0ltcG9ydHMoWy4uLmJJbXBvcnRzXSwgaW1wb3J0cywgdHJ1ZSwgdHJ1ZSk7XG5cbiAgICBpZiAoY29tcG9uZW50RmlsZU5hbWVzKSB7XG4gICAgICAgIGltcG9ydHMucHVzaCguLi5jb21wb25lbnRGaWxlTmFtZXMubWFwKGdldEltcG9ydCkpO1xuICAgIH1cblxuICAgIHJldHVybiBpbXBvcnRzO1xufVxuXG5mdW5jdGlvbiBnZXRDb21wb25lbnRNZXRhZGF0YShiaW5kaW5nczogYW55LCBwcm9wZXJ0eTogYW55KSB7XG4gICAgY29uc3QgcHJvcGVydHlBdHRyaWJ1dGVzID0gW107XG4gICAgY29uc3QgcHJvcGVydHlWYXJzID0gW107XG4gICAgY29uc3QgcHJvcGVydHlBc3NpZ25tZW50cyA9IFtdO1xuXG4gICAgaWYgKCFpc0luc3RhbmNlTWV0aG9kKGJpbmRpbmdzLmluc3RhbmNlTWV0aG9kcywgcHJvcGVydHkpKSB7XG4gICAgICAgIHByb3BlcnR5QXR0cmlidXRlcy5wdXNoKGBbb3B0aW9uc109XCIke3Byb3BlcnR5Lm5hbWV9XCJgKTtcbiAgICAgICAgcHJvcGVydHlWYXJzLnB1c2goYHB1YmxpYyAke3Byb3BlcnR5Lm5hbWV9O2ApO1xuICAgICAgICBwcm9wZXJ0eUFzc2lnbm1lbnRzLnB1c2goYHRoaXMuJHtwcm9wZXJ0eS5uYW1lfSA9ICR7cHJvcGVydHkudmFsdWV9O2ApO1xuICAgIH1cblxuICAgIHJldHVybiB7IHByb3BlcnR5QXR0cmlidXRlcywgcHJvcGVydHlWYXJzLCBwcm9wZXJ0eUFzc2lnbm1lbnRzIH07XG59XG5cbmZ1bmN0aW9uIGdldEFuZ3VsYXJUYWcoYXR0cmlidXRlczogc3RyaW5nW10pIHtcbiAgICByZXR1cm4gYDxhZy1jaGFydHMtYW5ndWxhclxuICAgICAgICBzdHlsZT1cImhlaWdodDogMTAwJTtcIlxuICAgICAgICAke2F0dHJpYnV0ZXMuam9pbihgXG4gICAgICAgIGApfVxuICAgID48L2FnLWNoYXJ0cy1hbmd1bGFyPmA7XG59XG5cbmZ1bmN0aW9uIGdldFRlbXBsYXRlKGJpbmRpbmdzOiBhbnksIGF0dHJpYnV0ZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgICBjb25zdCBhZ0NoYXJ0VGFnID0gZ2V0QW5ndWxhclRhZyhhdHRyaWJ1dGVzKTtcblxuICAgIGxldCB0ZW1wbGF0ZSA9IGJpbmRpbmdzLnRlbXBsYXRlID8/IGFnQ2hhcnRUYWc7XG4gICAgT2JqZWN0LnZhbHVlcyhiaW5kaW5ncy5wbGFjZWhvbGRlcnMpLmZvckVhY2goKHBsYWNlaG9sZGVyKSA9PiB7XG4gICAgICAgIHRlbXBsYXRlID0gdGVtcGxhdGUucmVwbGFjZShwbGFjZWhvbGRlciwgYWdDaGFydFRhZyk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gY29udmVydFRlbXBsYXRlKHRlbXBsYXRlKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHZhbmlsbGFUb0FuZ3VsYXIoYmluZGluZ3M6IGFueSwgY29tcG9uZW50RmlsZU5hbWVzOiBzdHJpbmdbXSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgeyBwcm9wZXJ0aWVzLCBkZWNsYXJhdGlvbnMsIG9wdGlvbnNUeXBlSW5mbyB9ID0gYmluZGluZ3M7XG4gICAgY29uc3Qgb3BzVHlwZUluZm8gPSBvcHRpb25zVHlwZUluZm87XG4gICAgY29uc3QgaW1wb3J0cyA9IGdldEltcG9ydHMoYmluZGluZ3MsIGNvbXBvbmVudEZpbGVOYW1lcywgb3BzVHlwZUluZm8pO1xuICAgIGNvbnN0IHBsYWNlaG9sZGVycyA9IE9iamVjdC5rZXlzKGJpbmRpbmdzLnBsYWNlaG9sZGVycyk7XG5cbiAgICBsZXQgaW5kZXhGaWxlOiBzdHJpbmc7XG5cbiAgICBpZiAocGxhY2Vob2xkZXJzLmxlbmd0aCA8PSAxKSB7XG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSBwcm9wZXJ0aWVzLmZpbmQoKHApID0+IHAubmFtZSA9PT0gJ29wdGlvbnMnKTtcbiAgICAgICAgY29uc3QgeyBwcm9wZXJ0eUF0dHJpYnV0ZXMsIHByb3BlcnR5QXNzaWdubWVudHMsIHByb3BlcnR5VmFycyB9ID0gZ2V0Q29tcG9uZW50TWV0YWRhdGEoYmluZGluZ3MsIG9wdGlvbnMpO1xuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IGdldFRlbXBsYXRlKGJpbmRpbmdzLCBwcm9wZXJ0eUF0dHJpYnV0ZXMpO1xuXG4gICAgICAgIGNvbnN0IGluc3RhbmNlTWV0aG9kcyA9IGJpbmRpbmdzLmluc3RhbmNlTWV0aG9kcy5tYXAocHJvY2Vzc0Z1bmN0aW9uKTtcbiAgICAgICAgY29uc3QgZXh0ZXJuYWxFdmVudEhhbmRsZXJzID0gYmluZGluZ3MuZXh0ZXJuYWxFdmVudEhhbmRsZXJzLm1hcCgoaGFuZGxlcikgPT4gcHJvY2Vzc0Z1bmN0aW9uKGhhbmRsZXIuYm9keSkpO1xuXG4gICAgICAgIGluZGV4RmlsZSA9IGAke2ltcG9ydHMuam9pbignXFxuJyl9JHtkZWNsYXJhdGlvbnMubGVuZ3RoID4gMCA/ICdcXG4nICsgZGVjbGFyYXRpb25zLmpvaW4oJ1xcbicpIDogJyd9XG5cbiAgICAgICAgJHtiaW5kaW5ncy5nbG9iYWxzLmpvaW4oJ1xcbicpfVxuXG4gICAgICAgIEBDb21wb25lbnQoe1xuICAgICAgICAgICAgc2VsZWN0b3I6ICdteS1hcHAnLFxuICAgICAgICAgICAgc3RhbmRhbG9uZTogdHJ1ZSxcbiAgICAgICAgICAgIGltcG9ydHM6IFtBZ0NoYXJ0c0FuZ3VsYXJdLFxuICAgICAgICAgICAgdGVtcGxhdGU6IFxcYCR7dGVtcGxhdGV9XFxgXG4gICAgICAgIH0pXG4gICAgICAgIGV4cG9ydCBjbGFzcyBBcHBDb21wb25lbnQge1xuICAgICAgICAgICAgJHtwcm9wZXJ0eVZhcnMuam9pbihgXG4gICAgICAgICAgICBgKX1cblxuICAgICAgICAgICAgJHtcbiAgICAgICAgICAgICAgICBiaW5kaW5ncy51c2VzQ2hhcnRBcGlcbiAgICAgICAgICAgICAgICAgICAgPyBgXFxuICAgIEBWaWV3Q2hpbGQoQWdDaGFydHNBbmd1bGFyKVxuICAgICAgICAgICAgcHVibGljIGFnQ2hhcnRzITogQWdDaGFydHNBbmd1bGFyO1xcbmBcbiAgICAgICAgICAgICAgICAgICAgOiAnJ1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgICAgICAgICAgJHtwcm9wZXJ0eUFzc2lnbm1lbnRzLmpvaW4oJztcXG4nKX1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgJHtcbiAgICAgICAgICAgICAgICBiaW5kaW5ncy5pbml0Lmxlbmd0aCAhPT0gMFxuICAgICAgICAgICAgICAgICAgICA/IGBcbiAgICAgICAgICAgIG5nT25Jbml0KCkge1xuICAgICAgICAgICAgICAgICR7YmluZGluZ3MuaW5pdC5qb2luKCc7XFxuICAgICcpfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYFxuICAgICAgICAgICAgICAgICAgICA6ICcnXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICR7aW5zdGFuY2VNZXRob2RzXG4gICAgICAgICAgICAgICAgLmNvbmNhdChleHRlcm5hbEV2ZW50SGFuZGxlcnMpXG4gICAgICAgICAgICAgICAgLm1hcCgoc25pcHBldCkgPT4gc25pcHBldC50cmltKCkpXG4gICAgICAgICAgICAgICAgLmpvaW4oJ1xcblxcbicpfVxuICAgICAgICB9XG4gICAgICAgIGA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgY29tcG9uZW50czogQXJyYXk8eyBzZWxlY3Rvcjogc3RyaW5nOyBjbGFzc05hbWU6IHN0cmluZyB9PiA9IFtdO1xuXG4gICAgICAgIGxldCB0ZW1wbGF0ZSA9IGJpbmRpbmdzLnRlbXBsYXRlLnRyaW0oKTtcbiAgICAgICAgT2JqZWN0LmVudHJpZXMoYmluZGluZ3MucGxhY2Vob2xkZXJzKS5mb3JFYWNoKChbaWQsIHBsYWNlaG9sZGVyXSkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc2VsZWN0b3IgPSB0b0tlYmFiQ2FzZShpZCk7XG4gICAgICAgICAgICBjb25zdCB7IHN0eWxlIH0gPSBiaW5kaW5ncy5jaGFydEF0dHJpYnV0ZXNbaWRdO1xuICAgICAgICAgICAgdGVtcGxhdGUgPSB0ZW1wbGF0ZS5yZXBsYWNlKHBsYWNlaG9sZGVyLCBgPCR7c2VsZWN0b3J9IHN0eWxlPVwiJHtzdHlsZX1cIj48LyR7c2VsZWN0b3J9PmApO1xuICAgICAgICB9KTtcblxuICAgICAgICBpbmRleEZpbGUgPSBgJHtpbXBvcnRzLmpvaW4oJ1xcbicpfSR7ZGVjbGFyYXRpb25zLmxlbmd0aCA+IDAgPyAnXFxuJyArIGRlY2xhcmF0aW9ucy5qb2luKCdcXG4nKSA6ICcnfVxuXG4gICAgICAgICR7YmluZGluZ3MuZ2xvYmFscy5qb2luKCdcXG4nKX1cbiAgICAgICAgYDtcblxuICAgICAgICBwbGFjZWhvbGRlcnMuZm9yRWFjaCgoaWQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNlbGVjdG9yID0gdG9LZWJhYkNhc2UoaWQpO1xuICAgICAgICAgICAgY29uc3QgY2xhc3NOYW1lID0gdG9UaXRsZUNhc2UoaWQpO1xuXG4gICAgICAgICAgICBjb25zdCBwcm9wZXJ0eU5hbWUgPSBiaW5kaW5ncy5jaGFydFByb3BlcnRpZXNbaWRdO1xuICAgICAgICAgICAgY29uc3QgeyBwcm9wZXJ0eUF0dHJpYnV0ZXMsIHByb3BlcnR5QXNzaWdubWVudHMsIHByb3BlcnR5VmFycyB9ID0gZ2V0Q29tcG9uZW50TWV0YWRhdGEoXG4gICAgICAgICAgICAgICAgYmluZGluZ3MsXG4gICAgICAgICAgICAgICAgcHJvcGVydGllcy5maW5kKChwKSA9PiBwLm5hbWUgPT09IHByb3BlcnR5TmFtZSlcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlID0gZ2V0QW5ndWxhclRhZyhwcm9wZXJ0eUF0dHJpYnV0ZXMpO1xuXG4gICAgICAgICAgICBpbmRleEZpbGUgPSBgJHtpbmRleEZpbGV9XG5cbiAgICAgICAgICAgIEBDb21wb25lbnQoe1xuICAgICAgICAgICAgICAgIHNlbGVjdG9yOiAnJHtzZWxlY3Rvcn0nLFxuICAgICAgICAgICAgICAgIHN0YW5kYWxvbmU6IHRydWUsXG4gICAgICAgICAgICAgICAgaW1wb3J0czogW0FnQ2hhcnRzQW5ndWxhcl0sXG4gICAgICAgICAgICAgICAgdGVtcGxhdGU6IFxcYCR7dGVtcGxhdGV9XFxgXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgY2xhc3MgJHtjbGFzc05hbWV9IHtcbiAgICAgICAgICAgICAgICAke3Byb3BlcnR5VmFycy5qb2luKGBcbiAgICAgICAgICAgICAgICBgKX1cblxuICAgICAgICAgICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgICAgICAgICAke3Byb3BlcnR5QXNzaWdubWVudHMuam9pbignO1xcbicpfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1gO1xuXG4gICAgICAgICAgICBjb21wb25lbnRzLnB1c2goeyBzZWxlY3RvciwgY2xhc3NOYW1lIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpbmRleEZpbGUgPSBgJHtpbmRleEZpbGV9XG5cbiAgICAgICAgQENvbXBvbmVudCh7XG4gICAgICAgICAgICBzZWxlY3RvcjogJ215LWFwcCcsXG4gICAgICAgICAgICBzdGFuZGFsb25lOiB0cnVlLFxuICAgICAgICAgICAgaW1wb3J0czogWyR7Y29tcG9uZW50cy5tYXAoKGMpID0+IGMuY2xhc3NOYW1lKS5qb2luKCcsICcpfV0sXG4gICAgICAgICAgICB0ZW1wbGF0ZTogXFxgJHt0ZW1wbGF0ZX1cXGBcbiAgICAgICAgfSlcbiAgICAgICAgZXhwb3J0IGNsYXNzIEFwcENvbXBvbmVudCB7XG4gICAgICAgIH1cbiAgICAgICAgYDtcbiAgICB9XG5cbiAgICBpZiAoYmluZGluZ3MudXNlc0NoYXJ0QXBpKSB7XG4gICAgICAgIGluZGV4RmlsZSA9IGluZGV4RmlsZS5yZXBsYWNlKC9BZ0NoYXJ0cy4oXFx3KilcXCgoXFx3KikoLHxcXCkpL2csICdBZ0NoYXJ0cy4kMSh0aGlzLmFnQ2hhcnRzLmNoYXJ0ISQzJyk7XG4gICAgICAgIGluZGV4RmlsZSA9IGluZGV4RmlsZS5yZXBsYWNlKC9cXCh0aGlzLmFnQ2hhcnRzLmNoYXJ0ISwgb3B0aW9ucy9nLCAnKHRoaXMuYWdDaGFydHMuY2hhcnQhLCB0aGlzLm9wdGlvbnMnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaW5kZXhGaWxlO1xufVxuIl0sIm5hbWVzIjpbInByb2Nlc3NGdW5jdGlvbiIsInZhbmlsbGFUb0FuZ3VsYXIiLCJjb2RlIiwid3JhcE9wdGlvbnNVcGRhdGVDb2RlIiwiY29udmVydEZ1bmN0aW9uVG9Qcm9wZXJ0eSIsImdldEltcG9ydHMiLCJiaW5kaW5ncyIsImNvbXBvbmVudEZpbGVOYW1lcyIsInR5cGVQYXJ0cyIsImltcG9ydHMiLCJiSW1wb3J0cyIsImNoYXJ0U2V0dGluZ3MiLCJlbnRlcnByaXNlIiwicHVzaCIsIm1vZHVsZSIsImlzTmFtZXNwYWNlZCIsInVzZXNDaGFydEFwaSIsImFkZEJpbmRpbmdJbXBvcnRzIiwibWFwIiwiZ2V0SW1wb3J0IiwiZ2V0Q29tcG9uZW50TWV0YWRhdGEiLCJwcm9wZXJ0eSIsInByb3BlcnR5QXR0cmlidXRlcyIsInByb3BlcnR5VmFycyIsInByb3BlcnR5QXNzaWdubWVudHMiLCJpc0luc3RhbmNlTWV0aG9kIiwiaW5zdGFuY2VNZXRob2RzIiwibmFtZSIsInZhbHVlIiwiZ2V0QW5ndWxhclRhZyIsImF0dHJpYnV0ZXMiLCJqb2luIiwiZ2V0VGVtcGxhdGUiLCJhZ0NoYXJ0VGFnIiwidGVtcGxhdGUiLCJPYmplY3QiLCJ2YWx1ZXMiLCJwbGFjZWhvbGRlcnMiLCJmb3JFYWNoIiwicGxhY2Vob2xkZXIiLCJyZXBsYWNlIiwiY29udmVydFRlbXBsYXRlIiwicHJvcGVydGllcyIsImRlY2xhcmF0aW9ucyIsIm9wdGlvbnNUeXBlSW5mbyIsIm9wc1R5cGVJbmZvIiwia2V5cyIsImluZGV4RmlsZSIsImxlbmd0aCIsIm9wdGlvbnMiLCJmaW5kIiwicCIsImV4dGVybmFsRXZlbnRIYW5kbGVycyIsImhhbmRsZXIiLCJib2R5IiwiZ2xvYmFscyIsImluaXQiLCJjb25jYXQiLCJzbmlwcGV0IiwidHJpbSIsImNvbXBvbmVudHMiLCJlbnRyaWVzIiwiaWQiLCJzZWxlY3RvciIsInRvS2ViYWJDYXNlIiwic3R5bGUiLCJjaGFydEF0dHJpYnV0ZXMiLCJjbGFzc05hbWUiLCJ0b1RpdGxlQ2FzZSIsInByb3BlcnR5TmFtZSIsImNoYXJ0UHJvcGVydGllcyIsImMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0lBS2dCQSxlQUFlO2VBQWZBOztJQTZETUMsZ0JBQWdCO2VBQWhCQTs7OzhCQWxFcUI7NEJBQ0w7NkJBQ3lDOzZCQUN0QztBQUVsQyxTQUFTRCxnQkFBZ0JFLElBQVk7SUFDeEMsT0FBT0MsSUFBQUEsaUNBQXFCLEVBQUNDLElBQUFBLHNDQUF5QixFQUFDRjtBQUMzRDtBQUVBLFNBQVNHLFdBQVdDLFFBQVEsRUFBRUMsa0JBQTRCLEVBQUUsRUFBRUMsU0FBUyxFQUFFO0lBQ3JFLE1BQU0sRUFDRkMsU0FBU0MsV0FBVyxFQUFFLEVBQ3RCQyxlQUFlLEVBQUVDLGFBQWEsS0FBSyxFQUFFLEVBQ3hDLEdBQUdOO0lBRUpJLFNBQVNHLElBQUksQ0FBQztRQUNWQyxRQUFRRixhQUFhLENBQUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDO1FBQ3ZFRyxjQUFjO1FBQ2ROLFNBQVNEO0lBQ2I7SUFFQSxNQUFNQyxVQUFVO1FBQUMsQ0FBQyxrQkFBa0IsRUFBRUgsU0FBU1UsWUFBWSxHQUFHLGdCQUFn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