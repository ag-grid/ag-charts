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
    vanillaToReactFunctional: function() {
        return vanillaToReactFunctional;
    }
});
const _chartutils = require("./chart-utils");
const _parserutils = require("./parser-utils");
const _reactutils = require("./react-utils");
const _stringutils = require("./string-utils");
function processFunction(code) {
    return (0, _chartutils.wrapOptionsUpdateCode)((0, _parserutils.convertFunctionToProperty)(code), 'const clone = deepClone(options);', 'setOptions(clone);', 'clone');
}
function getImports(componentFilenames, bindings) {
    const reactImports = [
        'Fragment',
        'useState'
    ];
    if (bindings.usesChartApi) reactImports.push('useRef');
    const imports = [
        `import React, { ${reactImports.join(', ')} } from 'react';`,
        `import { createRoot } from 'react-dom/client';`,
        `import { AgChartsReact } from 'ag-charts-react';`
    ];
    const chartImport = (0, _chartutils.getChartImports)(bindings.imports, bindings.usesChartApi);
    if (chartImport) {
        imports.push(chartImport);
    }
    if (bindings.chartSettings.enterprise) {
        imports.push(`import 'ag-charts-enterprise';`);
    }
    imports.push(`import deepClone from 'deepclone';`);
    if (componentFilenames) {
        imports.push(...componentFilenames.map(_reactutils.getImport));
    }
    return imports;
}
function getAgChartTag(bindings, componentAttributes) {
    return `<AgChartsReact
        ${bindings.usesChartApi ? 'ref={chartRef}' : ''}
        ${componentAttributes.join(`
        `)}
    />`;
}
function getTemplate(bindings, componentAttributes) {
    const agChartTag = getAgChartTag(bindings, componentAttributes);
    var _bindings_template;
    let template = (_bindings_template = bindings.template) != null ? _bindings_template : agChartTag;
    Object.values(bindings.placeholders).forEach((placeholder)=>{
        template = template.replace(placeholder, agChartTag);
    });
    return (0, _reactutils.convertFunctionalTemplate)(template);
}
function getComponentMetadata(property) {
    const stateProperties = [];
    const componentAttributes = [];
    stateProperties.push(`const [${property.name}, set${(0, _stringutils.toTitleCase)(property.name)}] = useState(${property.value});`);
    componentAttributes.push(`options={${property.name}}`);
    return {
        stateProperties,
        componentAttributes
    };
}
async function vanillaToReactFunctional(bindings, componentFilenames) {
    const { properties } = bindings;
    const imports = getImports(componentFilenames, bindings);
    const placeholders = Object.keys(bindings.placeholders);
    let indexFile;
    if (placeholders.length <= 1) {
        const { stateProperties, componentAttributes } = getComponentMetadata(properties.find((p)=>p.name === 'options'));
        const template = getTemplate(bindings, componentAttributes);
        const externalEventHandlers = bindings.externalEventHandlers.map((handler)=>processFunction((0, _reactutils.convertFunctionToCallback)(handler.body)));
        const instanceMethods = bindings.instanceMethods.map((m)=>processFunction((0, _reactutils.convertFunctionToCallback)(m)));
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
        const components = new Map();
        indexFile = `
            ${imports.join(`
            `)}

            ${bindings.globals.join(`
            `)}
        `;
        placeholders.forEach((id)=>{
            const componentName = (0, _stringutils.toTitleCase)(id);
            const propertyName = bindings.chartProperties[id];
            const { stateProperties, componentAttributes } = getComponentMetadata(properties.find((p)=>p.name === propertyName));
            Object.entries(bindings.chartAttributes[id]).forEach(([key, value])=>{
                if (key === 'style') {
                    componentAttributes.push(`containerStyle={${JSON.stringify((0, _reactutils.styleAsObject)(value))}}`);
                } else {
                    throw new Error(`Unknown chart attribute: ${key}`);
                }
            });
            indexFile = `${indexFile}

            const ${componentName} = () => {
                ${stateProperties.join(`;
                `)}

                return ${getAgChartTag(bindings, componentAttributes)};
            }`;
            components.set(id, `<${componentName} />`);
        });
        let wrapper = (0, _reactutils.convertFunctionalTemplate)(bindings.template);
        Object.entries(bindings.placeholders).forEach(([id, template])=>{
            wrapper = wrapper.replace(template, components.get(id));
        });
        if (!bindings.template.includes('</')) {
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
        indexFile = indexFile.replace(/AgCharts.(\w*)\((\w*)(,|\))/g, 'AgCharts.$1(chartRef.current.chart$3');
        indexFile = indexFile.replace(/\(this.chartRef.current.chart, options/g, '(chartRef.current.chart, options');
    }
    return indexFile;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL3RyYW5zZm9ybWF0aW9uLXNjcmlwdHMvY2hhcnQtdmFuaWxsYS10by1yZWFjdC1mdW5jdGlvbmFsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGdldENoYXJ0SW1wb3J0cywgd3JhcE9wdGlvbnNVcGRhdGVDb2RlIH0gZnJvbSAnLi9jaGFydC11dGlscyc7XG5pbXBvcnQgeyBjb252ZXJ0RnVuY3Rpb25Ub1Byb3BlcnR5IH0gZnJvbSAnLi9wYXJzZXItdXRpbHMnO1xuaW1wb3J0IHsgY29udmVydEZ1bmN0aW9uVG9DYWxsYmFjaywgY29udmVydEZ1bmN0aW9uYWxUZW1wbGF0ZSwgZ2V0SW1wb3J0LCBzdHlsZUFzT2JqZWN0IH0gZnJvbSAnLi9yZWFjdC11dGlscyc7XG5pbXBvcnQgeyB0b1RpdGxlQ2FzZSB9IGZyb20gJy4vc3RyaW5nLXV0aWxzJztcblxuZXhwb3J0IGZ1bmN0aW9uIHByb2Nlc3NGdW5jdGlvbihjb2RlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiB3cmFwT3B0aW9uc1VwZGF0ZUNvZGUoXG4gICAgICAgIGNvbnZlcnRGdW5jdGlvblRvUHJvcGVydHkoY29kZSksXG4gICAgICAgICdjb25zdCBjbG9uZSA9IGRlZXBDbG9uZShvcHRpb25zKTsnLFxuICAgICAgICAnc2V0T3B0aW9ucyhjbG9uZSk7JyxcbiAgICAgICAgJ2Nsb25lJ1xuICAgICk7XG59XG5cbmZ1bmN0aW9uIGdldEltcG9ydHMoY29tcG9uZW50RmlsZW5hbWVzOiBzdHJpbmdbXSwgYmluZGluZ3MpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgcmVhY3RJbXBvcnRzID0gWydGcmFnbWVudCcsICd1c2VTdGF0ZSddO1xuICAgIGlmIChiaW5kaW5ncy51c2VzQ2hhcnRBcGkpIHJlYWN0SW1wb3J0cy5wdXNoKCd1c2VSZWYnKTtcblxuICAgIGNvbnN0IGltcG9ydHMgPSBbXG4gICAgICAgIGBpbXBvcnQgUmVhY3QsIHsgJHtyZWFjdEltcG9ydHMuam9pbignLCAnKX0gfSBmcm9tICdyZWFjdCc7YCxcbiAgICAgICAgYGltcG9ydCB7IGNyZWF0ZVJvb3QgfSBmcm9tICdyZWFjdC1kb20vY2xpZW50JztgLFxuICAgICAgICBgaW1wb3J0IHsgQWdDaGFydHNSZWFjdCB9IGZyb20gJ2FnLWNoYXJ0cy1yZWFjdCc7YCxcbiAgICBdO1xuXG4gICAgY29uc3QgY2hhcnRJbXBvcnQgPSBnZXRDaGFydEltcG9ydHMoYmluZGluZ3MuaW1wb3J0cywgYmluZGluZ3MudXNlc0NoYXJ0QXBpKTtcbiAgICBpZiAoY2hhcnRJbXBvcnQpIHtcbiAgICAgICAgaW1wb3J0cy5wdXNoKGNoYXJ0SW1wb3J0KTtcbiAgICB9XG5cbiAgICBpZiAoYmluZGluZ3MuY2hhcnRTZXR0aW5ncy5lbnRlcnByaXNlKSB7XG4gICAgICAgIGltcG9ydHMucHVzaChgaW1wb3J0ICdhZy1jaGFydHMtZW50ZXJwcmlzZSc7YCk7XG4gICAgfVxuXG4gICAgaW1wb3J0cy5wdXNoKGBpbXBvcnQgZGVlcENsb25lIGZyb20gJ2RlZXBjbG9uZSc7YCk7XG5cbiAgICBpZiAoY29tcG9uZW50RmlsZW5hbWVzKSB7XG4gICAgICAgIGltcG9ydHMucHVzaCguLi5jb21wb25lbnRGaWxlbmFtZXMubWFwKGdldEltcG9ydCkpO1xuICAgIH1cblxuICAgIHJldHVybiBpbXBvcnRzO1xufVxuXG5mdW5jdGlvbiBnZXRBZ0NoYXJ0VGFnKGJpbmRpbmdzOiBhbnksIGNvbXBvbmVudEF0dHJpYnV0ZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYDxBZ0NoYXJ0c1JlYWN0XG4gICAgICAgICR7YmluZGluZ3MudXNlc0NoYXJ0QXBpID8gJ3JlZj17Y2hhcnRSZWZ9JyA6ICcnfVxuICAgICAgICAke2NvbXBvbmVudEF0dHJpYnV0ZXMuam9pbihgXG4gICAgICAgIGApfVxuICAgIC8+YDtcbn1cblxuZnVuY3Rpb24gZ2V0VGVtcGxhdGUoYmluZGluZ3M6IGFueSwgY29tcG9uZW50QXR0cmlidXRlczogc3RyaW5nW10pOiBzdHJpbmcge1xuICAgIGNvbnN0IGFnQ2hhcnRUYWcgPSBnZXRBZ0NoYXJ0VGFnKGJpbmRpbmdzLCBjb21wb25lbnRBdHRyaWJ1dGVzKTtcblxuICAgIGxldCB0ZW1wbGF0ZTogc3RyaW5nID0gYmluZGluZ3MudGVtcGxhdGUgPz8gYWdDaGFydFRhZztcbiAgICBPYmplY3QudmFsdWVzKGJpbmRpbmdzLnBsYWNlaG9sZGVycykuZm9yRWFjaCgocGxhY2Vob2xkZXI6IHN0cmluZykgPT4ge1xuICAgICAgICB0ZW1wbGF0ZSA9IHRlbXBsYXRlLnJlcGxhY2UocGxhY2Vob2xkZXIsIGFnQ2hhcnRUYWcpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGNvbnZlcnRGdW5jdGlvbmFsVGVtcGxhdGUodGVtcGxhdGUpO1xufVxuXG5mdW5jdGlvbiBnZXRDb21wb25lbnRNZXRhZGF0YShwcm9wZXJ0eTogYW55KSB7XG4gICAgY29uc3Qgc3RhdGVQcm9wZXJ0aWVzID0gW107XG4gICAgY29uc3QgY29tcG9uZW50QXR0cmlidXRlcyA9IFtdO1xuXG4gICAgc3RhdGVQcm9wZXJ0aWVzLnB1c2goYGNvbnN0IFske3Byb3BlcnR5Lm5hbWV9LCBzZXQke3RvVGl0bGVDYXNlKHByb3BlcnR5Lm5hbWUpfV0gPSB1c2VTdGF0ZSgke3Byb3BlcnR5LnZhbHVlfSk7YCk7XG4gICAgY29tcG9uZW50QXR0cmlidXRlcy5wdXNoKGBvcHRpb25zPXske3Byb3BlcnR5Lm5hbWV9fWApO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdGVQcm9wZXJ0aWVzLFxuICAgICAgICBjb21wb25lbnRBdHRyaWJ1dGVzLFxuICAgIH07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB2YW5pbGxhVG9SZWFjdEZ1bmN0aW9uYWwoYmluZGluZ3M6IGFueSwgY29tcG9uZW50RmlsZW5hbWVzOiBzdHJpbmdbXSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgeyBwcm9wZXJ0aWVzIH0gPSBiaW5kaW5ncztcbiAgICBjb25zdCBpbXBvcnRzID0gZ2V0SW1wb3J0cyhjb21wb25lbnRGaWxlbmFtZXMsIGJpbmRpbmdzKTtcbiAgICBjb25zdCBwbGFjZWhvbGRlcnMgPSBPYmplY3Qua2V5cyhiaW5kaW5ncy5wbGFjZWhvbGRlcnMpO1xuXG4gICAgbGV0IGluZGV4RmlsZTogc3RyaW5nO1xuXG4gICAgaWYgKHBsYWNlaG9sZGVycy5sZW5ndGggPD0gMSkge1xuICAgICAgICBjb25zdCB7IHN0YXRlUHJvcGVydGllcywgY29tcG9uZW50QXR0cmlidXRlcyB9ID0gZ2V0Q29tcG9uZW50TWV0YWRhdGEoXG4gICAgICAgICAgICBwcm9wZXJ0aWVzLmZpbmQoKHApID0+IHAubmFtZSA9PT0gJ29wdGlvbnMnKVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gZ2V0VGVtcGxhdGUoYmluZGluZ3MsIGNvbXBvbmVudEF0dHJpYnV0ZXMpO1xuXG4gICAgICAgIGNvbnN0IGV4dGVybmFsRXZlbnRIYW5kbGVycyA9IGJpbmRpbmdzLmV4dGVybmFsRXZlbnRIYW5kbGVycy5tYXAoKGhhbmRsZXIpID0+XG4gICAgICAgICAgICBwcm9jZXNzRnVuY3Rpb24oY29udmVydEZ1bmN0aW9uVG9DYWxsYmFjayhoYW5kbGVyLmJvZHkpKVxuICAgICAgICApO1xuICAgICAgICBjb25zdCBpbnN0YW5jZU1ldGhvZHMgPSBiaW5kaW5ncy5pbnN0YW5jZU1ldGhvZHMubWFwKChtKSA9PiBwcm9jZXNzRnVuY3Rpb24oY29udmVydEZ1bmN0aW9uVG9DYWxsYmFjayhtKSkpO1xuXG4gICAgICAgIGluZGV4RmlsZSA9IGBcbiAgICAgICAgICAgICR7aW1wb3J0cy5qb2luKGBcbiAgICAgICAgICAgIGApfVxuXG4gICAgICAgICAgICAke2JpbmRpbmdzLmdsb2JhbHMuam9pbihgXG4gICAgICAgICAgICBgKX1cblxuICAgICAgICAgICAgY29uc3QgQ2hhcnRFeGFtcGxlID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICR7YmluZGluZ3MudXNlc0NoYXJ0QXBpID8gYGNvbnN0IGNoYXJ0UmVmID0gdXNlUmVmKG51bGwpO2AgOiAnJ31cbiAgICAgICAgICAgICAgICAke3N0YXRlUHJvcGVydGllcy5qb2luKCcsXFxuICAgICAgICAgICAgJyl9XG5cbiAgICAgICAgICAgICAgICAke2luc3RhbmNlTWV0aG9kcy5jb25jYXQoZXh0ZXJuYWxFdmVudEhhbmRsZXJzKS5qb2luKCdcXG5cXG4gICAgJyl9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gJHt0ZW1wbGF0ZX07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHJvb3QgPSBjcmVhdGVSb290KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb290JykpO1xuICAgICAgICAgICAgcm9vdC5yZW5kZXIoPENoYXJ0RXhhbXBsZSAvPik7XG4gICAgICAgICAgICBgO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudHMgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICAgICAgICBpbmRleEZpbGUgPSBgXG4gICAgICAgICAgICAke2ltcG9ydHMuam9pbihgXG4gICAgICAgICAgICBgKX1cblxuICAgICAgICAgICAgJHtiaW5kaW5ncy5nbG9iYWxzLmpvaW4oYFxuICAgICAgICAgICAgYCl9XG4gICAgICAgIGA7XG5cbiAgICAgICAgcGxhY2Vob2xkZXJzLmZvckVhY2goKGlkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnROYW1lID0gdG9UaXRsZUNhc2UoaWQpO1xuXG4gICAgICAgICAgICBjb25zdCBwcm9wZXJ0eU5hbWUgPSBiaW5kaW5ncy5jaGFydFByb3BlcnRpZXNbaWRdO1xuICAgICAgICAgICAgY29uc3QgeyBzdGF0ZVByb3BlcnRpZXMsIGNvbXBvbmVudEF0dHJpYnV0ZXMgfSA9IGdldENvbXBvbmVudE1ldGFkYXRhKFxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXMuZmluZCgocCkgPT4gcC5uYW1lID09PSBwcm9wZXJ0eU5hbWUpXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBPYmplY3QuZW50cmllcyhiaW5kaW5ncy5jaGFydEF0dHJpYnV0ZXNbaWRdKS5mb3JFYWNoKChba2V5LCB2YWx1ZV0pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSAnc3R5bGUnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudEF0dHJpYnV0ZXMucHVzaChgY29udGFpbmVyU3R5bGU9eyR7SlNPTi5zdHJpbmdpZnkoc3R5bGVBc09iamVjdCh2YWx1ZSBhcyBhbnkpKX19YCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGNoYXJ0IGF0dHJpYnV0ZTogJHtrZXl9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGluZGV4RmlsZSA9IGAke2luZGV4RmlsZX1cblxuICAgICAgICAgICAgY29uc3QgJHtjb21wb25lbnROYW1lfSA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAke3N0YXRlUHJvcGVydGllcy5qb2luKGA7XG4gICAgICAgICAgICAgICAgYCl9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gJHtnZXRBZ0NoYXJ0VGFnKGJpbmRpbmdzLCBjb21wb25lbnRBdHRyaWJ1dGVzKX07XG4gICAgICAgICAgICB9YDtcblxuICAgICAgICAgICAgY29tcG9uZW50cy5zZXQoaWQsIGA8JHtjb21wb25lbnROYW1lfSAvPmApO1xuICAgICAgICB9KTtcblxuICAgICAgICBsZXQgd3JhcHBlciA9IGNvbnZlcnRGdW5jdGlvbmFsVGVtcGxhdGUoYmluZGluZ3MudGVtcGxhdGUpO1xuICAgICAgICBPYmplY3QuZW50cmllcyhiaW5kaW5ncy5wbGFjZWhvbGRlcnMpLmZvckVhY2goKFtpZCwgdGVtcGxhdGVdOiBbc3RyaW5nLCBzdHJpbmddKSA9PiB7XG4gICAgICAgICAgICB3cmFwcGVyID0gd3JhcHBlci5yZXBsYWNlKHRlbXBsYXRlLCBjb21wb25lbnRzLmdldChpZCkhKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKCFiaW5kaW5ncy50ZW1wbGF0ZS5pbmNsdWRlcygnPC8nKSkge1xuICAgICAgICAgICAgd3JhcHBlciA9IGA8RnJhZ21lbnQ+XG4gICAgICAgICAgICAgICAgJHt3cmFwcGVyfVxuICAgICAgICAgICAgPC9GcmFnbWVudD5gO1xuICAgICAgICB9XG5cbiAgICAgICAgaW5kZXhGaWxlID0gYCR7aW5kZXhGaWxlfVxuXG4gICAgICAgIGNvbnN0IHJvb3QgPSBjcmVhdGVSb290KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb290JykpO1xuICAgICAgICByb290LnJlbmRlcihcbiAgICAgICAgICAgICR7d3JhcHBlcn1cbiAgICAgICAgKTtcbiAgICAgICAgYDtcbiAgICB9XG5cbiAgICBpZiAoYmluZGluZ3MudXNlc0NoYXJ0QXBpKSB7XG4gICAgICAgIGluZGV4RmlsZSA9IGluZGV4RmlsZS5yZXBsYWNlKC9BZ0NoYXJ0cy4oXFx3KilcXCgoXFx3KikoLHxcXCkpL2csICdBZ0NoYXJ0cy4kMShjaGFydFJlZi5jdXJyZW50LmNoYXJ0JDMnKTtcbiAgICAgICAgaW5kZXhGaWxlID0gaW5kZXhGaWxlLnJlcGxhY2UoL1xcKHRoaXMuY2hhcnRSZWYuY3VycmVudC5jaGFydCwgb3B0aW9ucy9nLCAnKGNoYXJ0UmVmLmN1cnJlbnQuY2hhcnQsIG9wdGlvbnMnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaW5kZXhGaWxlO1xufVxuIl0sIm5hbWVzIjpbInByb2Nlc3NGdW5jdGlvbiIsInZhbmlsbGFUb1JlYWN0RnVuY3Rpb25hbCIsImNvZGUiLCJ3cmFwT3B0aW9uc1VwZGF0ZUNvZGUiLCJjb252ZXJ0RnVuY3Rpb25Ub1Byb3BlcnR5IiwiZ2V0SW1wb3J0cyIsImNvbXBvbmVudEZpbGVuYW1lcyIsImJpbmRpbmdzIiwicmVhY3RJbXBvcnRzIiwidXNlc0NoYXJ0QXBpIiwicHVzaCIsImltcG9ydHMiLCJqb2luIiwiY2hhcnRJbXBvcnQiLCJnZXRDaGFydEltcG9ydHMiLCJjaGFydFNldHRpbmdzIiwiZW50ZXJwcmlzZSIsIm1hcCIsImdldEltcG9ydCIsImdldEFnQ2hhcnRUYWciLCJjb21wb25lbnRBdHRyaWJ1dGVzIiwiZ2V0VGVtcGxhdGUiLCJhZ0NoYXJ0VGFnIiwidGVtcGxhdGUiLCJPYmplY3QiLCJ2YWx1ZXMiLCJwbGFjZWhvbGRlcnMiLCJmb3JFYWNoIiwicGxhY2Vob2xkZXIiLCJyZXBsYWNlIiwiY29udmVydEZ1bmN0aW9uYWxUZW1wbGF0ZSIsImdldENvbXBvbmVudE1ldGFkYXRhIiwicHJvcGVydHkiLCJzdGF0ZVByb3BlcnRpZXMiLCJuYW1lIiwidG9UaXRsZUNhc2UiLCJ2YWx1ZSIsInByb3BlcnRpZXMiLCJrZXlzIiwiaW5kZXhGaWxlIiwibGVuZ3RoIiwiZmluZCIsInAiLCJleHRlcm5hbEV2ZW50SGFuZGxlcnMiLCJoYW5kbGVyIiwiY29udmVydEZ1bmN0aW9uVG9DYWxsYmFjayIsImJvZHkiLCJpbnN0YW5jZU1ldGhvZHMiLCJtIiwiZ2xvYmFscyIsImNvbmNhdCIsImNvbXBvbmVudHMiLCJNYXAiLCJpZCIsImNvbXBvbmVudE5hbWUiLCJwcm9wZXJ0eU5hbWUiLCJjaGFydFByb3BlcnRpZXMiLCJlbnRyaWVzIiwiY2hhcnRBdHRyaWJ1dGVzIiwia2V5IiwiSlNPTiIsInN0cmluZ2lmeSIsInN0eWxlQXNPYmplY3QiLCJFcnJvciIsInNldCIsIndyYXBwZXIiLCJnZXQiLCJpbmNsdWRlcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFLZ0JBLGVBQWU7ZUFBZkE7O0lBcUVNQyx3QkFBd0I7ZUFBeEJBOzs7NEJBMUVpQzs2QkFDYjs0QkFDcUQ7NkJBQ25FO0FBRXJCLFNBQVNELGdCQUFnQkUsSUFBWTtJQUN4QyxPQUFPQyxJQUFBQSxpQ0FBcUIsRUFDeEJDLElB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