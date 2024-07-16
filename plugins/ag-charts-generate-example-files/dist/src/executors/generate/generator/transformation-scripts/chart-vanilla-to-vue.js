"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "vanillaToVue", {
    enumerable: true,
    get: function() {
        return vanillaToVue;
    }
});
const _chartutils = require("./chart-utils");
const _parserutils = require("./parser-utils");
const _stringutils = require("./string-utils");
const _vueutils = require("./vue-utils");
function processFunction(code) {
    return (0, _chartutils.wrapOptionsUpdateCode)((0, _parserutils.removeFunctionKeyword)(code));
}
function getImports(componentFileNames, bindings) {
    const imports = [
        "import Vue from 'vue';",
        "import { AgChartsVue } from 'ag-charts-vue';"
    ];
    const chartImport = (0, _chartutils.getChartImports)(bindings.imports, bindings.usesChartApi);
    if (chartImport) {
        imports.push(chartImport);
    }
    if (componentFileNames) {
        imports.push(...componentFileNames.map(_vueutils.getImport));
    }
    if (bindings.chartSettings.enterprise) {
        imports.push("import 'ag-charts-enterprise';");
    }
    return imports;
}
function getPropertyBindings(bindings, property) {
    const propertyAssignments = [];
    const propertyVars = [];
    const propertyAttributes = [];
    propertyVars.push(`${property.name}: ${property.value}`);
    propertyAttributes.push(`:options="${property.name}"`);
    return {
        propertyAssignments,
        propertyVars,
        propertyAttributes
    };
}
function getVueTag(bindings, attributes) {
    return `<ag-charts-vue\n` + (bindings.usesChartApi ? `ref="agCharts"\n` : '') + attributes.join('\n') + `\n/>`;
}
function getTemplate(bindings, attributes) {
    /* prettier-ignore */ const agChartTag = getVueTag(bindings, attributes);
    var _bindings_template;
    let template = (_bindings_template = bindings.template) != null ? _bindings_template : agChartTag;
    Object.values(bindings.placeholders).forEach((placeholder)=>{
        template = template.replace(placeholder, agChartTag);
    });
    return (0, _vueutils.convertTemplate)(template);
}
function getAllMethods(bindings) {
    const externalEventHandlers = bindings.externalEventHandlers.map((event)=>processFunction(event.body));
    const instanceMethods = bindings.instanceMethods.map(processFunction);
    const globalMethods = bindings.globals.map((body)=>{
        const funcName = (0, _parserutils.getFunctionName)(body);
        if (funcName) {
            return `window.${funcName} = ${body}`;
        }
        // probably a var
        return body;
    });
    return [
        externalEventHandlers,
        instanceMethods,
        globalMethods
    ];
}
async function vanillaToVue(bindings, componentFileNames) {
    const { properties } = bindings;
    const imports = getImports(componentFileNames, bindings);
    const [externalEventHandlers, instanceMethods, globalMethods] = getAllMethods(bindings);
    const placeholders = Object.keys(bindings.placeholders);
    const methods = instanceMethods.concat(externalEventHandlers);
    let mainFile;
    if (placeholders.length <= 1) {
        const options = properties.find((p)=>p.name === 'options');
        const { propertyAssignments, propertyVars, propertyAttributes } = getPropertyBindings(bindings, options);
        let template = getTemplate(bindings, propertyAttributes);
        template = template.split('\n').map((t)=>`      ${t.trim()}`).join('\n');
        mainFile = `
            ${imports.join('\n')}

            ${globalMethods.join('\n\n')}

            const ChartExample = {
                template: \`\n    ${template}\n  \`,
                components: {
                    'ag-charts-vue': AgChartsVue
                },
                data() {
                    return {
                        ${propertyVars.join(`,
                        `)}
                    }
                },
                ${propertyAssignments.length !== 0 ? `
                created() {
                    ${propertyAssignments.join(`;
                    `)}
                },` : ''}
                ${bindings.init.length !== 0 ? `
                mounted() {
                    ${bindings.init.join(`;
                    `)}
                },` : ''}
                ${methods.length !== 0 ? `
                methods: {
                    ${methods.map((snippet)=>`${snippet.trim()},`).join(`
                    `)}
                },
                ` : ''}
            }

            new Vue({
                el: '#app',
                components: {
                    'my-component': ChartExample
                }
            });
        `;
    } else {
        const components = [];
        let template = bindings.template.trim();
        Object.entries(bindings.placeholders).forEach(([id, placeholder])=>{
            const selector = (0, _stringutils.toKebabCase)(id);
            const { style } = bindings.chartAttributes[id];
            template = template.replace(placeholder, `<${selector} style="${style}"></${selector}>`);
        });
        template = `<div style="display: grid; grid: inherit">\n${template}\n</div>`;
        mainFile = `
            ${imports.join('\n')}

            ${globalMethods.join('\n\n')}
        `;
        placeholders.forEach((id)=>{
            const selector = (0, _stringutils.toKebabCase)(id);
            const className = (0, _stringutils.toTitleCase)(id);
            const propertyName = bindings.chartProperties[id];
            const { propertyVars, propertyAttributes } = getPropertyBindings(bindings, properties.find((p)=>p.name === propertyName));
            const template = getVueTag(bindings, propertyAttributes);
            mainFile = `${mainFile}

            const ${className} = {
                template: \`\n${(0, _vueutils.indentTemplate)(template, 2, 2)}\n  \`,
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
            components.push({
                selector,
                className
            });
        });
        mainFile = `${mainFile}

        const ChartExample = {
            template: \`\n${(0, _vueutils.indentTemplate)(template, 2, 2)}\n  \`,
            components: {
                ${components.map((c)=>`'${c.selector}': ${c.className}`).join(`,
                `)}
            },
        }

        new Vue({
            el: '#app',
            components: {
                'my-component': ChartExample
            }
        });
        `;
    }
    if (bindings.usesChartApi) {
        mainFile = mainFile.replace(/AgCharts.(\w*)\((\w*)(,|\))/g, 'AgCharts.$1(this.$refs.agCharts.chart$3');
        mainFile = mainFile.replace(/\(this.\$refs.agCharts.chart, options/g, '(this.$refs.agCharts.chart, this.options');
    }
    return mainFile;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL3RyYW5zZm9ybWF0aW9uLXNjcmlwdHMvY2hhcnQtdmFuaWxsYS10by12dWUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZ2V0Q2hhcnRJbXBvcnRzLCB3cmFwT3B0aW9uc1VwZGF0ZUNvZGUgfSBmcm9tICcuL2NoYXJ0LXV0aWxzJztcbmltcG9ydCB7IGdldEZ1bmN0aW9uTmFtZSwgaXNJbnN0YW5jZU1ldGhvZCwgcmVtb3ZlRnVuY3Rpb25LZXl3b3JkIH0gZnJvbSAnLi9wYXJzZXItdXRpbHMnO1xuaW1wb3J0IHsgdG9LZWJhYkNhc2UsIHRvVGl0bGVDYXNlIH0gZnJvbSAnLi9zdHJpbmctdXRpbHMnO1xuaW1wb3J0IHsgY29udmVydFRlbXBsYXRlLCBnZXRJbXBvcnQsIGluZGVudFRlbXBsYXRlLCB0b0Fzc2lnbm1lbnQsIHRvQ29uc3QsIHRvSW5wdXQsIHRvTWVtYmVyIH0gZnJvbSAnLi92dWUtdXRpbHMnO1xuXG5mdW5jdGlvbiBwcm9jZXNzRnVuY3Rpb24oY29kZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gd3JhcE9wdGlvbnNVcGRhdGVDb2RlKHJlbW92ZUZ1bmN0aW9uS2V5d29yZChjb2RlKSk7XG59XG5cbmZ1bmN0aW9uIGdldEltcG9ydHMoY29tcG9uZW50RmlsZU5hbWVzOiBzdHJpbmdbXSwgYmluZGluZ3MpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgaW1wb3J0cyA9IFtcImltcG9ydCBWdWUgZnJvbSAndnVlJztcIiwgXCJpbXBvcnQgeyBBZ0NoYXJ0c1Z1ZSB9IGZyb20gJ2FnLWNoYXJ0cy12dWUnO1wiXTtcblxuICAgIGNvbnN0IGNoYXJ0SW1wb3J0ID0gZ2V0Q2hhcnRJbXBvcnRzKGJpbmRpbmdzLmltcG9ydHMsIGJpbmRpbmdzLnVzZXNDaGFydEFwaSk7XG4gICAgaWYgKGNoYXJ0SW1wb3J0KSB7XG4gICAgICAgIGltcG9ydHMucHVzaChjaGFydEltcG9ydCk7XG4gICAgfVxuXG4gICAgaWYgKGNvbXBvbmVudEZpbGVOYW1lcykge1xuICAgICAgICBpbXBvcnRzLnB1c2goLi4uY29tcG9uZW50RmlsZU5hbWVzLm1hcChnZXRJbXBvcnQpKTtcbiAgICB9XG5cbiAgICBpZiAoYmluZGluZ3MuY2hhcnRTZXR0aW5ncy5lbnRlcnByaXNlKSB7XG4gICAgICAgIGltcG9ydHMucHVzaChcImltcG9ydCAnYWctY2hhcnRzLWVudGVycHJpc2UnO1wiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaW1wb3J0cztcbn1cblxuZnVuY3Rpb24gZ2V0UHJvcGVydHlCaW5kaW5ncyhiaW5kaW5nczogYW55LCBwcm9wZXJ0eTogYW55KSB7XG4gICAgY29uc3QgcHJvcGVydHlBc3NpZ25tZW50cyA9IFtdO1xuICAgIGNvbnN0IHByb3BlcnR5VmFycyA9IFtdO1xuICAgIGNvbnN0IHByb3BlcnR5QXR0cmlidXRlcyA9IFtdO1xuXG4gICAgcHJvcGVydHlWYXJzLnB1c2goYCR7cHJvcGVydHkubmFtZX06ICR7cHJvcGVydHkudmFsdWV9YCk7XG4gICAgcHJvcGVydHlBdHRyaWJ1dGVzLnB1c2goYDpvcHRpb25zPVwiJHtwcm9wZXJ0eS5uYW1lfVwiYCk7XG5cbiAgICByZXR1cm4geyBwcm9wZXJ0eUFzc2lnbm1lbnRzLCBwcm9wZXJ0eVZhcnMsIHByb3BlcnR5QXR0cmlidXRlcyB9O1xufVxuXG5mdW5jdGlvbiBnZXRWdWVUYWcoYmluZGluZ3M6IGFueSwgYXR0cmlidXRlczogc3RyaW5nW10pIHtcbiAgICByZXR1cm4gYDxhZy1jaGFydHMtdnVlXFxuYCArIChiaW5kaW5ncy51c2VzQ2hhcnRBcGkgPyBgcmVmPVwiYWdDaGFydHNcIlxcbmAgOiAnJykgKyBhdHRyaWJ1dGVzLmpvaW4oJ1xcbicpICsgYFxcbi8+YDtcbn1cblxuZnVuY3Rpb24gZ2V0VGVtcGxhdGUoYmluZGluZ3M6IGFueSwgYXR0cmlidXRlczogc3RyaW5nW10pOiBzdHJpbmcge1xuICAgIC8qIHByZXR0aWVyLWlnbm9yZSAqL1xuICAgIGNvbnN0IGFnQ2hhcnRUYWcgPSBnZXRWdWVUYWcoYmluZGluZ3MsIGF0dHJpYnV0ZXMpXG5cbiAgICBsZXQgdGVtcGxhdGUgPSBiaW5kaW5ncy50ZW1wbGF0ZSA/PyBhZ0NoYXJ0VGFnO1xuICAgIE9iamVjdC52YWx1ZXMoYmluZGluZ3MucGxhY2Vob2xkZXJzKS5mb3JFYWNoKChwbGFjZWhvbGRlcikgPT4ge1xuICAgICAgICB0ZW1wbGF0ZSA9IHRlbXBsYXRlLnJlcGxhY2UocGxhY2Vob2xkZXIsIGFnQ2hhcnRUYWcpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGNvbnZlcnRUZW1wbGF0ZSh0ZW1wbGF0ZSk7XG59XG5cbmZ1bmN0aW9uIGdldEFsbE1ldGhvZHMoYmluZGluZ3M6IGFueSk6IFtzdHJpbmdbXSwgc3RyaW5nW10sIHN0cmluZ1tdXSB7XG4gICAgY29uc3QgZXh0ZXJuYWxFdmVudEhhbmRsZXJzID0gYmluZGluZ3MuZXh0ZXJuYWxFdmVudEhhbmRsZXJzLm1hcCgoZXZlbnQpID0+IHByb2Nlc3NGdW5jdGlvbihldmVudC5ib2R5KSk7XG4gICAgY29uc3QgaW5zdGFuY2VNZXRob2RzID0gYmluZGluZ3MuaW5zdGFuY2VNZXRob2RzLm1hcChwcm9jZXNzRnVuY3Rpb24pO1xuXG4gICAgY29uc3QgZ2xvYmFsTWV0aG9kcyA9IGJpbmRpbmdzLmdsb2JhbHMubWFwKChib2R5KSA9PiB7XG4gICAgICAgIGNvbnN0IGZ1bmNOYW1lID0gZ2V0RnVuY3Rpb25OYW1lKGJvZHkpO1xuXG4gICAgICAgIGlmIChmdW5jTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIGB3aW5kb3cuJHtmdW5jTmFtZX0gPSAke2JvZHl9YDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHByb2JhYmx5IGEgdmFyXG4gICAgICAgIHJldHVybiBib2R5O1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIFtleHRlcm5hbEV2ZW50SGFuZGxlcnMsIGluc3RhbmNlTWV0aG9kcywgZ2xvYmFsTWV0aG9kc107XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB2YW5pbGxhVG9WdWUoYmluZGluZ3M6IGFueSwgY29tcG9uZW50RmlsZU5hbWVzOiBzdHJpbmdbXSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgeyBwcm9wZXJ0aWVzIH0gPSBiaW5kaW5ncztcbiAgICBjb25zdCBpbXBvcnRzID0gZ2V0SW1wb3J0cyhjb21wb25lbnRGaWxlTmFtZXMsIGJpbmRpbmdzKTtcbiAgICBjb25zdCBbZXh0ZXJuYWxFdmVudEhhbmRsZXJzLCBpbnN0YW5jZU1ldGhvZHMsIGdsb2JhbE1ldGhvZHNdID0gZ2V0QWxsTWV0aG9kcyhiaW5kaW5ncyk7XG4gICAgY29uc3QgcGxhY2Vob2xkZXJzID0gT2JqZWN0LmtleXMoYmluZGluZ3MucGxhY2Vob2xkZXJzKTtcblxuICAgIGNvbnN0IG1ldGhvZHMgPSBpbnN0YW5jZU1ldGhvZHMuY29uY2F0KGV4dGVybmFsRXZlbnRIYW5kbGVycyk7XG5cbiAgICBsZXQgbWFpbkZpbGU6IHN0cmluZztcblxuICAgIGlmIChwbGFjZWhvbGRlcnMubGVuZ3RoIDw9IDEpIHtcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHByb3BlcnRpZXMuZmluZCgocCkgPT4gcC5uYW1lID09PSAnb3B0aW9ucycpO1xuICAgICAgICBjb25zdCB7IHByb3BlcnR5QXNzaWdubWVudHMsIHByb3BlcnR5VmFycywgcHJvcGVydHlBdHRyaWJ1dGVzIH0gPSBnZXRQcm9wZXJ0eUJpbmRpbmdzKGJpbmRpbmdzLCBvcHRpb25zKTtcbiAgICAgICAgbGV0IHRlbXBsYXRlID0gZ2V0VGVtcGxhdGUoYmluZGluZ3MsIHByb3BlcnR5QXR0cmlidXRlcyk7XG4gICAgICAgIHRlbXBsYXRlID0gdGVtcGxhdGVcbiAgICAgICAgICAgIC5zcGxpdCgnXFxuJylcbiAgICAgICAgICAgIC5tYXAoKHQpID0+IGAgICAgICAke3QudHJpbSgpfWApXG4gICAgICAgICAgICAuam9pbignXFxuJyk7XG5cbiAgICAgICAgbWFpbkZpbGUgPSBgXG4gICAgICAgICAgICAke2ltcG9ydHMuam9pbignXFxuJyl9XG5cbiAgICAgICAgICAgICR7Z2xvYmFsTWV0aG9kcy5qb2luKCdcXG5cXG4nKX1cblxuICAgICAgICAgICAgY29uc3QgQ2hhcnRFeGFtcGxlID0ge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlOiBcXGBcXG4gICAgJHt0ZW1wbGF0ZX1cXG4gIFxcYCxcbiAgICAgICAgICAgICAgICBjb21wb25lbnRzOiB7XG4gICAgICAgICAgICAgICAgICAgICdhZy1jaGFydHMtdnVlJzogQWdDaGFydHNWdWVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGRhdGEoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAke3Byb3BlcnR5VmFycy5qb2luKGAsXG4gICAgICAgICAgICAgICAgICAgICAgICBgKX1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJHtcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlBc3NpZ25tZW50cy5sZW5ndGggIT09IDBcbiAgICAgICAgICAgICAgICAgICAgICAgID8gYFxuICAgICAgICAgICAgICAgIGNyZWF0ZWQoKSB7XG4gICAgICAgICAgICAgICAgICAgICR7cHJvcGVydHlBc3NpZ25tZW50cy5qb2luKGA7XG4gICAgICAgICAgICAgICAgICAgIGApfVxuICAgICAgICAgICAgICAgIH0sYFxuICAgICAgICAgICAgICAgICAgICAgICAgOiAnJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAke1xuICAgICAgICAgICAgICAgICAgICBiaW5kaW5ncy5pbml0Lmxlbmd0aCAhPT0gMFxuICAgICAgICAgICAgICAgICAgICAgICAgPyBgXG4gICAgICAgICAgICAgICAgbW91bnRlZCgpIHtcbiAgICAgICAgICAgICAgICAgICAgJHtiaW5kaW5ncy5pbml0LmpvaW4oYDtcbiAgICAgICAgICAgICAgICAgICAgYCl9XG4gICAgICAgICAgICAgICAgfSxgXG4gICAgICAgICAgICAgICAgICAgICAgICA6ICcnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICR7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZHMubGVuZ3RoICE9PSAwXG4gICAgICAgICAgICAgICAgICAgICAgICA/IGBcbiAgICAgICAgICAgICAgICBtZXRob2RzOiB7XG4gICAgICAgICAgICAgICAgICAgICR7bWV0aG9kcy5tYXAoKHNuaXBwZXQpID0+IGAke3NuaXBwZXQudHJpbSgpfSxgKS5qb2luKGBcbiAgICAgICAgICAgICAgICAgICAgYCl9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBgXG4gICAgICAgICAgICAgICAgICAgICAgICA6ICcnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBuZXcgVnVlKHtcbiAgICAgICAgICAgICAgICBlbDogJyNhcHAnLFxuICAgICAgICAgICAgICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgICAgICAgICAgICAgJ215LWNvbXBvbmVudCc6IENoYXJ0RXhhbXBsZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICBgO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudHM6IEFycmF5PHsgc2VsZWN0b3I6IHN0cmluZzsgY2xhc3NOYW1lOiBzdHJpbmcgfT4gPSBbXTtcblxuICAgICAgICBsZXQgdGVtcGxhdGUgPSBiaW5kaW5ncy50ZW1wbGF0ZS50cmltKCk7XG4gICAgICAgIE9iamVjdC5lbnRyaWVzKGJpbmRpbmdzLnBsYWNlaG9sZGVycykuZm9yRWFjaCgoW2lkLCBwbGFjZWhvbGRlcl0pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNlbGVjdG9yID0gdG9LZWJhYkNhc2UoaWQpO1xuICAgICAgICAgICAgY29uc3QgeyBzdHlsZSB9ID0gYmluZGluZ3MuY2hhcnRBdHRyaWJ1dGVzW2lkXTtcbiAgICAgICAgICAgIHRlbXBsYXRlID0gdGVtcGxhdGUucmVwbGFjZShwbGFjZWhvbGRlciwgYDwke3NlbGVjdG9yfSBzdHlsZT1cIiR7c3R5bGV9XCI+PC8ke3NlbGVjdG9yfT5gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlbXBsYXRlID0gYDxkaXYgc3R5bGU9XCJkaXNwbGF5OiBncmlkOyBncmlkOiBpbmhlcml0XCI+XFxuJHt0ZW1wbGF0ZX1cXG48L2Rpdj5gO1xuXG4gICAgICAgIG1haW5GaWxlID0gYFxuICAgICAgICAgICAgJHtpbXBvcnRzLmpvaW4oJ1xcbicpfVxuXG4gICAgICAgICAgICAke2dsb2JhbE1ldGhvZHMuam9pbignXFxuXFxuJyl9XG4gICAgICAgIGA7XG5cbiAgICAgICAgcGxhY2Vob2xkZXJzLmZvckVhY2goKGlkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzZWxlY3RvciA9IHRvS2ViYWJDYXNlKGlkKTtcbiAgICAgICAgICAgIGNvbnN0IGNsYXNzTmFtZSA9IHRvVGl0bGVDYXNlKGlkKTtcblxuICAgICAgICAgICAgY29uc3QgcHJvcGVydHlOYW1lID0gYmluZGluZ3MuY2hhcnRQcm9wZXJ0aWVzW2lkXTtcbiAgICAgICAgICAgIGNvbnN0IHsgcHJvcGVydHlWYXJzLCBwcm9wZXJ0eUF0dHJpYnV0ZXMgfSA9IGdldFByb3BlcnR5QmluZGluZ3MoXG4gICAgICAgICAgICAgICAgYmluZGluZ3MsXG4gICAgICAgICAgICAgICAgcHJvcGVydGllcy5maW5kKChwKSA9PiBwLm5hbWUgPT09IHByb3BlcnR5TmFtZSlcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IGdldFZ1ZVRhZyhiaW5kaW5ncywgcHJvcGVydHlBdHRyaWJ1dGVzKTtcblxuICAgICAgICAgICAgbWFpbkZpbGUgPSBgJHttYWluRmlsZX1cblxuICAgICAgICAgICAgY29uc3QgJHtjbGFzc05hbWV9ID0ge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlOiBcXGBcXG4ke2luZGVudFRlbXBsYXRlKHRlbXBsYXRlLCAyLCAyKX1cXG4gIFxcYCxcbiAgICAgICAgICAgICAgICBjb21wb25lbnRzOiB7XG4gICAgICAgICAgICAgICAgICAgICdhZy1jaGFydHMtdnVlJzogQWdDaGFydHNWdWVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGRhdGEoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAke3Byb3BlcnR5VmFycy5qb2luKGAsXG4gICAgICAgICAgICAgICAgICAgICAgICBgKX1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBgO1xuXG4gICAgICAgICAgICBjb21wb25lbnRzLnB1c2goeyBzZWxlY3RvciwgY2xhc3NOYW1lIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBtYWluRmlsZSA9IGAke21haW5GaWxlfVxuXG4gICAgICAgIGNvbnN0IENoYXJ0RXhhbXBsZSA9IHtcbiAgICAgICAgICAgIHRlbXBsYXRlOiBcXGBcXG4ke2luZGVudFRlbXBsYXRlKHRlbXBsYXRlLCAyLCAyKX1cXG4gIFxcYCxcbiAgICAgICAgICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgICAgICAgICAke2NvbXBvbmVudHMubWFwKChjKSA9PiBgJyR7Yy5zZWxlY3Rvcn0nOiAke2MuY2xhc3NOYW1lfWApLmpvaW4oYCxcbiAgICAgICAgICAgICAgICBgKX1cbiAgICAgICAgICAgIH0sXG4gICAgICAgIH1cblxuICAgICAgICBuZXcgVnVlKHtcbiAgICAgICAgICAgIGVsOiAnI2FwcCcsXG4gICAgICAgICAgICBjb21wb25lbnRzOiB7XG4gICAgICAgICAgICAgICAgJ215LWNvbXBvbmVudCc6IENoYXJ0RXhhbXBsZVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgYDtcbiAgICB9XG5cbiAgICBpZiAoYmluZGluZ3MudXNlc0NoYXJ0QXBpKSB7XG4gICAgICAgIG1haW5GaWxlID0gbWFpbkZpbGUucmVwbGFjZSgvQWdDaGFydHMuKFxcdyopXFwoKFxcdyopKCx8XFwpKS9nLCAnQWdDaGFydHMuJDEodGhpcy4kcmVmcy5hZ0NoYXJ0cy5jaGFydCQzJyk7XG4gICAgICAgIG1haW5GaWxlID0gbWFpbkZpbGUucmVwbGFjZShcbiAgICAgICAgICAgIC9cXCh0aGlzLlxcJHJlZnMuYWdDaGFydHMuY2hhcnQsIG9wdGlvbnMvZyxcbiAgICAgICAgICAgICcodGhpcy4kcmVmcy5hZ0NoYXJ0cy5jaGFydCwgdGhpcy5vcHRpb25zJ1xuICAgICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBtYWluRmlsZTtcbn1cbiJdLCJuYW1lcyI6WyJ2YW5pbGxhVG9WdWUiLCJwcm9jZXNzRnVuY3Rpb24iLCJjb2RlIiwid3JhcE9wdGlvbnNVcGRhdGVDb2RlIiwicmVtb3ZlRnVuY3Rpb25LZXl3b3JkIiwiZ2V0SW1wb3J0cyIsImNvbXBvbmVudEZpbGVOYW1lcyIsImJpbmRpbmdzIiwiaW1wb3J0cyIsImNoYXJ0SW1wb3J0IiwiZ2V0Q2hhcnRJbXBvcnRzIiwidXNlc0NoYXJ0QXBpIiwicHVzaCIsIm1hcCIsImdldEltcG9ydCIsImNoYXJ0U2V0dGluZ3MiLCJlbnRlcnByaXNlIiwiZ2V0UHJvcGVydHlCaW5kaW5ncyIsInByb3BlcnR5IiwicHJvcGVydHlBc3NpZ25tZW50cyIsInByb3BlcnR5VmFycyIsInByb3BlcnR5QXR0cmlidXRlcyIsIm5hbWUiLCJ2YWx1ZSIsImdldFZ1ZVRhZyIsImF0dHJpYnV0ZXMiLCJqb2luIiwiZ2V0VGVtcGxhdGUiLCJhZ0NoYXJ0VGFnIiwidGVtcGxhdGUiLCJPYmplY3QiLCJ2YWx1ZXMiLCJwbGFjZWhvbGRlcnMiLCJmb3JFYWNoIiwicGxhY2Vob2xkZXIiLCJyZXBsYWNlIiwiY29udmVydFRlbXBsYXRlIiwiZ2V0QWxsTWV0aG9kcyIsImV4dGVybmFsRXZlbnRIYW5kbGVycyIsImV2ZW50IiwiYm9keSIsImluc3RhbmNlTWV0aG9kcyIsImdsb2JhbE1ldGhvZHMiLCJnbG9iYWxzIiwiZnVuY05hbWUiLCJnZXRGdW5jdGlvbk5hbWUiLCJwcm9wZXJ0aWVzIiwia2V5cyIsIm1ldGhvZHMiLCJjb25jYXQiLCJtYWluRmlsZSIsImxlbmd0aCIsIm9wdGlvbnMiLCJmaW5kIiwicCIsInNwbGl0IiwidCIsInRyaW0iLCJpbml0Iiwic25pcHBldCIsImNvbXBvbmVudHMiLCJlbnRyaWVzIiwiaWQiLCJzZWxlY3RvciIsInRvS2ViYWJDYXNlIiwic3R5bGUiLCJjaGFydEF0dHJpYnV0ZXMiLCJjbGFzc05hbWUiLCJ0b1RpdGxlQ2FzZSIsInByb3BlcnR5TmFtZSIsImNoYXJ0UHJvcGVydGllcyIsImluZGVudFRlbXBsYXRlIiwiYyJdLCJtYXBwaW5ncyI6Ijs7OzsrQkF5RXNCQTs7O2VBQUFBOzs7NEJBekVpQzs2QkFDa0I7NkJBQ2hDOzBCQUM0RDtBQUVyRyxTQUFTQyxnQkFBZ0JDLElBQVk7SUFDakMsT0FBT0MsSUFBQUEsaUNBQXFCLEVBQUNDLElBQUFBLGtDQUFxQixFQUFDRjtBQUN2RDtBQUVBLFNBQVNHLFdBQVdDLGtCQUE0QixFQUFFQyxRQUFRO0lBQ3RELE1BQU1DLFVBQVU7UUFBQztRQUEwQjtLQUErQztJQUUxRixNQUFNQyxjQUFjQyxJQUFBQSwyQkFBZSxFQUFDSCxTQUFTQyxPQUFPLEVBQUVELFNBQVNJLFlBQVk7SUFDM0UsSUFBSUYsYUFBYTtRQUNiRCxRQUFRSSxJQUFJLENBQUNIO0lBQ2pCO0lBRUEsSUFBSUgsb0JBQW9CO1FBQ3BCRSxRQUFRSSxJQUFJLElBQUlOLG1CQUFtQk8sR0FBRyxDQUFDQyxtQkFBUztJQUNwRDtJQUVBLElBQUlQLFNBQVNRLGFBQWEsQ0FBQ0MsVUFBVSxFQUFFO1FBQ25DUixRQUFRSSxJQUFJLENBQUM7SUFDakI7SUFFQSxPQUFPSjtB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